import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Instagram, 
  ExternalLink, 
  RefreshCw, 
  Heart, 
  MessageCircle, 
  Play, 
  CheckCircle2, 
  X, 
  Image as ImageIcon, 
  Video,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

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
}

const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="inline-block"
    >
      {value.toLocaleString('en-IN')}
    </motion.span>
  );
};

export const InstagramFeed: React.FC = () => {
  const [feed, setFeed] = useState<InstagramFeedResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'reels' | 'photos'>('all');
  const [selectedPost, setSelectedPost] = useState<InstagramMediaItem | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchFeed = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      // Relative URL /api/instagram/feed for zero-CORS Cloudflare Worker deployment
      const res = await fetch('/api/instagram/feed');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to fetch feed`);
      }
      const data: InstagramFeedResponse = await res.json();
      if (data && data.profile && Array.isArray(data.media)) {
        setFeed(data);
      } else {
        throw new Error('Invalid feed structure returned');
      }
    } catch (err: any) {
      console.warn('[InstagramFeed] Fetch error:', err.message);
      if (!feed) {
        setError(err.message || 'Unable to load Instagram feed');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [feed]);

  // Polling every 60 seconds, paused when tab is hidden
  useEffect(() => {
    fetchFeed();

    const startPolling = () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      pollTimerRef.current = setInterval(() => {
        if (!document.hidden) {
          fetchFeed();
        }
      }, 60000);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became visible again; immediately refresh if needed and resume timer
        fetchFeed();
        startPolling();
      } else {
        // Tab is hidden; stop active polling interval
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchFeed]);

  const formatTimestamp = (raw?: string) => {
    if (!raw) return 'Recently';
    try {
      const date = new Date(raw);
      if (isNaN(date.getTime())) return raw;
      const diffMs = Date.now() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } catch {
      return raw;
    }
  };

  const filteredMedia = (feed?.media || []).filter(item => {
    const isVideo = item.media_type === 'VIDEO';
    if (activeFilter === 'reels') return isVideo;
    if (activeFilter === 'photos') return !isVideo;
    return true;
  });

  const profile = feed?.profile;

  return (
    <section id="instagram-feed" className="py-14 sm:py-20 bg-[#F8F4EC] relative overflow-hidden border-t border-[#D8C9AD]">
      {/* Subtle Vedic Aura Background */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C2A36C]/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#124A86]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Profile Card Header */}
        <div className="bg-[#FAF6EE] rounded-3xl border border-[#D8C9AD] p-5 sm:p-7 shadow-sm mb-10 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            
            {/* Left: Avatar + Profile Info */}
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <a 
                href="https://www.instagram.com/dugdhsar.in/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="relative p-1 rounded-full bg-gradient-to-tr from-[#A87520] via-[#A34F37] to-[#124A86] shrink-0 shadow-md transition-transform hover:scale-105"
                title="View @dugdhsar.in on Instagram"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white p-1 overflow-hidden flex items-center justify-center">
                  <img 
                    src={profile?.profile_picture_url || '/assets/aistudio/1000095715-clean_c92aa3a9.png'} 
                    alt="Dugdhsar Profile" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="absolute bottom-0 right-0 p-1 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-full text-white shadow-sm ring-2 ring-white">
                  <Instagram className="w-3.5 h-3.5" />
                </div>
              </a>

              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h3 className="font-serif text-lg sm:text-2xl font-black text-[#263D30] tracking-tight">
                    {profile?.username || 'dugdhsar.in'}
                  </h3>
                  <span title="Verified Brand">
                    <CheckCircle2 className="w-4 h-4 text-[#124A86] fill-[#124A86] text-white shrink-0" />
                  </span>
                </div>

                <p className="text-xs text-[#302C26]/85 font-medium mt-0.5">
                  DUGDHSAR · 60 Years Vedic Heritage Gir Cow A2 Dairy & Bilona Ghee
                </p>

                {/* Metrics: If metric is missing or empty, hide it instead of showing 0 */}
                <div className="flex items-center justify-center sm:justify-start gap-4 mt-2 text-xs font-bold text-[#263D30]">
                  {typeof profile?.media_count === 'number' && profile.media_count > 0 && (
                    <span>
                      <AnimatedNumber value={profile.media_count} /> posts
                    </span>
                  )}
                  {typeof profile?.followers_count === 'number' && profile.followers_count > 0 && (
                    <span>
                      <AnimatedNumber value={profile.followers_count} /> followers
                    </span>
                  )}
                  {typeof profile?.follows_count === 'number' && profile.follows_count > 0 && (
                    <span>
                      <AnimatedNumber value={profile.follows_count} /> following
                    </span>
                  )}
                  <span className="text-[#A34F37]">Seoni, MP</span>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
              <a
                href="https://www.instagram.com/dugdhsar.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-[#124A86] to-[#0D3663] hover:from-[#0D3663] hover:to-[#092645] text-white rounded-xl text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
              >
                <Instagram className="w-4 h-4" />
                <span>Follow @dugdhsar.in</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </a>

              <button
                onClick={() => fetchFeed(true)}
                disabled={isRefreshing || isLoading}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#FAF6EE] hover:bg-[#F3EDE1] text-[#263D30] border border-[#D8C9AD] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
                title="Refresh latest posts from Instagram"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#A34F37] ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Syncing...' : 'Sync Feed'}</span>
              </button>
            </div>

          </div>

          {/* Sync Status Banner */}
          <div className="mt-4 pt-3 border-t border-[#D8C9AD]/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#302C26]/75">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="font-semibold text-emerald-900">
                Connected to Instagram Stream · @dugdhsar.in
              </span>
            </div>
            <span className="text-[10px] text-[#302C26]/60">
              Auto-stream active · 60s background sync
            </span>
          </div>
        </div>

        {/* Section Heading & Filter Tabs */}
        <div className="text-center mb-8 px-4">
          <p className="text-xs uppercase tracking-[0.25em] text-[#A34F37] font-bold mb-1 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#A87520]" />
            <span>Official Instagram Stream</span>
          </p>
          <h2 className="text-2xl sm:text-4xl font-serif text-[#263D30] font-black tracking-tight uppercase">
            Life at Sukla Gaushala & Pure Vedic Craft
          </h2>
          <p className="text-xs sm:text-sm text-[#302C26]/75 max-w-xl mx-auto mt-2">
            Every morning milking, bilona churning, and sanctuary update uploaded to <strong>@dugdhsar.in</strong> is streamed live. Tap any post to preview or open on Instagram.
          </p>

          {/* Media Filter Tabs */}
          <div className="inline-flex items-center p-1 bg-[#FAF6EE] rounded-2xl border border-[#D8C9AD] mt-6 gap-1 shadow-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-[#263D30] text-[#FAF6EE] shadow-xs'
                  : 'text-[#302C26]/70 hover:text-[#263D30]'
              }`}
            >
              All Posts ({feed?.media.length || 0})
            </button>
            <button
              onClick={() => setActiveFilter('reels')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'reels'
                  ? 'bg-[#263D30] text-[#FAF6EE] shadow-xs'
                  : 'text-[#302C26]/70 hover:text-[#263D30]'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Reels & Videos</span>
            </button>
            <button
              onClick={() => setActiveFilter('photos')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'photos'
                  ? 'bg-[#263D30] text-[#FAF6EE] shadow-xs'
                  : 'text-[#302C26]/70 hover:text-[#263D30]'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Photos & Bottles</span>
            </button>
          </div>
        </div>

        {/* Error Fallback */}
        {error && !feed && (
          <div className="max-w-md mx-auto my-8 p-6 bg-red-50 border border-red-200 rounded-3xl text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <h4 className="font-bold text-sm text-red-900 mb-1">Feed temporarily unavailable</h4>
            <p className="text-xs text-red-700 mb-4">{error}</p>
            <button
              onClick={() => fetchFeed(true)}
              className="px-4 py-2 bg-[#263D30] text-[#FAF6EE] rounded-xl text-xs font-bold hover:bg-[#1E3026] cursor-pointer shadow-xs"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Skeleton Loading State */}
        {isLoading && !feed && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div 
                key={idx} 
                className="bg-[#FAF6EE] border border-[#D8C9AD] rounded-2xl aspect-square animate-pulse flex flex-col justify-between p-3"
              >
                <div className="flex justify-end">
                  <div className="w-6 h-6 rounded-full bg-[#D8C9AD]/40" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-2 w-3/4 bg-[#D8C9AD]/40 rounded-sm" />
                  <div className="h-2 w-1/2 bg-[#D8C9AD]/40 rounded-sm" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Media Grid */}
        {feed && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {filteredMedia.map((post) => (
              <div
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="group relative bg-[#FAF6EE] rounded-2xl overflow-hidden border border-[#D8C9AD] aspect-square flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 block shadow-xs cursor-pointer"
              >
                <img
                  src={post.media_url || post.thumbnail_url}
                  alt={post.caption || 'Dugdhsar Instagram Post'}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/assets/vedic_gir_cow_meadow.jpg';
                  }}
                  className="w-full h-full object-cover object-center transform group-hover:scale-108 transition-transform duration-500"
                />

                {/* Badge for Reel / Photo */}
                <div className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-black/60 text-white backdrop-blur-xs">
                  {post.media_type === 'VIDEO' ? (
                    <Play className="w-3 h-3 fill-white" />
                  ) : (
                    <Instagram className="w-3 h-3 text-[#C2A36C]" />
                  )}
                </div>

                {/* Bottom Gradient for mobile */}
                {typeof post.like_count === 'number' && post.like_count > 0 && (
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/75 to-transparent z-10 flex items-end p-2 sm:hidden">
                    <span className="text-[10px] text-white font-semibold truncate flex items-center gap-1">
                      <Heart className="w-3 h-3 fill-red-400 text-red-400" />
                      <AnimatedNumber value={post.like_count} />
                    </span>
                  </div>
                )}

                {/* Hover / Tap Overlay */}
                <div className="absolute inset-0 bg-[#263D30]/92 text-[#FAF6EE] p-3 sm:p-4 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                  <div className="flex items-center justify-between text-[10px] text-[#C2A36C] font-bold">
                    <span>@dugdhsar.in</span>
                    <span className="text-[9px] text-[#FAF6EE]/70 font-normal">{formatTimestamp(post.timestamp)}</span>
                  </div>

                  <p className="text-[10px] sm:text-[11px] leading-relaxed text-[#FAF6EE]/95 line-clamp-4 font-medium">
                    {post.caption || 'Pure Vedic Living at Sukla Gaushala, Seoni.'}
                  </p>

                  <div className="pt-2 border-t border-white/20 flex items-center justify-between text-[10px] text-[#FAF6EE]/80">
                    <div className="flex items-center gap-3">
                      {typeof post.like_count === 'number' && post.like_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 fill-[#C2A36C] text-[#C2A36C]" />
                          <AnimatedNumber value={post.like_count} />
                        </span>
                      )}
                      {typeof post.comments_count === 'number' && post.comments_count > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3 text-[#FAF6EE]" />
                          <AnimatedNumber value={post.comments_count} />
                        </span>
                      )}
                    </div>
                    <span className="text-[#C2A36C] font-bold text-[9px] uppercase tracking-wider flex items-center gap-1">
                      <span>View</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom CTA to Instagram Profile */}
        <div className="mt-10 text-center flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="https://www.instagram.com/dugdhsar.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#FAF6EE] hover:bg-[#F3EDE1] text-[#263D30] border-2 border-[#D8C9AD] hover:border-[#263D30] rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
          >
            <Instagram className="w-4 h-4 text-[#A34F37]" />
            <span>Open Official @dugdhsar.in on Instagram</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#C2A36C]" />
          </a>
        </div>

      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedPost(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FAF6EE] rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-[#D8C9AD] flex flex-col md:flex-row max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Media Preview */}
              <div className="relative bg-black md:w-1/2 flex items-center justify-center min-h-[280px]">
                <img 
                  src={selectedPost.media_url || selectedPost.thumbnail_url} 
                  alt={selectedPost.caption || 'Post Preview'}
                  className="w-full h-full object-contain max-h-[70vh]"
                />
                {selectedPost.media_type === 'VIDEO' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-14 h-14 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-xs">
                      <Play className="w-6 h-6 fill-white ml-1" />
                    </div>
                  </div>
                )}
              </div>

              {/* Meta & Full Caption */}
              <div className="p-6 md:w-1/2 flex flex-col justify-between overflow-y-auto">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-[#D8C9AD]/60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white p-0.5 border border-[#D8C9AD] overflow-hidden">
                        <img 
                          src="/assets/aistudio/1000095715-clean_c92aa3a9.png" 
                          alt="Dugdhsar Profile" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-sm text-[#263D30]">
                          <span>dugdhsar.in</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#124A86] fill-[#124A86] text-white" />
                        </div>
                        <span className="text-[11px] text-[#302C26]/70">Dugdhsar Vedic Dairy · Seoni, MP</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedPost(null)}
                      className="p-1 rounded-full hover:bg-[#F3EDE1] text-[#302C26]/70 hover:text-[#263D30] transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="py-4 text-xs sm:text-sm text-[#302C26] leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto pr-1">
                    {selectedPost.caption || 'Pure A2 Vedic Gir Cow Dairy from Seoni, Madhya Pradesh.'}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#D8C9AD]/60">
                  <div className="flex items-center justify-between mb-3 text-xs text-[#263D30] font-semibold">
                    <div className="flex items-center gap-4">
                      {typeof selectedPost.like_count === 'number' && selectedPost.like_count > 0 && (
                        <span className="flex items-center gap-1.5">
                          <Heart className="w-4 h-4 fill-[#A34F37] text-[#A34F37]" />
                          <strong><AnimatedNumber value={selectedPost.like_count} /></strong> likes
                        </span>
                      )}
                      {typeof selectedPost.comments_count === 'number' && selectedPost.comments_count > 0 && (
                        <span className="flex items-center gap-1.5">
                          <MessageCircle className="w-4 h-4 text-[#263D30]" />
                          <strong><AnimatedNumber value={selectedPost.comments_count} /></strong> comments
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#302C26]/60">{formatTimestamp(selectedPost.timestamp)}</span>
                  </div>

                  <a 
                    href={selectedPost.permalink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-[#124A86] to-[#0D3663] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-sm"
                  >
                    <Instagram className="w-4 h-4" />
                    <span>View & Comment on Instagram</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default InstagramFeed;
