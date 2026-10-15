# HawkPredict Prediction Service

The service supports two separate prediction types:

- `/predict` is the existing risk-classification endpoint. It requires a `predict_proba()` model at `MODEL_PATH`.
- `/forecast` returns Random Forest, Gradient Boosting, and Ridge Regression next-term GWA forecasts. It requires the regression bundle at `GPA_MODEL_PATH`.

To train and save the prototype GWA bundle, run this from `prediction-service` with the database environment variables set:

```powershell
python training_pipeline.py --save
```

The script evaluates the models before saving the artifact. Review its report and prototype caveat before promoting an artifact. The current evaluation holds out students, but the supplied grade files are from one cohort, so the reported scores are not proof of performance on future cohorts.

Apply `backend/sql/015_student_gpa_predictions.sql` to the database before serving forecasts. The prediction service uses its Supabase service-role key to read grades and published curricula and to save each student's latest model forecasts.

To install and run:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:SUPABASE_URL = "https://your-project.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"
$env:PREDICTION_SERVICE_SECRET = "shared-secret"
$env:GPA_MODEL_PATH = ".\student_gpa_models.joblib"
uvicorn predict_service:app --host 0.0.0.0 --port 8000
```

Configure the Node backend with `PREDICTION_SERVICE_URL=http://localhost:8000` and the same `PREDICTION_SERVICE_SECRET`. The service can run with only the GWA bundle; `/predict` will return a clear unavailable response if no risk-classification model is configured.
