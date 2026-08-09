ABOUT PROJECT

# Project Overview & Architecture
This project is a full-stack Machine Learning Web Application utilizing a decoupled microservice structure.

## Tech Stack
- **Frontend:** React.js, Tailwind CSS, Vite
- **Backend API:** Node.js, Express.js
- **ML Engine:** Python 3.11+, FastAPI/Flask, scikit-learn, SHAP
- **Database & Auth:** Supabase (PostgreSQL with RLS)
- **AI Integration:** LLM API (e.g., Claude API)

# UI/UX & Formatting Guidelines
- **UI Styling:** Clean, modern, minimalist aesthetics using Tailwind CSS.
- **Number Format:** Always format and label currencies explicitly as '1.0' or in decimal
- **Code Style:** Functional React components using hooks, clean async/await patterns for Express handlers, and modular Python functions.
- **Database:** Respect Supabase Row-Level Security (RLS) policies when writing database logic.
- **Error Handling:** All Express routes must return standardized JSON error responses `{ success: false, message: string }`.
- **Backend Route Handlers:** Use structured `try-catch` blocks and proper HTTP status codes (200, 400, 401, 500).
- **Python ML Pipeline:** Ensure ML code contains type hints, uses scikit-learn/SHAP cleanly, and isolates data preprocessing logic from endpoint handlers.

# Code Generation Rules
1. Prioritize type safety and explicit error handling across all tiers.
2. Keep frontend UI components responsive, accessible, and clean.
3. Ensure backend routes validate input using middleware before hitting database operations.
4. Keep Python ML code modular, cleanly separating data processing, inference, and SHAP explainability.