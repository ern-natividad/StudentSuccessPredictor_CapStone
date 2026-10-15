import argparse
import json
import os
import re
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from supabase import create_client

TARGET_PROGRAMS = {
    "BS Agricultural and Biosystems Engineering",
    "BS Computer Engineering",
    "BS Electrical Engineering",
}
NUMERIC_GRADES = (1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 5)
SEMESTER_ORDER = {"1": 1, "2": 2, "S": 3}
FEATURE_NAMES = (
    "cumulative_gwa",
    "previous_term_gwa",
    "recent_trend",
    "completed_course_count",
    "failed_course_count",
    "incomplete_count",
    "withdrawal_count",
    "previous_term_count",
    "historical_term_count",
)


def normalize_grade(value: Any) -> str | None:
    raw = str(value or "").strip().upper()
    if raw in {"INC", "AW", "UW"}:
        return raw

    completed_inc = re.fullmatch(
        r"INC\s*\(\s*(?:COMPLETED|COMPLIED)\s*:\s*(.*?)\s*\)",
        raw,
    )
    grade_text = completed_inc.group(1) if completed_inc else raw
    try:
        numeric = float(grade_text)
    except (TypeError, ValueError):
        return None
    matched = next(
        (grade for grade in NUMERIC_GRADES if abs(grade - numeric) < 0.001),
        None,
    )
    return str(matched) if matched is not None else None


def normalize_course_code(value: Any) -> str:
    return re.sub(r"[^A-Z0-9]", "", str(value or "").upper())


def normalize_semester(value: Any) -> str | None:
    normalized = re.sub(r"\s+", "", str(value or "").upper())
    if normalized in {"1", "1S", "1STSEMESTER"}:
        return "1"
    if normalized in {"2", "2S", "2NDSEMESTER"}:
        return "2"
    if normalized in {"S", "SUMMER"}:
        return "S"
    return None


def parse_school_year(value: Any) -> int | None:
    match = re.fullmatch(r"\s*(\d{4})\s*[-–/]\s*(\d{4})\s*", str(value or ""))
    if not match:
        return None
    start, end = map(int, match.groups())
    return start if end == start + 1 else None


def build_course_units(curricula: list[dict[str, Any]]) -> dict[tuple[str, int, str, str], float | None]:
    units_by_course: dict[tuple[str, int, str, str], set[float]] = defaultdict(set)
    for curriculum in curricula:
        program = str(curriculum.get("program") or "").strip()
        cohort_start = parse_school_year(curriculum.get("academic_year"))
        if not program or cohort_start is None:
            continue
        for course in curriculum.get("courses") or []:
            year_match = re.search(r"\d+", str(course.get("yearLevel") or ""))
            semester = normalize_semester(course.get("semester"))
            code = normalize_course_code(course.get("code"))
            try:
                units = float(course.get("units"))
            except (TypeError, ValueError):
                continue
            if not year_match or not semester or not code or units <= 0:
                continue
            year_level = int(year_match.group())
            school_year_start = cohort_start + year_level - 1
            units_by_course[(program, school_year_start, semester, code)].add(units)

    return {
        key: next(iter(values)) if len(values) == 1 else None
        for key, values in units_by_course.items()
    }


def _weighted_gwa(records: list[dict[str, Any]]) -> float | None:
    weighted_total = sum(float(row["grade"]) * row["units"] for row in records)
    total_units = sum(row["units"] for row in records)
    return weighted_total / total_units if total_units else None


def prepare_student_terms(
    students: list[dict[str, Any]],
    grades: list[dict[str, Any]],
    curricula: list[dict[str, Any]],
) -> tuple[
    dict[str, str],
    dict[str, dict[tuple[int, int], list[dict[str, Any]]]],
    dict[str, int],
]:
    student_program = {
        str(row["user_id"]): str(row.get("program") or "").strip()
        for row in students
        if row.get("user_id") and row.get("program") in TARGET_PROGRAMS
    }
    course_units = build_course_units(curricula)
    by_student_term: dict[str, dict[tuple[int, int], list[dict[str, Any]]]] = defaultdict(
        lambda: defaultdict(list)
    )
    stats = {"rows_seen": 0, "numeric_rows_used": 0, "status_rows_seen": 0, "rows_without_curriculum_units": 0}

    for row in grades:
        stats["rows_seen"] += 1
        user_id = str(row.get("user_id") or "")
        program = student_program.get(user_id)
        school_year_start = parse_school_year(row.get("school_year"))
        semester = normalize_semester(row.get("semester"))
        grade = normalize_grade(row.get("grade"))
        if not program or school_year_start is None or semester is None or not grade:
            continue
        if grade in {"INC", "AW", "UW"}:
            stats["status_rows_seen"] += 1
            by_student_term[user_id][
                (school_year_start, SEMESTER_ORDER[semester])
            ].append({"status": grade})
            continue

        units = course_units.get(
            (
                program,
                school_year_start,
                semester,
                normalize_course_code(row.get("subject_code")),
            )
        )
        if units is None:
            stats["rows_without_curriculum_units"] += 1
            continue
        stats["numeric_rows_used"] += 1
        by_student_term[user_id][
            (school_year_start, SEMESTER_ORDER[semester])
        ].append({"grade": float(grade), "units": units})

    return student_program, by_student_term, stats


def features_from_history(
    history: list[list[dict[str, Any]]],
    program: str,
    program_categories: list[str],
) -> dict[str, float] | None:
    numeric_history = [
        row
        for prior_term in history
        for row in prior_term
        if "grade" in row
    ]
    numeric_terms = [
        rows for rows in history if any("grade" in row for row in rows)
    ]
    if not numeric_history or not numeric_terms:
        return None

    previous_term_rows = [
        row for row in numeric_terms[-1] if "grade" in row
    ]
    previous_term_gwa = _weighted_gwa(previous_term_rows)
    if previous_term_gwa is None:
        return None

    recent_trend = 0.0
    if len(numeric_terms) > 1:
        previous_gwa = _weighted_gwa(
            [row for row in numeric_terms[-2] if "grade" in row]
        )
        if previous_gwa is not None:
            recent_trend = previous_term_gwa - previous_gwa

    features = {
        "cumulative_gwa": _weighted_gwa(numeric_history),
        "previous_term_gwa": previous_term_gwa,
        "recent_trend": recent_trend,
        "completed_course_count": float(len(numeric_history)),
        "failed_course_count": float(
            sum(float(row["grade"]) > 3 for row in numeric_history)
        ),
        "incomplete_count": float(
            sum(
                row.get("status") == "INC"
                for prior_term in history
                for row in prior_term
            )
        ),
        "withdrawal_count": float(
            sum(
                row.get("status") in {"AW", "UW"}
                for prior_term in history
                for row in prior_term
            )
        ),
        "previous_term_count": float(len(previous_term_rows)),
        "historical_term_count": float(len(numeric_terms)),
    }
    features.update(
        {
            f"program::{category}": float(category == program)
            for category in program_categories
        }
    )
    return features


def create_training_examples(
    students: list[dict[str, Any]],
    grades: list[dict[str, Any]],
    curricula: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], dict[str, int]]:
    student_program, by_student_term, stats = prepare_student_terms(
        students, grades, curricula
    )
    program_categories = sorted(TARGET_PROGRAMS)
    examples: list[dict[str, Any]] = []
    for user_id, terms in by_student_term.items():
        history: list[list[dict[str, Any]]] = []
        for term in sorted(terms):
            target_gwa = _weighted_gwa(
                [row for row in terms[term] if "grade" in row]
            )
            features = features_from_history(
                history,
                student_program[user_id],
                program_categories,
            )
            if target_gwa is not None and features:
                examples.append(
                    {
                        "student_group": user_id,
                        "features": features,
                        "target_gwa": target_gwa,
                    }
                )
            history.append(terms[term])

    return examples, stats


def create_latest_predictions(
    students: list[dict[str, Any]],
    grades: list[dict[str, Any]],
    curricula: list[dict[str, Any]],
) -> tuple[dict[str, dict[str, Any]], dict[str, int]]:
    student_program, by_student_term, stats = prepare_student_terms(
        students, grades, curricula
    )
    program_categories = sorted(TARGET_PROGRAMS)
    predictions = {}
    for user_id, terms in by_student_term.items():
        ordered_terms = sorted(terms)
        history = [terms[term] for term in ordered_terms]
        features = features_from_history(
            history,
            student_program[user_id],
            program_categories,
        )
        if not features:
            continue
        numeric_history = [
            row
            for term_rows in history
            for row in term_rows
            if "grade" in row
        ]
        predictions[user_id] = {
            "features": features,
            "current_gwa": _weighted_gwa(numeric_history),
            "grade_count": len(numeric_history),
            "source_term": ordered_terms[-1],
        }
    return predictions, stats


def _score_predictions(actual: np.ndarray, predicted: np.ndarray) -> dict[str, float]:
    clipped = np.clip(predicted, 1, 5)
    return {
        "mae": round(float(mean_absolute_error(actual, clipped)), 4),
        "rmse": round(float(np.sqrt(mean_squared_error(actual, clipped))), 4),
        "r2": round(float(r2_score(actual, clipped)), 4),
    }


def evaluate_models(examples: list[dict[str, Any]]) -> dict[str, Any]:
    groups = np.array([example["student_group"] for example in examples])
    if len(set(groups)) < 5 or len(examples) < 10:
        raise ValueError("Training needs at least 10 examples from 5 distinct students.")

    feature_names = list(examples[0]["features"])
    x = np.array(
        [[example["features"][name] for name in feature_names] for example in examples],
        dtype=float,
    )
    y = np.array([example["target_gwa"] for example in examples], dtype=float)
    splitter = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_indices, test_indices = next(splitter.split(x, y, groups))
    models = {
        "Random Forest": RandomForestRegressor(
            n_estimators=300,
            min_samples_leaf=3,
            random_state=42,
            n_jobs=-1,
        ),
        "Gradient Boosting": GradientBoostingRegressor(
            n_estimators=150,
            learning_rate=0.04,
            max_depth=2,
            min_samples_leaf=3,
            random_state=42,
        ),
        "Ridge Regression": make_pipeline(StandardScaler(), Ridge(alpha=1.0)),
    }

    actual = y[test_indices]
    scores: dict[str, dict[str, float]] = {
        "Last-term baseline": _score_predictions(
            actual,
            x[test_indices, feature_names.index("previous_term_gwa")],
        )
    }
    trained_models = {}
    for name, model in models.items():
        model.fit(x[train_indices], y[train_indices])
        scores[name] = _score_predictions(actual, model.predict(x[test_indices]))
        trained_models[name] = model

    best_model_name = min(
        models,
        key=lambda name: scores[name]["mae"],
    )
    recommended_model = (
        best_model_name
        if scores[best_model_name]["mae"] < scores["Last-term baseline"]["mae"]
        else "Last-term baseline"
    )
    return {
        "feature_names": feature_names,
        "scores": scores,
        "best_model_name": best_model_name,
        "recommended_model": recommended_model,
        "sample_count": len(examples),
        "train_student_count": len(set(groups[train_indices])),
        "test_student_count": len(set(groups[test_indices])),
        "test_sample_count": len(test_indices),
        "models": trained_models,
    }


def _fetch_all(client: Any, table: str, columns: str, filters: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    page_size = 1000
    for offset in range(0, 100000, page_size):
        query = client.from_(table).select(columns)
        for column, value in (filters or {}).items():
            query = query.eq(column, value)
        response = query.range(offset, offset + page_size - 1).execute()
        if response.data is None:
            raise RuntimeError(f"Database returned no data while reading {table}.")
        rows.extend(response.data)
        if len(response.data) < page_size:
            return rows
    raise RuntimeError(f"Exceeded the 100,000-row safety limit while reading {table}.")


def fetch_database_data(client: Any) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    students = _fetch_all(client, "student_info", "user_id, program")
    students = [
        row for row in students if row.get("program") in TARGET_PROGRAMS and row.get("user_id")
    ]
    user_ids = [row["user_id"] for row in students]
    grades: list[dict[str, Any]] = []
    for start in range(0, len(user_ids), 50):
        batch = user_ids[start : start + 50]
        page_size = 1000
        for offset in range(0, 100000, page_size):
            response = (
                client.from_("student_grades")
                .select("user_id, subject_code, school_year, semester, grade")
                .in_("user_id", batch)
                .range(offset, offset + page_size - 1)
                .execute()
            )
            if response.data is None:
                raise RuntimeError("Database returned no data while reading student_grades.")
            grades.extend(response.data)
            if len(response.data) < page_size:
                break
        else:
            raise RuntimeError("Exceeded the 100,000-row safety limit for a student batch.")

    curricula = _fetch_all(
        client,
        "curricula",
        "program, academic_year, courses",
        {"status": "Published"},
    )
    return students, grades, curricula


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Train and compare next-semester GWA models from database grade history."
    )
    parser.add_argument("--save", action="store_true", help="Save the trained prototype artifact.")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).with_name("student_gpa_models.joblib"),
    )
    args = parser.parse_args()

    supabase_url = os.environ.get("SUPABASE_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not service_key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.")
    client = create_client(supabase_url, service_key)
    students, grades, curricula = fetch_database_data(client)
    examples, data_stats = create_training_examples(students, grades, curricula)
    evaluation = evaluate_models(examples)

    report = {
        "dataset": {
            "students_with_profiles": len(students),
            "students_with_training_examples": len(
                {example["student_group"] for example in examples}
            ),
            **data_stats,
        },
        "evaluation": {
            key: value
            for key, value in evaluation.items()
            if key != "models" and key != "feature_names"
        },
        "note": (
            "Prototype evaluation only: all supplied files are one 2023 cohort. "
            "The test set holds out students but is not an independent future cohort."
        ),
    }

    if args.save:
        bundle = {
            "models": evaluation["models"],
            "model_name": evaluation["best_model_name"],
            "feature_names": evaluation["feature_names"],
            "metrics": evaluation["scores"],
            "recommended_model": evaluation["recommended_model"],
            "evaluation_summary": {
                key: evaluation[key]
                for key in (
                    "sample_count",
                    "train_student_count",
                    "test_student_count",
                    "test_sample_count",
                )
            },
            "created_at": datetime.now(timezone.utc).isoformat(),
            "model_version": f"hawkpredict-gwa-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
            "prototype_only": True,
        }
        args.output.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(bundle, args.output)
        report["saved_artifact"] = str(args.output)
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
