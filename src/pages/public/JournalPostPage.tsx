import React from 'react';
import { useStore } from '../../context/StoreContext';
import { useRouter } from '../../router/RouterContext';
import { ArrowLeft, Clock, User, Share2, Tag, CheckCircle2 } from 'lucide-react';
import { usePageSEO } from '../../lib/seo';

export const JournalPostPage: React.FC = () => {
  const { journalPosts } = useStore();
  const { params, navigate } = useRouter();

  const post = journalPosts.find(p => p.slug === params.slug) || journalPosts[0];

  usePageSEO({
    title: `${post.title} — Vedic Dairy Journal`,
    description: post.excerpt,
    ogType: 'article',
    ogImage: post.coverImage,
    ogImageAlt: post.title,
  });

  return (
    <div className="bg-[#F8F4EC] text-[#302C26] min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <button 
          onClick={() => navigate('/journal')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#A34F37] hover:text-[#263D30] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Journal Dispatches</span>
        </button>

        <article className="bg-[#FAF6EE] p-8 sm:p-12 rounded-2xl border border-[#D8C9AD] shadow-sm">
          {/* Header Metadata */}
          <div className="flex items-center gap-2 text-xs text-[#A34F37] font-semibold uppercase tracking-wider mb-3">
            <span>{post.tags.join(' · ')}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif text-[#263D30] font-normal leading-tight mb-6">
            {post.title}
          </h1>

          <div className="flex items-center justify-between pb-6 mb-8 border-b border-[#D8C9AD] text-xs text-[#302C26]/75">
            <div>
              <span className="font-semibold text-[#263D30] block">{post.author}</span>
              <span className="text-[11px] text-[#302C26]/60">{post.authorRole}</span>
            </div>
            <div className="text-right">
              <span className="block">{new Date(post.publishedAt).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              <span className="text-[11px] text-[#A34F37]">{post.readTime}</span>
            </div>
          </div>

          {/* Cover image */}
          <div className="mb-8 rounded-xl overflow-hidden border border-[#D8C9AD]">
            <img 
              src={post.coverImage} 
              alt={post.title} 
              className="w-full h-80 object-cover"
            />
          </div>

          {/* Body Content */}
          <div className="prose prose-stone max-w-none text-[#302C26] leading-relaxed text-sm sm:text-base space-y-6">
            {post.content.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {/* Author Badge Callout */}
          <div className="mt-12 p-6 bg-[#F8F4EC] rounded-xl border border-[#D8C9AD] flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#263D30] text-[#F3EDE1] font-serif font-bold text-lg flex items-center justify-center shrink-0">
              {post.author.charAt(0)}
            </div>
            <div>
              <h4 className="font-serif text-base font-semibold text-[#263D30]">{post.author}</h4>
              <p className="text-xs text-[#302C26]/75">{post.authorRole} at DUGDHSAR Vedic Gaushala.</p>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};
