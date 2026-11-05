import React from 'react';
import { useStore } from '../../context/StoreContext';
import { useRouter } from '../../router/RouterContext';
import { ArrowRight, Clock, User, BookOpen } from 'lucide-react';

export const JournalIndexPage: React.FC = () => {
  const { journalPosts } = useStore();
  const { navigate } = useRouter();

  return (
    <div className="bg-[#F8F4EC] text-[#302C26] min-h-screen">
      {/* Editorial Header */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 border-b border-[#D8C9AD]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-[#A34F37] font-semibold mb-3">
            The Dugdhsar Chronicle
          </p>
          <h1 className="text-4xl sm:text-5xl font-serif text-[#263D30] font-normal mb-4">
            Essays on Vedic Nutrition, Ahimsa & Dairy Science
          </h1>
          <p className="text-base text-[#302C26]/80 max-w-2xl mx-auto leading-relaxed">
            Thoughtful dispatches from our veterinarians, dairy craftsmen, and Ayurvedic scholars on restoring sacred integrity to modern sustenance.
          </p>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {journalPosts.map((post) => (
            <article 
              key={post.id}
              onClick={() => navigate(`/journal/${post.slug}`)}
              className="bg-[#FAF6EE] rounded-xl border border-[#D8C9AD] overflow-hidden hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="h-48 overflow-hidden bg-[#263D30]/10 relative">
                  <img 
                    src={post.coverImage} 
                    alt={post.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-[#263D30]/80 text-[#F3EDE1] px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wider">
                    {post.tags[0]}
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-2 text-[11px] text-[#A34F37] font-medium mb-2">
                    <span>{post.readTime}</span>
                    <span>·</span>
                    <span>{new Date(post.publishedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>

                  <h2 className="text-xl font-serif text-[#263D30] font-semibold mb-3 group-hover:text-[#A34F37] transition-colors leading-snug">
                    {post.title}
                  </h2>

                  <p className="text-xs text-[#302C26]/75 line-clamp-3 leading-relaxed mb-4">
                    {post.excerpt}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0 border-t border-[#D8C9AD]/40 flex items-center justify-between text-xs text-[#263D30]">
                <span className="font-medium text-[#302C26]/80 truncate max-w-[180px]">{post.author}</span>
                <span className="text-[#A34F37] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Read</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
