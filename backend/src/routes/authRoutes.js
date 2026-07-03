import express from 'express';
import authService from '../services/userStore.js';

const router = express.Router();

// 1. Create Account
router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const data = await authService.signUp(email, password, name);
    res.status(201).json({ message: 'Account created!', user: data.user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 2. Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const data = await authService.signIn(email, password);
    res.status(200).json({ message: 'Login successful', token: data.session.access_token, user: data.user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 3. Forgot Password - Request (maps 'identifier' to email)
router.post('/forgot-password/request', async (req, res) => {
  const { identifier, redirectTo } = req.body;
  try {
    await authService.forgotPassword(identifier, redirectTo);
    res.status(200).json({ message: 'Password reset link sent to your email.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 4. Forgot Password - Verify Code
router.post('/forgot-password/verify', async (req, res) => {
  const { identifier, code } = req.body;
  try {
    const data = await authService.verifyResetCode(identifier, code);
    res.status(200).json({ message: 'Code verified successfully.', session: data.session });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 5. Forgot Password - Reset to New Password
router.post('/forgot-password/reset', async (req, res) => {
  const { newPassword } = req.body;
  try {
    await authService.updatePassword(newPassword);
    res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;