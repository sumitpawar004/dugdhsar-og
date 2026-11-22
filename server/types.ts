export interface D1Meta {
  changed_db?: boolean;
  changes?: number;
  duration?: number;
  last_row_id?: number;
  rows_read?: number;
  rows_written?: number;
  served_by?: string;
}

export interface D1Result<T = Record<string, unknown>> {
  results: T[];
  success: boolean;
  error?: string;
  meta?: D1Meta;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  raw<T = unknown[]>(): Promise<T[]>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = Record<string, unknown>>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec?(query: string): Promise<{ count: number; duration: number }>;
}

export interface WorkerEnv {
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
  CACHE?: any; // Workers KV Namespace binding
  DB?: D1Database; // Cloudflare D1 Database binding (dugdhsar-prod)
  APP_URL?: string;
  ENVIRONMENT?: string;
  GOOGLE_CLIENT_ID?: string;
  IG_ACCESS_TOKEN?: string;
  IG_USER_ID?: string;
  IG_APP_ID?: string;
  IG_APP_SECRET?: string;
  IG_VERIFY_TOKEN?: string;
  JWT_SECRET?: string;
  GOOGLE_SERVICE_ACCOUNT_EMAIL?: string;
  GOOGLE_PRIVATE_KEY?: string;
  GOOGLE_SHEET_ID?: string;
  GOOGLE_SHEETS_WEBHOOK_URL?: string;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
  SUPER_ADMIN_EMAILS?: string;
  DEALER_EMAILS?: string;
  [key: string]: any;
}

export type UserRole = 'super_admin' | 'manager' | 'dealer' | 'customer';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  dealerId?: string;
  assignedPincodes?: string[];
  jti?: string;
}

export interface InstagramProfile {
  username: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
  profile_picture_url?: string;
}

export interface InstagramMediaItem {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | string;
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
}

export interface InstagramFeedResponse {
  profile: InstagramProfile;
  media: InstagramMediaItem[];
  updatedAt: string;
  source?: 'live' | 'cache' | 'fallback';
}
