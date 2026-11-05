import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

// Retrieve credentials from environment variables or localStorage
export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('dugdhsar_supabase_url') : null;
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem('dugdhsar_supabase_anon_key') : null;

  const url = storedUrl || envUrl || '';
  const key = storedKey || envKey || '';

  const isConfigured = Boolean(url && key && url.includes('supabase.co'));

  return { url, key, isConfigured };
};

export const saveSupabaseConfig = (url: string, key: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('dugdhsar_supabase_url', url.trim());
    localStorage.setItem('dugdhsar_supabase_anon_key', key.trim());
    // reload client
    initSupabaseClient();
  }
};

let supabaseInstance: SupabaseClient | null = null;

export const initSupabaseClient = (): SupabaseClient | null => {
  const { url, key, isConfigured } = getSupabaseConfig();
  if (isConfigured && url && key) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        }
      });
      return supabaseInstance;
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return null;
};

// Initial instance attempt
initSupabaseClient();

export const getSupabase = () => supabaseInstance;

// Local fallback user management for zero-friction evaluation when project keys are being prepared
const LOCAL_USERS_KEY = 'dugdhsar_local_auth_users';
const LOCAL_SESSION_KEY = 'dugdhsar_local_auth_session';

export interface LocalUser {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: 'customer' | 'admin';
  createdAt: string;
  passwordHash?: string;
}

export const getLocalUsers = (): LocalUser[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (!raw) {
      const defaultUsers: LocalUser[] = [
        {
          id: 'usr-customer-1',
          email: 'customer@dugdhsar.in',
          fullName: 'Ramesh Patel',
          phone: '+91 7067672604',
          role: 'customer',
          createdAt: new Date().toISOString(),
          passwordHash: 'password123'
        },
        {
          id: 'usr-admin-1',
          email: 'admin@dugdhsar.in',
          fullName: 'Dugdhsar Dispatch Admin',
          phone: '+91 7067672604',
          role: 'admin',
          createdAt: new Date().toISOString(),
          passwordHash: 'admin123'
        }
      ];
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(defaultUsers));
      return defaultUsers;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const getLocalSession = (): LocalUser | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setLocalSession = (user: LocalUser | null) => {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(LOCAL_SESSION_KEY);
  }
};

// Supabase Unified Authentication Layer
export const authService = {
  // Sign Up
  async signUp(email: string, password: string, fullName: string, phone: string): Promise<{ success: boolean; user?: any; error?: string }> {
    const { isConfigured } = getSupabaseConfig();
    const client = getSupabase();

    if (isConfigured && client) {
      try {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
              role: 'customer'
            }
          }
        });

        if (error) {
          return { success: false, error: error.message };
        }

        const userObj = data.user;
        const mappedUser: LocalUser = {
          id: userObj?.id || 'usr-' + Date.now(),
          email: userObj?.email || email,
          fullName: fullName || email.split('@')[0],
          phone: phone || '+91 7067672604',
          role: 'customer',
          createdAt: new Date().toISOString()
        };
        setLocalSession(mappedUser);
        return { success: true, user: mappedUser };
      } catch (err: any) {
        return { success: false, error: err.message || 'Supabase signup failed' };
      }
    }

    // Local authentication fallback
    const users = getLocalUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'An account with this email already exists. Please sign in.' };
    }

    const newUser: LocalUser = {
      id: 'usr-' + Date.now(),
      email,
      fullName: fullName || email.split('@')[0],
      phone: phone || '+91 7067672604',
      role: 'customer',
      createdAt: new Date().toISOString(),
      passwordHash: password
    };

    users.push(newUser);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    setLocalSession(newUser);
    return { success: true, user: newUser };
  },

  // Sign In with Email & Password
  async signInWithPassword(email: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
    const { isConfigured } = getSupabaseConfig();
    const client = getSupabase();

    if (isConfigured && client) {
      try {
        const { data, error } = await client.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          return { success: false, error: error.message };
        }

        const u = data.user;
        const mapped: LocalUser = {
          id: u.id,
          email: u.email || email,
          fullName: u.user_metadata?.full_name || email.split('@')[0],
          phone: u.user_metadata?.phone || '+91 7067672604',
          role: u.user_metadata?.role || (email.includes('admin') ? 'admin' : 'customer'),
          createdAt: u.created_at || new Date().toISOString()
        };
        setLocalSession(mapped);
        return { success: true, user: mapped };
      } catch (err: any) {
        return { success: false, error: err.message || 'Supabase authentication failed' };
      }
    }

    // Local authentication fallback
    const users = getLocalUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!found) {
      // Create user automatically on first sign-in for smooth evaluation
      const newUser: LocalUser = {
        id: 'usr-' + Date.now(),
        email,
        fullName: email.includes('admin') ? 'Dugdhsar Dispatch Admin' : email.split('@')[0].toUpperCase(),
        phone: '+91 7067672604',
        role: email.includes('admin') ? 'admin' : 'customer',
        createdAt: new Date().toISOString(),
        passwordHash: password
      };
      users.push(newUser);
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
      setLocalSession(newUser);
      return { success: true, user: newUser };
    }

    setLocalSession(found);
    return { success: true, user: found };
  },

  // Sign In with Magic Link / OTP
  async signInWithOtp(email: string): Promise<{ success: boolean; message: string; error?: string }> {
    const { isConfigured } = getSupabaseConfig();
    const client = getSupabase();

    if (isConfigured && client) {
      try {
        const { error } = await client.auth.signInWithOtp({ email });
        if (error) return { success: false, message: '', error: error.message };
        return { success: true, message: 'Magic login link sent to your email! Please check your inbox.' };
      } catch (e: any) {
        return { success: false, message: '', error: e.message };
      }
    }

    return { 
      success: true, 
      message: 'Demo OTP 1964 generated! Use standard sign in or password to access your dashboard.' 
    };
  },

  // Sign Out
  async signOut(): Promise<void> {
    const client = getSupabase();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (e) {
        // ignore
      }
    }
    setLocalSession(null);
  },

  // Get current active user
  getCurrentUser(): LocalUser | null {
    return getLocalSession();
  }
};
