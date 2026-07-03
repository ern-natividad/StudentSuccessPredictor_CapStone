import express from 'express';
import authService from '../services/userStore.js';

const router = express.Router();

// 1. Route: Create Account
router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const data = await authService.signUp(email, password, name);
    res.status(201).json({ 
      message: 'Account created! Please check your email to verify.', 
      user: data.user 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 2. Route: Login 
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const data = await authService.signIn(email, password);
    res.status(200).json({ 
      message: 'Login successful', 
      token: data.session.access_token, 
      user: data.user 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 3. Route: Forgot Password Request 
router.post('/forgot-password/request', async (req, res) => {
  const { email, redirectTo } = req.body;
  try {
    await authService.forgotPassword(email, redirectTo);
    res.status(200).json({ message: 'Password reset link sent to your email.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;