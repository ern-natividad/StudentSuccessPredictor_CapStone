import asyncio
import logging
import os
from pathlib import Path
from typing import Any

import joblib
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from supabase import Client, create_client

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("prediction-service")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
MODEL_PATH = Path(os.getenv("MODEL_PATH", "student_risk_model.pkl"))
STUDENT_TABLE = os.getenv("STUDENT_TABLE", "users")
STUDENT_ID_COLUMN = os.getenv("STUDENT_ID_COLUMN", "id")
SERVICE_SECRET = os.getenv("PREDICTION_SERVICE_SECRET", "")

app = FastAPI(title="Student Risk Prediction Service", version="1.0.0")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
model: Any = None


class PredictionRequest(BaseModel):
    user_ids: list[str] = Field(min_length=1, max_length=5000)


@app.on_event("startup")
async def load_model() -> None:
    global model
    if not MODEL_PATH.exists():
        raise RuntimeError(f"Trained model not found at {MODEL_PATH}")
    model = await asyncio.to_thread(joblib.load, MODEL_PATH)
    if not hasattr(model, "predict_proba"):
        raise RuntimeError("The trained model must implement predict_proba().")


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
    response = await asyncio.to_thread(
        lambda: supabase.from_("student_grades")
        .select("user_id, grade, remarks, subject_code, school_year, semester")
        .eq("user_id", user_id)
        .order("created_at", desc=False)
        .execute()
    )
    if response.data is None:
        raise RuntimeError(f"Unable to load grade history for {user_id}")
    return response.data


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
    return {"status": "ok", "model": MODEL_PATH.name}


@app.post("/predict")
async def predict(request: PredictionRequest, x_prediction_service_key: str | None = Header(default=None)) -> dict[str, Any]:
    if SERVICE_SECRET and x_prediction_service_key != SERVICE_SECRET:
        raise HTTPException(status_code=401, detail="Invalid prediction service key.")

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
