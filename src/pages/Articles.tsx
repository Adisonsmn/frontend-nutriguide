import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, ArrowRight, Star } from 'lucide-react';
import { fetchAllArticles } from '../api/article.api';
import type { Article } from '../types/article.types';
import { usePageTitle } from '../hooks/usePageTitle';

/* ─── category badge colours ─── */
const badgeColor: Record<string, string> = {
  nutrition: 'bg-red-500 text-white',
  exercise: 'bg-blue-500 text-white',
  habits: 'bg-orange-500 text-white',
  recipes: 'bg-emerald-500 text-white',
  wellness: 'bg-purple-500 text-white',
};

const getBadge = (cat: string) =>
  badgeColor[cat.toLowerCase()] || 'bg-gray-500 text-white';

/* ─── reading time estimate ─── */
const readTime = (content: string) => Math.max(1, Math.ceil(content.split(/\s+/).length / 200));

/* ─── filter categories ─── */
const CATEGORIES = ['All', 'Nutrition', 'Exercise', 'Habits', 'Recipes', 'Wellness'];

export const Articles = () => {
  usePageTitle('Articles');
  const navigate = useNavigate();

  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  /* ─── load ─── */
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const category = activeFilter === 'All' ? undefined : activeFilter;
        const res = await fetchAllArticles(category);
        setArticles(res.data);
      } catch {
        console.error('Failed to fetch articles');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [activeFilter]);

  /* ─── search filter (client-side) ─── */
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return articles;
    const q = searchQuery.toLowerCase();
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
    );
  }, [articles, searchQuery]);

  /* ─── split into featured (first 3) and latest ─── */
  const featured = filtered.slice(0, 3);
  const latest = filtered.slice(3);

  /* ─── format date ─── */
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  /* ─── Loading ─── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 py-8 animate-fade-in">
      {/* ─── Page Title ─── */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Health Articles &amp; Tips</h1>
        <p className="text-gray-500 mt-1">
          Expert insights on nutrition, wellness, and healthy living
        </p>
      </div>

      {/* ─── Search Bar ─── */}
      <div className="relative mb-5">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          id="article-search"
          type="text"
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-80 pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
        />
      </div>

      {/* ─── Filter by Topic ─── */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        <span className="text-sm font-medium text-gray-600 mr-1">🔽 Filter by Topic</span>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              activeFilter === cat
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary/40'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ─── Featured Articles ─── */}
      {featured.length > 0 && (
        <section className="mb-10">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-5">
            <Star size={18} className="text-gold" /> Featured Articles
          </h2>

          {/* 2-col top row + optional 3rd card centred */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featured.map((article) => (
              <ArticleCard
                key={article.article_id}
                article={article}
                onNavigate={() => navigate(`/articles/${article.article_id}`)}
                fmtDate={fmtDate}
              />
            ))}
          </div>
        </section>
      )}

      {/* ─── Latest Articles ─── */}
      {latest.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Latest Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {latest.map((article) => (
              <ArticleCard
                key={article.article_id}
                article={article}
                onNavigate={() => navigate(`/articles/${article.article_id}`)}
                fmtDate={fmtDate}
              />
            ))}
          </div>
        </section>
      )}

      {/* ─── Empty State ─── */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <Search size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No articles found</h3>
          <p className="text-sm text-gray-400">
            Try adjusting your search or filter to find what you're looking for.
          </p>
        </div>
      )}

    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
 *  Article Card Sub-component (matches the design exactly)
 * ═══════════════════════════════════════════════════════════════ */
interface ArticleCardProps {
  article: Article;
  onNavigate: () => void;
  fmtDate: (d: string) => string;
}

const ArticleCard = ({ article, onNavigate, fmtDate }: ArticleCardProps) => {
  const mins = readTime(article.content);

  return (
    <div
      onClick={onNavigate}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer group hover:-translate-y-1"
    >
      {/* Image */}
      {article.image_url ? (
        <div className="w-full h-48 overflow-hidden">
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
          Image not available
        </div>
      )}

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        {/* Badge + Read time */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${getBadge(
              article.category
            )}`}
          >
            {article.category}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Clock size={12} /> {mins} min read
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-gray-900 text-base leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {article.title}
        </h3>

        {/* Preview */}
        <p className="text-sm text-gray-500 leading-relaxed mb-4 flex-1 line-clamp-3">
          {article.content}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
          <span className="text-xs text-gray-400">{fmtDate(article.published_at)}</span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:text-primary/80 transition-colors">
            Read More <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </div>
  );
};
