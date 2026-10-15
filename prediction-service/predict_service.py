import asyncio
import logging
import os
from pathlib import Path
from typing import Any

import joblib
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from supabase import Client, create_client

from training_pipeline import (
    TARGET_PROGRAMS,
    create_latest_predictions,
)

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("prediction-service")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
MODEL_PATH = Path(os.getenv("MODEL_PATH", "student_risk_model.pkl"))
GPA_MODEL_PATH = Path(
    os.getenv("GPA_MODEL_PATH", Path(__file__).with_name("student_gpa_models.joblib"))
)
STUDENT_TABLE = os.getenv("STUDENT_TABLE", "users")
STUDENT_ID_COLUMN = os.getenv("STUDENT_ID_COLUMN", "id")
SERVICE_SECRET = os.getenv("PREDICTION_SERVICE_SECRET", "")

app = FastAPI(title="HawkPredict Prediction Service", version="1.0.0")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
model: Any = None
gwa_bundle: dict[str, Any] | None = None


class PredictionRequest(BaseModel):
    user_ids: list[str] = Field(min_length=1, max_length=5000)


@app.on_event("startup")
async def load_model() -> None:
    global model, gwa_bundle
    if MODEL_PATH.exists():
        model = await asyncio.to_thread(joblib.load, MODEL_PATH)
        if not hasattr(model, "predict_proba"):
            raise RuntimeError("The risk model must implement predict_proba().")
    if GPA_MODEL_PATH.exists():
        gwa_bundle = await asyncio.to_thread(joblib.load, GPA_MODEL_PATH)
        if not isinstance(gwa_bundle.get("models"), dict):
            raise RuntimeError("The GWA model artifact must contain all trained models.")
        if not gwa_bundle.get("feature_names"):
            raise RuntimeError("The GWA model artifact is missing its feature schema.")
    if model is None and gwa_bundle is None:
        logger.warning("No prediction model artifacts were found; prediction endpoints are unavailable.")


def _numeric_grade(value: Any) -> float | None:
    try:
        grade = float(value)
    except (TypeError, ValueError):
        return None
    return grade if 1 <= grade <= 5 else None


def extract_features(grades: list[dict[str, Any]]) -> dict[str, float]:
    numeric_grades = [grade for row in grades if (grade := _numeric_grade(row.get("grade"))) is not None]
    failed_units = sum(
        1
        for row in grades
        if (_numeric_grade(row.get("grade")) or 0) > 3
        or str(row.get("remarks", "")).strip().lower() in {"fail", "failed", "drop"}
    )
    return {
        "gwa": sum(numeric_grades) / len(numeric_grades) if numeric_grades else 5.0,
        "total_failed_units": float(failed_units),
        "course_completion_count": float(len(numeric_grades)),
    }


def classify_risk(success_rate: float) -> str:
    if success_rate >= 75:
        return "Low Risk"
    if success_rate >= 50:
        return "Moderate Risk"
    return "High Risk"


def predict_one(grades: list[dict[str, Any]]) -> tuple[str, float, dict[str, float]]:
    if model is None:
        raise RuntimeError("The risk classification model is not configured.")
    features = extract_features(grades)
    feature_vector = [[features["gwa"], features["total_failed_units"], features["course_completion_count"]]]
    probabilities = model.predict_proba(feature_vector)[0]
    classes = list(getattr(model, "classes_", range(len(probabilities))))
    success_index = next(
        (index for index, label in enumerate(classes) if str(label).lower() in {"1", "true", "success", "pass"}),
        len(probabilities) - 1,
    )
    success_rate = round(float(probabilities[success_index]) * 100, 2)
    return classify_risk(success_rate), success_rate, features


async def fetch_grades(user_id: str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    page_size = 1000
    for offset in range(0, 100000, page_size):
        response = await asyncio.to_thread(
            lambda offset=offset: supabase.from_("student_grades")
            .select("user_id, grade, remarks, subject_code, school_year, semester")
            .eq("user_id", user_id)
            .order("created_at", desc=False)
            .range(offset, offset + page_size - 1)
            .execute()
        )
        if response.data is None:
            raise RuntimeError(f"Unable to load grade history for {user_id}")
        rows.extend(response.data)
        if len(response.data) < page_size:
            return rows
    raise RuntimeError(f"Grade history for {user_id} exceeded the 100,000-row limit.")


def _fetch_forecast_inputs(user_ids: list[str]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    students: list[dict[str, Any]] = []
    grades: list[dict[str, Any]] = []
    batch_size = 50
    page_size = 1000
    for start in range(0, len(user_ids), batch_size):
        batch = user_ids[start : start + batch_size]
        response = (
            supabase.from_("student_info")
            .select("user_id, program")
            .in_("user_id", batch)
            .execute()
        )
        if response.data is None:
            raise RuntimeError("Unable to load student program profiles.")
        students.extend(
            row
            for row in response.data
            if str(row.get("program") or "").strip() in TARGET_PROGRAMS
        )

        for offset in range(0, 100000, page_size):
            grade_response = (
                supabase.from_("student_grades")
                .select("user_id, grade, subject_code, school_year, semester")
                .in_("user_id", batch)
                .order("created_at", desc=False)
                .range(offset, offset + page_size - 1)
                .execute()
            )
            if grade_response.data is None:
                raise RuntimeError("Unable to load student grade histories.")
            grades.extend(grade_response.data)
            if len(grade_response.data) < page_size:
                break
        else:
            raise RuntimeError("Student grade history exceeded the 100,000-row limit.")
    return students, grades


async def fetch_published_curricula() -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    page_size = 1000
    for offset in range(0, 100000, page_size):
        response = await asyncio.to_thread(
            lambda offset=offset: supabase.from_("curricula")
            .select("program, academic_year, courses")
            .eq("status", "Published")
            .range(offset, offset + page_size - 1)
            .execute()
        )
        if response.data is None:
            raise RuntimeError("Unable to load published curricula.")
        rows.extend(response.data)
        if len(response.data) < page_size:
            return rows
    raise RuntimeError("Published curricula exceeded the 100,000-row limit.")


def next_academic_term(source_term: tuple[int, int]) -> tuple[str, str]:
    start_year, semester_order = source_term
    if semester_order == 1:
        target_year, target_semester = start_year, "2"
    elif semester_order == 2:
        target_year, target_semester = start_year, "Summer"
    else:
        target_year, target_semester = start_year + 1, "1"
    return f"{target_year}-{target_year + 1}", target_semester


async def save_gwa_forecasts(predictions: list[dict[str, Any]]) -> None:
    if not predictions:
        return
    records = [
        {
            "user_id": prediction["user_id"],
            "source_school_year": prediction["source_school_year"],
            "source_semester": prediction["source_semester"],
            "target_school_year": prediction["target_school_year"],
            "target_semester": prediction["target_semester"],
            "current_gwa": prediction["current_gwa"],
            "predicted_gwa": prediction["predicted_gwa"],
            "model_predictions": prediction["model_predictions"],
            "selected_model": prediction["selected_model"],
            "model_version": prediction["model_version"],
            "evaluation_metrics": prediction["evaluation_metrics"],
        }
        for prediction in predictions
    ]
    for start in range(0, len(records), 200):
        response = await asyncio.to_thread(
            lambda batch=records[start : start + 200]: supabase.from_(
                "student_gpa_predictions"
            )
            .upsert(
                batch,
                on_conflict="user_id,target_school_year,target_semester,model_version",
            )
            .execute()
        )
        if getattr(response, "error", None):
            raise RuntimeError(f"Unable to save GWA forecasts: {response.error}")


def predict_gwa_from_student_data(
    bundle: dict[str, Any],
    student_data: dict[str, Any] | None,
) -> dict[str, Any] | None:
    if not student_data or student_data["current_gwa"] is None:
        return None
    feature_names = bundle["feature_names"]
    feature_values = student_data["features"]
    if set(feature_values) != set(feature_names):
        raise RuntimeError("The saved model feature schema does not match current prediction features.")
    feature_vector = [[feature_values[name] for name in feature_names]]
    model_predictions = {
        name: round(
            float(max(1, min(5, model.predict(feature_vector)[0]))),
            2,
        )
        for name, model in bundle["models"].items()
    }

    selected_model = bundle["recommended_model"]
    if selected_model == "Last-term baseline":
        predicted_gwa = round(float(student_data["features"]["previous_term_gwa"]), 2)
    else:
        if selected_model not in model_predictions:
            raise RuntimeError(f"Recommended model {selected_model!r} is absent from the artifact.")
        predicted_gwa = model_predictions[selected_model]

    source_year, source_semester_order = student_data["source_term"]
    source_semester = {1: "1", 2: "2", 3: "Summer"}[source_semester_order]
    target_school_year, target_semester = next_academic_term(
        student_data["source_term"]
    )
    return {
        "current_gwa": round(float(student_data["current_gwa"]), 2),
        "predicted_gwa": predicted_gwa,
        "model_predictions": model_predictions,
        "selected_model": selected_model,
        "source_school_year": f"{source_year}-{source_year + 1}",
        "source_semester": source_semester,
        "target_school_year": target_school_year,
        "target_semester": target_semester,
        "grade_count": student_data["grade_count"],
        "model_version": bundle["model_version"],
        "evaluation_metrics": bundle["metrics"],
        "prototype_only": bool(bundle.get("prototype_only", True)),
        "method": "hawkpredict-gwa",
    }


def predict_gwa(
    bundle: dict[str, Any],
    student: dict[str, Any],
    grades: list[dict[str, Any]],
    curricula: list[dict[str, Any]],
) -> dict[str, Any] | None:
    latest, _stats = create_latest_predictions([student], grades, curricula)
    return predict_gwa_from_student_data(bundle, latest.get(str(student["user_id"])))


async def save_prediction(user_id: str, risk_level: str, success_rate: float) -> None:
    response = await asyncio.to_thread(
        lambda: supabase.from_(STUDENT_TABLE)
        .update({"risk_level": risk_level, "success_rate": success_rate})
        .eq(STUDENT_ID_COLUMN, user_id)
        .select(STUDENT_ID_COLUMN)
        .execute()
    )
    if not getattr(response, "data", None):
        raise RuntimeError(f"Unable to update prediction for {user_id}")


@app.get("/health")
async def health() -> dict[str, str]:
    return {
        "status": "ok",
        "risk_model": MODEL_PATH.name if model is not None else "unavailable",
        "gwa_model": GPA_MODEL_PATH.name if gwa_bundle is not None else "unavailable",
    }


@app.get("/model-info")
async def get_model_info(
    x_prediction_service_key: str | None = Header(default=None),
) -> dict[str, Any]:
    if SERVICE_SECRET and x_prediction_service_key != SERVICE_SECRET:
        raise HTTPException(status_code=401, detail="Invalid prediction service key.")
    if gwa_bundle is None:
        raise HTTPException(status_code=503, detail="The HawkPredict GWA model artifact is not configured.")
    return {
        "model_version": gwa_bundle["model_version"],
        "selected_model": gwa_bundle["recommended_model"],
        "metrics": gwa_bundle["metrics"],
        "evaluation_summary": gwa_bundle.get("evaluation_summary", {}),
        "prototype_only": bool(gwa_bundle.get("prototype_only", True)),
        "note": (
            "Prototype evaluation only. The supplied grade files are from one cohort, "
            "so the student-group holdout does not establish future-cohort performance."
        ),
    }


@app.post("/predict")
async def predict(request: PredictionRequest, x_prediction_service_key: str | None = Header(default=None)) -> dict[str, Any]:
    if SERVICE_SECRET and x_prediction_service_key != SERVICE_SECRET:
        raise HTTPException(status_code=401, detail="Invalid prediction service key.")
    if model is None:
        raise HTTPException(status_code=503, detail="The risk classification model is not configured.")

    results = []
    for user_id in dict.fromkeys(request.user_ids):
        try:
            grades = await fetch_grades(user_id)
            if not grades:
                results.append({"user_id": user_id, "status": "skipped", "reason": "no grades"})
                continue
            risk_level, success_rate, features = await asyncio.to_thread(predict_one, grades)
            await save_prediction(user_id, risk_level, success_rate)
            results.append({
                "user_id": user_id,
                "status": "updated",
                "risk_level": risk_level,
                "success_rate": success_rate,
                "features": features,
            })
        except Exception as error:
            logger.exception("Prediction failed for %s", user_id)
            raise HTTPException(status_code=502, detail=f"Prediction failed for {user_id}: {error}") from error

    return {"processed": len(results), "results": results}


@app.post("/forecast")
async def forecast(
    request: PredictionRequest,
    x_prediction_service_key: str | None = Header(default=None),
) -> dict[str, Any]:
    if SERVICE_SECRET and x_prediction_service_key != SERVICE_SECRET:
        raise HTTPException(status_code=401, detail="Invalid prediction service key.")
    if gwa_bundle is None:
        raise HTTPException(status_code=503, detail="The HawkPredict GWA model artifact is not configured.")

    curricula, (students, grades) = await asyncio.gather(
        fetch_published_curricula(),
        asyncio.to_thread(_fetch_forecast_inputs, list(dict.fromkeys(request.user_ids))),
    )
    latest_predictions, _stats = await asyncio.to_thread(
        create_latest_predictions,
        students,
        grades,
        curricula,
    )
    students_by_id = {str(student["user_id"]): student for student in students}
    results = []
    forecasts_to_save = []
    for user_id in dict.fromkeys(request.user_ids):
        try:
            if user_id not in students_by_id:
                results.append({
                    "user_id": user_id,
                    "status": "skipped",
                    "reason": "student has no supported engineering program profile",
                })
                continue
            prediction = predict_gwa_from_student_data(
                gwa_bundle,
                latest_predictions.get(user_id),
            )
            if prediction is None:
                results.append({
                    "user_id": user_id,
                    "status": "skipped",
                    "reason": "not enough numeric grades matched to published curriculum units",
                })
                continue
            prediction["user_id"] = user_id
            forecasts_to_save.append(prediction)
            results.append({"user_id": user_id, "status": "updated", "prediction": prediction})
        except Exception as error:
            logger.exception("GWA forecast failed for %s", user_id)
            raise HTTPException(
                status_code=502,
                detail=f"GWA forecast failed for {user_id}: {error}",
            ) from error
    try:
        await save_gwa_forecasts(forecasts_to_save)
    except Exception as error:
        logger.exception("Unable to save batch GWA forecasts")
        raise HTTPException(status_code=502, detail=f"Unable to save GWA forecasts: {error}") from error
    return {"processed": len(results), "results": results}
