import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

// Retrieve credentials from environment variables or localStorage
export const getSupabaseConfig = () => {
  const metaEnv = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env : {};
  const envUrl = metaEnv.VITE_SUPABASE_URL;
  const envKey = metaEnv.VITE_SUPABASE_ANON_KEY;
  
  const storedUrl = typeof window !== 'undefined' && typeof localStorage !== 'undefined' ? localStorage.getItem('dugdhsar_supabase_url') : null;
  const storedKey = typeof window !== 'undefined' && typeof localStorage !== 'undefined' ? localStorage.getItem('dugdhsar_supabase_anon_key') : null;

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
  role: 'customer' | 'admin' | 'manager' | 'dealer';
  avatarUrl?: string;
  authProvider?: 'password' | 'google' | 'otp';
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
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
          authProvider: 'password',
          createdAt: new Date().toISOString(),
          passwordHash: 'password123'
        },
        {
          id: 'usr-google-1',
          email: 'sumitpawar65005@gmail.com',
          fullName: 'Sumit Pawar',
          phone: '+91 7067672604',
          role: 'admin',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
          authProvider: 'google',
          createdAt: new Date().toISOString()
        },
        {
          id: 'usr-manager-1',
          email: 'manager@dugdhsar.in',
          fullName: 'Harish Verma (Operations Manager)',
          phone: '+91 7067672604',
          role: 'manager',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
          authProvider: 'password',
          createdAt: new Date().toISOString(),
          passwordHash: 'manager123'
        },
        {
          id: 'usr-admin-1',
          email: 'admin@dugdhsar.in',
          fullName: 'Dugdhsar Super Admin',
          phone: '+91 7067672604',
          role: 'admin',
          avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80',
          authProvider: 'password',
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

  // Sign In with Google (Unified OAuth & Immediate Session)
  async signInWithGoogle(customEmail?: string, customName?: string, customAvatar?: string, forcedRole?: 'customer' | 'admin' | 'manager' | 'dealer'): Promise<{ success: boolean; user?: LocalUser; error?: string }> {
    const { isConfigured } = getSupabaseConfig();
    const client = getSupabase();

    // If Supabase OAuth is live in production
    if (isConfigured && client && !customEmail) {
      try {
        const { error } = await client.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
          }
        });
        if (error) {
          console.warn('Supabase Google OAuth error:', error);
        }
      } catch (err: any) {
        console.warn('Supabase Google OAuth exception, using fallback:', err);
      }
    }

    // Direct Google authentication session handler
    const email = (customEmail || 'sumitpawar65005@gmail.com').toLowerCase().trim();
    const name = customName || (email.startsWith('admin') ? 'Dugdhsar Super Admin' : (email.includes('manager') ? 'Harish Verma (Manager)' : (email.includes('sumit') ? 'Sumit Pawar' : email.split('@')[0])));
    const avatar = customAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=124a86,5c922b,a87520`;
    
    // Determine role: if forcedRole provided use it; otherwise check email rules
    let role: 'customer' | 'admin' | 'manager' | 'dealer' = 'customer';
    if (forcedRole) {
      role = forcedRole;
    } else if (email.includes('manager')) {
      role = 'manager';
    } else if (email.includes('admin') || email === 'sumitpawar65005@gmail.com') {
      role = 'admin';
    }

    const users = getLocalUsers();
    let user = users.find(u => u.email.toLowerCase() === email);

    // Deterministic unique user ID tied strictly to this email
    const emailSlug = email.replace(/[^a-z0-9]/g, '_');
    const deterministicId = `usr_${emailSlug}`;

    if (!user) {
      user = {
        id: deterministicId,
        email,
        fullName: name,
        phone: '+91 7067672604',
        role,
        avatarUrl: avatar,
        authProvider: 'google',
        createdAt: new Date().toISOString()
      };
      users.push(user);
    } else {
      // Update with Google provider and role if specified
      user.id = user.id || deterministicId;
      user.authProvider = 'google';
      if (forcedRole) user.role = forcedRole;
      if (name && !user.fullName) user.fullName = name;
      if (avatar && !user.avatarUrl) user.avatarUrl = avatar;
    }

    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    setLocalSession(user);
    return { success: true, user };
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
