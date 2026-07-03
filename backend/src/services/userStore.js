import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USERS_PATH = path.join(__dirname, "../../data/users.json");

const readUsers = () => {
  const raw = fs.readFileSync(USERS_PATH, "utf-8");
  return JSON.parse(raw);
};

const writeUsers = (users) => {
  fs.writeFileSync(USERS_PATH, `${JSON.stringify(users, null, 2)}\n`, "utf-8");
};

export const normalizeIdentifier = (identifier) => identifier.trim().toLowerCase();

export const accountExists = (identifier) => {
  const key = normalizeIdentifier(identifier);
  return Boolean(readUsers()[key]);
};

export const getUserRole = (identifier) => {
  const key = normalizeIdentifier(identifier);
  return readUsers()[key]?.role || "student";
};

export const validateLogin = (identifier, password) => {
  const key = normalizeIdentifier(identifier);
  const user = readUsers()[key];
  if (!user || user.password !== password) {
    return { valid: false };
  }
  return { valid: true, role: user.role };
};

export const updatePassword = (identifier, newPassword) => {
  const key = normalizeIdentifier(identifier);
  const users = readUsers();
  if (!users[key]) {
    return false;
  }
  users[key].password = newPassword;
  writeUsers(users);
  return true;
};
