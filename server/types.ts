export interface WorkerEnv {
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
  CACHE?: any; // Workers KV Namespace binding
  DB?: any; // Cloudflare D1 Database binding
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
  SUPER_ADMIN_EMAILS?: string;
  DEALER_EMAILS?: string;
  [key: string]: any;
}

export type UserRole = 'super_admin' | 'dealer' | 'customer';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  dealerId?: string;
  assignedPincodes?: string[];
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
