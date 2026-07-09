import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const required = (name) => {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const env = {
  port: Number(process.env.PORT || 5001), 
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",

  supabaseUrl: required("SUPABASE_URL"),
  supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),

  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",

  lockoutMaxAttempts: Number(process.env.LOCKOUT_MAX_ATTEMPTS || 5),
  lockoutDurationMinutes: Number(process.env.LOCKOUT_DURATION_MINUTES || 15),

  adminAccessCode: process.env.ADMIN_ACCESS_CODE || "",
  staffAccessCode: process.env.STAFF_ACCESS_CODE || "",

  smtpHost: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: required("SMTP_USER"),
  smtpPass: required("SMTP_PASS"),
};