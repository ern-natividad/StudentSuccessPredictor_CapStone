import asyncio
import os
import unittest
from unittest.mock import AsyncMock, patch

os.environ["SUPABASE_URL"] = "https://example.supabase.co"
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "test-service-role-key"

import predict_service
from predict_service import PredictionRequest, next_academic_term, predict_gwa


class FixedModel:
    def __init__(self, value):
        self.value = value

    def predict(self, _features):
        return [self.value]


class FakeSupabaseResponse:
    def __init__(self, data):
        self.data = data


class FakeQuery:
    def __init__(self, client, table):
        self.client = client
        self.table = table
        self.user_ids = []
        self.start = 0
        self.end = 999

    def select(self, _columns):
        return self

    def in_(self, _column, user_ids):
        self.user_ids = user_ids
        return self

    def order(self, *_args, **_kwargs):
        return self

    def range(self, start, end):
        self.start = start
        self.end = end
        return self

    def execute(self):
        self.client.query_count += 1
        rows = self.client.rows[self.table]
        selected = [row for row in rows if row["user_id"] in self.user_ids]
        return FakeSupabaseResponse(selected[self.start : self.end + 1])


class FakeSupabase:
    def __init__(self, rows):
        self.rows = rows
        self.query_count = 0

    def from_(self, table):
        return FakeQuery(self, table)


class PredictionServiceTests(unittest.TestCase):
    def test_next_academic_term_advances_through_semesters_and_summer(self):
        self.assertEqual(next_academic_term((2023, 1)), ("2023-2024", "2"))
        self.assertEqual(next_academic_term((2023, 2)), ("2023-2024", "Summer"))
        self.assertEqual(next_academic_term((2023, 3)), ("2024-2025", "1"))

    def test_gwa_forecast_runs_all_models_and_uses_recommended_model(self):
        student = {
            "user_id": "student-1",
            "program": "BS Computer Engineering",
        }
        curricula = [
            {
                "program": "BS Computer Engineering",
                "academic_year": "2023-2024",
                "courses": [
                    {
                        "code": "CPE 101",
                        "yearLevel": "1Y",
                        "semester": "1S",
                        "units": 3,
                    },
                    {
                        "code": "CPE 102",
                        "yearLevel": "1Y",
                        "semester": "2S",
                        "units": 1,
                    },
                ],
            }
        ]
        grades = [
            {
                "user_id": "student-1",
                "subject_code": "CPE 101",
                "school_year": "2023-2024",
                "semester": "1",
                "grade": "2",
            },
            {
                "user_id": "student-1",
                "subject_code": "CPE 102",
                "school_year": "2023-2024",
                "semester": "2",
                "grade": "3",
            },
        ]
        feature_names = [
            "cumulative_gwa",
            "previous_term_gwa",
            "recent_trend",
            "completed_course_count",
            "failed_course_count",
            "incomplete_count",
            "withdrawal_count",
            "previous_term_count",
            "historical_term_count",
            "program::BS Agricultural and Biosystems Engineering",
            "program::BS Computer Engineering",
            "program::BS Electrical Engineering",
        ]
        bundle = {
            "models": {
                "Random Forest": FixedModel(2.5),
                "Gradient Boosting": FixedModel(2.25),
                "Ridge Regression": FixedModel(2.75),
            },
            "feature_names": feature_names,
            "recommended_model": "Gradient Boosting",
            "metrics": {
                "Random Forest": {"mae": 0.2},
                "Gradient Boosting": {"mae": 0.18},
                "Ridge Regression": {"mae": 0.21},
            },
            "model_version": "test-version",
            "prototype_only": True,
        }

        forecast = predict_gwa(bundle, student, grades, curricula)

        self.assertEqual(forecast["current_gwa"], 2.25)
        self.assertEqual(forecast["predicted_gwa"], 2.25)
        self.assertEqual(forecast["selected_model"], "Gradient Boosting")
        self.assertEqual(
            forecast["model_predictions"],
            {
                "Random Forest": 2.5,
                "Gradient Boosting": 2.25,
                "Ridge Regression": 2.75,
            },
        )
        self.assertEqual(forecast["target_semester"], "Summer")
        self.assertEqual(forecast["target_school_year"], "2023-2024")
        self.assertTrue(forecast["prototype_only"])

    def test_forecast_endpoint_fetches_and_saves_students_as_batches(self):
        students = [
            {"user_id": f"student-{index}", "program": "BS Computer Engineering"}
            for index in (1, 2)
        ]
        grades = [
            {
                "user_id": student["user_id"],
                "subject_code": "CPE 101",
                "school_year": "2023-2024",
                "semester": "1",
                "grade": "2",
            }
            for student in students
        ]
        curricula = [
            {
                "program": "BS Computer Engineering",
                "academic_year": "2023-2024",
                "courses": [
                    {
                        "code": "CPE 101",
                        "yearLevel": "1Y",
                        "semester": "1S",
                        "units": 3,
                    }
                ],
            }
        ]
        feature_names = [
            "cumulative_gwa",
            "previous_term_gwa",
            "recent_trend",
            "completed_course_count",
            "failed_course_count",
            "incomplete_count",
            "withdrawal_count",
            "previous_term_count",
            "historical_term_count",
            "program::BS Agricultural and Biosystems Engineering",
            "program::BS Computer Engineering",
            "program::BS Electrical Engineering",
        ]
        bundle = {
            "models": {
                "Random Forest": FixedModel(2.5),
                "Gradient Boosting": FixedModel(2.25),
                "Ridge Regression": FixedModel(2.75),
            },
            "feature_names": feature_names,
            "recommended_model": "Gradient Boosting",
            "metrics": {},
            "model_version": "test-version",
            "prototype_only": True,
        }

        async def run_forecast():
            with (
                patch.object(predict_service, "gwa_bundle", bundle),
                patch.object(
                    predict_service,
                    "fetch_published_curricula",
                    new=AsyncMock(return_value=curricula),
                ) as curricula_fetch,
                patch.object(
                    predict_service,
                    "_fetch_forecast_inputs",
                    return_value=(students, grades),
                ) as inputs_fetch,
                patch.object(
                    predict_service,
                    "save_gwa_forecasts",
                    new=AsyncMock(),
                ) as save_forecasts,
            ):
                response = await predict_service.forecast(
                    PredictionRequest(user_ids=["student-1", "student-2"]),
                    None,
                )
                self.assertEqual(curricula_fetch.await_count, 1)
                inputs_fetch.assert_called_once_with(["student-1", "student-2"])
                save_forecasts.assert_awaited_once()
                self.assertEqual(len(save_forecasts.await_args.args[0]), 2)
                return response

        response = asyncio.run(run_forecast())
        self.assertEqual(response["processed"], 2)
        self.assertEqual(
            [result["status"] for result in response["results"]],
            ["updated", "updated"],
        )

    def test_forecast_input_reads_are_batched_instead_of_per_student(self):
        user_ids = [f"student-{index}" for index in range(125)]
        fake_client = FakeSupabase(
            {
                "student_info": [
                    {"user_id": user_id, "program": "BS Computer Engineering"}
                    for user_id in user_ids
                ],
                "student_grades": [
                    {
                        "user_id": user_id,
                        "grade": "2",
                        "subject_code": "CPE 101",
                        "school_year": "2023-2024",
                        "semester": "1",
                    }
                    for user_id in user_ids
                ],
            }
        )

        with patch.object(predict_service, "supabase", fake_client):
            students, grades = predict_service._fetch_forecast_inputs(user_ids)

        self.assertEqual(len(students), 125)
        self.assertEqual(len(grades), 125)
        self.assertEqual(fake_client.query_count, 6)


if __name__ == "__main__":
    unittest.main()
