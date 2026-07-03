import { supabase } from '../config/supabaseClient.js';

class AuthService {
  // 1. Create Account
  async signUp(email, password, name) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name || '' } // Stores extra user profile info
      }
    });
    if (error) throw error;
    return data;
  }

  // 2. Sign In (Existing functionality fallback)
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  // 3. Forgot Password (Triggers Supabase's real email service)
  async forgotPassword(email, redirectToUrl) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectToUrl || 'http://localhost:3000/update-password',
    });
    if (error) throw error;
    return data;
  }
}

export default new AuthService();