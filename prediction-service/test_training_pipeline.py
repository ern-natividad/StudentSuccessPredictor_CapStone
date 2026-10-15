import unittest

from training_pipeline import (
    build_course_units,
    create_latest_predictions,
    create_training_examples,
    normalize_grade,
)


class TrainingPipelineTests(unittest.TestCase):
    def test_normalizes_status_grades_and_completed_inc_spelling(self):
        self.assertEqual(normalize_grade("AW"), "AW")
        self.assertEqual(normalize_grade("UW"), "UW")
        self.assertEqual(normalize_grade("INC (Complied: 2.75)"), "2.75")
        self.assertEqual(normalize_grade("INC (Completed: 3.00)"), "3")
        self.assertIsNone(normalize_grade("INC (Complied: 4.00)"))

    def test_curriculum_units_are_keyed_to_the_correct_school_year_and_semester(self):
        units = build_course_units(
            [
                {
                    "program": "Test Engineering",
                    "academic_year": "2023-2024",
                    "courses": [
                        {
                            "code": "TEST 101",
                            "yearLevel": "1Y",
                            "semester": "1S",
                            "units": 3,
                        },
                        {
                            "code": "TEST 102",
                            "yearLevel": "2Y",
                            "semester": "Summer",
                            "units": 2,
                        },
                    ],
                }
            ]
        )
        self.assertEqual(
            units[("Test Engineering", 2023, "1", "TEST101")],
            3,
        )
        self.assertEqual(
            units[("Test Engineering", 2024, "S", "TEST102")],
            2,
        )

    def test_training_examples_use_only_prior_terms_for_features(self):
        students = [
            {
                "user_id": "student-1",
                "program": "BS Computer Engineering",
            }
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

        examples, stats = create_training_examples(students, grades, curricula)

        self.assertEqual(len(examples), 1)
        self.assertEqual(examples[0]["target_gwa"], 3)
        self.assertEqual(examples[0]["features"]["cumulative_gwa"], 2)
        self.assertEqual(examples[0]["features"]["previous_term_gwa"], 2)
        self.assertEqual(stats["numeric_rows_used"], 2)

    def test_latest_prediction_features_use_all_recorded_terms_without_future_grades(self):
        students = [
            {
                "user_id": "student-1",
                "program": "BS Computer Engineering",
            }
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

        predictions, stats = create_latest_predictions(students, grades, curricula)
        result = predictions["student-1"]

        self.assertEqual(result["current_gwa"], 2.25)
        self.assertEqual(result["grade_count"], 2)
        self.assertEqual(result["source_term"], (2023, 2))
        self.assertEqual(result["features"]["previous_term_gwa"], 3)
        self.assertEqual(result["features"]["historical_term_count"], 2)
        self.assertEqual(stats["numeric_rows_used"], 2)


if __name__ == "__main__":
    unittest.main()
