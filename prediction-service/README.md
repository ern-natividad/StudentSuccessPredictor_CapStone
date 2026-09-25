# Student Risk Prediction Service

Place the trained `student_risk_model.pkl` beside `predict_service.py` or set `MODEL_PATH` to its location. The model must expose `predict_proba()` and use the feature order `gwa`, `total_failed_units`, `course_completion_count`.

Install and run:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:SUPABASE_URL = "https://your-project.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"
$env:PREDICTION_SERVICE_SECRET = "shared-secret"
uvicorn predict_service:app --host 0.0.0.0 --port 8000
```

Configure the Node backend with `PREDICTION_SERVICE_URL=http://localhost:8000` and the same `PREDICTION_SERVICE_SECRET`. The service defaults to updating `public.users`, which is this repository's student identity table. For a deployment with a separate `public.students` table, set `STUDENT_TABLE=students` and `STUDENT_ID_COLUMN` to the column containing the uploaded `user_id`.
