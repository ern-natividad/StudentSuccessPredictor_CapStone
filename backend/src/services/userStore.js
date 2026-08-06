import { supabase } from '../config/supabaseClient.js';
import { initiatePasswordReset, verifyPasswordOtp } from './authService.js';

class AuthService {
  async signUp(email, password, name) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name || '' } }
    });
    if (error) throw error;
    return data;
  }

  async signIn(email, password) {
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password: password 
    });
    if (error) throw error;
    return data;
  }

  // Handle forgot password initiation
  async forgotPassword(email) {
    if (!email) throw new Error("Email identifier is required.");
    // Password recovery is delivered through the shared Brevo service, not
    // Supabase's built-in email sender.
    return initiatePasswordReset(email);
  }

  // Handle OTP token verification 
  async verifyResetCode(email, token) {
    if (!email || !token) throw new Error("Email and verification code are required.");
    return verifyPasswordOtp(email, token);
  }

  // Handle updating to a brand new password
  async updatePassword(newPassword) {
    if (!newPassword) throw new Error("New password is required.");
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    return data;
  }
}

export default new AuthService();
