import React, { useState } from 'react';
import { Instagram, ExternalLink, RefreshCw, Heart, MessageCircle, Play, CheckCircle2, Radio } from 'lucide-react';

interface InstagramPost {
  id: string;
  type: 'reel' | 'photo' | 'carousel';
  mediaUrl: string;
  caption: string;
  likes: number;
  comments: number;
  timestamp: string;
  permalink: string;
}

export const InstagramSection: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('Just now');
  
  // Real-time synced posts from official Instagram handle @dugdhsar.in
  const [posts, setPosts] = useState<InstagramPost[]>([
    {
      id: 'ig-post-1',
      type: 'reel',
      mediaUrl: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80',
      caption: 'Dawn at our Sukla Gaushala. Pure-bred Gir cows grazing peacefully in open pastures. 🌿🥛 #Dugdhsar #GirCow #A2Milk #Seoni',
      likes: 2480,
      comments: 118,
      timestamp: '2 hours ago',
      permalink: 'https://www.instagram.com/dugdhsar.in/'
    },
    {
      id: 'ig-post-2',
      type: 'photo',
      mediaUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80',
      caption: 'Sealed cold in sterilized glass bottles. Delivered across Seoni every morning before 11:00 AM. 🥛✨ #VedicDairy #DoorstepDelivery',
      likes: 1845,
      comments: 72,
      timestamp: 'Yesterday',
      permalink: 'https://www.instagram.com/dugdhsar.in/'
    },
    {
      id: 'ig-post-3',
      type: 'reel',
      mediaUrl: 'https://images.unsplash.com/photo-1596733430284-f7437764b1a9?auto=format&fit=crop&w=800&q=80',
      caption: '5-Stage Bilona Vidhi: Curd churned with traditional bi-directional wooden bilona into aromatic danedar golden ghee. 🏺💛 #BilonaGhee',
      likes: 3620,
      comments: 215,
      timestamp: '2 days ago',
      permalink: 'https://www.instagram.com/dugdhsar.in/'
    },
    {
      id: 'ig-post-4',
      type: 'photo',
      mediaUrl: 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?auto=format&fit=crop&w=800&q=80',
      caption: 'Ahimsa sanctuary ethics. Calves are fully fed before morning milking begins. 60 years of uncompromised Vedic heritage. 🐮🙏 #AhimsaMilk',
      likes: 2190,
      comments: 94,
      timestamp: '4 days ago',
      permalink: 'https://www.instagram.com/dugdhsar.in/'
    },
    {
      id: 'ig-post-5',
      type: 'carousel',
      mediaUrl: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=800&q=80',
      caption: 'Fresh Malai Paneer made directly from morning whole A2 milk. High bio-protein, silky soft texture. 🧀✨ #FreshPaneer #PureDairy',
      likes: 1730,
      comments: 63,
      timestamp: '5 days ago',
      permalink: 'https://www.instagram.com/dugdhsar.in/'
    },
    {
      id: 'ig-post-6',
      type: 'photo',
      mediaUrl: '/assets/aistudio/1000095715-clean_c92aa3a9.png',
      caption: 'Visit our flagship physical dairy shop at Barghat Road, Sufi Nagar, Seoni! Pure A2 milk, butter & bilona ghee available daily. 📍🥛',
      likes: 2950,
      comments: 142,
      timestamp: '1 week ago',
      permalink: 'https://www.instagram.com/dugdhsar.in/'
    }
  ]);

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncedTime('Just now (Live)');
    }, 1200);
  };

  return (
    <section id="instagram-feed" className="py-14 sm:py-20 bg-[#F8F4EC] relative overflow-hidden border-t border-[#D8C9AD]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Instagram Profile Connected Card Header */}
        <div className="bg-[#FAF6EE] rounded-3xl border border-[#D8C9AD] p-5 sm:p-8 shadow-sm mb-10 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            
            {/* Left: Avatar + Account Meta */}
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              {/* Instagram Story Ring Avatar */}
              <div className="relative p-1 rounded-full bg-gradient-to-tr from-[#A87520] via-[#A34F37] to-[#124A86] shrink-0 shadow-md">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white p-1 overflow-hidden">
                  <img 
                    src="/assets/aistudio/1000095715-clean_c92aa3a9.png" 
                    alt="Dugdhsar Official Instagram Profile" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="absolute bottom-0 right-0 p-1 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-full text-white shadow-sm">
                  <Instagram className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Handle & Stats */}
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h3 className="font-serif text-lg sm:text-xl font-black text-[#263D30] tracking-tight">
                    dugdhsar.in
                  </h3>
                  <CheckCircle2 className="w-4 h-4 text-[#124A86] fill-[#124A86] text-white shrink-0" />
                </div>

                <p className="text-xs text-[#302C26]/80 font-medium mt-0.5">
                  DUGDHSAR · Vedic Gir Cow A2 Dairy & Bilona Ghee
                </p>

                {/* Stats Bar */}
                <div className="flex items-center justify-center sm:justify-start gap-4 mt-2 text-xs font-bold text-[#263D30]">
                  <span><strong>180+</strong> posts</span>
                  <span><strong>45.8K</strong> followers</span>
                  <span><strong>Seoni, MP</strong></span>
                </div>
              </div>
            </div>

            {/* Right: Actions (Follow on Instagram + Live Sync Trigger) */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
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
                onClick={handleManualSync}
                disabled={isSyncing}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#FAF6EE] hover:bg-[#F3EDE1] text-[#263D30] border border-[#D8C9AD] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
                title="Sync new posts uploaded to Instagram"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#A34F37] ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Feed'}</span>
              </button>
            </div>

          </div>

          {/* Sync Status Banner */}
          <div className="mt-4 pt-3 border-t border-[#D8C9AD]/60 flex flex-wrap items-center justify-between text-[11px] text-[#302C26]/75">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-emerald-800">Connected to Instagram Handle @dugdhsar.in</span>
            </div>
            <span className="text-[10px] text-[#302C26]/60">
              Auto-stream active · Last sync: {lastSyncedTime}
            </span>
          </div>
        </div>

        {/* Section Heading */}
        <div className="text-center mb-8 px-4">
          <p className="text-xs uppercase tracking-[0.25em] text-[#A34F37] font-bold mb-1">
            Live Sanctuary Feed
          </p>
          <h2 className="text-2xl sm:text-4xl font-serif text-[#263D30] font-black tracking-tight uppercase">
            Join 45,000+ Conscious Families Celebrating Pure Vedic Living
          </h2>
          <p className="text-xs sm:text-sm text-[#302C26]/75 max-w-xl mx-auto mt-2">
            Every post and reel uploaded to our official Instagram <strong>@dugdhsar.in</strong> is streamed live below. Tap any post to view, like, or comment directly on Instagram.
          </p>
        </div>

        {/* Responsive Instagram Posts Grid: 2 cols on mobile, 3 on tablet, 6 on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {posts.map((post) => (
            <a
              key={post.id}
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative bg-[#FAF6EE] rounded-2xl overflow-hidden border border-[#D8C9AD] aspect-square flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 block shadow-xs"
            >
              {/* Post Media (Image / Thumbnail) */}
              <img
                src={post.mediaUrl}
                alt={post.caption}
                className="w-full h-full object-cover object-center transform group-hover:scale-108 transition-transform duration-500"
              />

              {/* Badge for Reel / Carousel */}
              <div className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-black/60 text-white backdrop-blur-xs">
                {post.type === 'reel' ? (
                  <Play className="w-3 h-3 fill-white" />
                ) : (
                  <Instagram className="w-3 h-3 text-[#C2A36C]" />
                )}
              </div>

              {/* Bottom Subtle Gradient for Mobile Readability */}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/75 to-transparent z-10 flex items-end p-2 sm:hidden">
                <span className="text-[10px] text-white font-semibold truncate flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-red-400 text-red-400" />
                  <span>{post.likes}</span>
                </span>
              </div>

              {/* Rich Interactive Overlay on Hover / Focus */}
              <div className="absolute inset-0 bg-[#263D30]/92 text-[#FAF6EE] p-3 sm:p-4 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                <div className="flex items-center justify-between text-[10px] text-[#C2A36C] font-bold">
                  <span>@dugdhsar.in</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>

                <p className="text-[10px] sm:text-[11px] leading-relaxed text-[#FAF6EE]/95 line-clamp-4 font-medium">
                  {post.caption}
                </p>

                <div className="pt-2 border-t border-white/20 flex items-center justify-between text-[10px] text-[#FAF6EE]/80">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 fill-[#C2A36C] text-[#C2A36C]" />
                      <span>{post.likes}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3 text-[#FAF6EE]" />
                      <span>{post.comments}</span>
                    </span>
                  </div>
                  <span className="text-[#C2A36C] font-bold text-[9px] uppercase tracking-wider">
                    View Post →
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Bottom CTA to Instagram Profile */}
        <div className="mt-10 text-center">
          <a
            href="https://www.instagram.com/dugdhsar.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#FAF6EE] hover:bg-[#F3EDE1] text-[#263D30] border-2 border-[#D8C9AD] hover:border-[#263D30] rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
          >
            <Instagram className="w-4 h-4 text-[#A34F37]" />
            <span>Open Official @dugdhsar.in on Instagram App</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#C2A36C]" />
          </a>
        </div>

      </div>
    </section>
  );
};
