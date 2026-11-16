// Deprecated Supabase shim redirected cleanly to Google-Only auth service.
// Zero Supabase client, keys, or demo accounts remain active.
export {
  authService,
  getLocalSession,
  setLocalSession,
  getRegisteredGoogleUsers as getLocalUsers,
  hasGoogleClientId,
  getGoogleClientId,
} from './auth';
export type { LocalUser, AuthSessionUser } from './auth';
