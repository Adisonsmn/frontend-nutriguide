import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Share2, Bookmark, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchArticleById } from '../api/article.api';
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

/* ─── format date ─── */
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

export const ArticleDetail = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();

  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  usePageTitle(article?.title ?? 'Article');

  useEffect(() => {
    const load = async () => {
      if (!articleId) return;
      setIsLoading(true);
      try {
        const res = await fetchArticleById(articleId);
        setArticle(res.data);
      } catch {
        toast.error('Failed to load article');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [articleId]);

  /* ─── Share handler ─── */
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: article?.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  /* ─── Loading ─── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Article not found</h2>
        <p className="text-gray-500 mb-6">The article you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/articles')}
          className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
        >
          <ArrowLeft size={18} /> Back to Articles
        </button>
      </div>
    );
  }

  const mins = readTime(article.content);

  /* ─── Split content into paragraphs ─── */
  const paragraphs = article.content
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .reduce<string[]>((acc, sentence, i) => {
      // Group every 2-3 sentences into a paragraph
      const groupIndex = Math.floor(i / 3);
      if (!acc[groupIndex]) acc[groupIndex] = '';
      acc[groupIndex] += (acc[groupIndex] ? ' ' : '') + sentence;
      return acc;
    }, []);

  return (
    <div className="max-w-3xl mx-auto px-2 sm:px-4 py-8 animate-fade-in">
      {/* ─── Breadcrumb ─── */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <button
          id="back-to-articles"
          onClick={() => navigate('/articles')}
          className="hover:text-primary transition-colors"
        >
          Articles
        </button>
        <ChevronRight size={14} />
        <span className="text-gray-600 truncate max-w-[250px]">{article.title}</span>
      </div>

      {/* ─── Hero Image ─── */}
      {article.image_url && (
        <div className="w-full h-56 sm:h-72 rounded-2xl overflow-hidden mb-8">
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* ─── Article Header ─── */}
      <header className="mb-8">
        {/* Category Badge */}
        <div className="flex items-center gap-3 mb-4">
          <span
            className={`text-xs px-3 py-1 rounded-full font-semibold ${getBadge(article.category)}`}
          >
            {article.category}
          </span>
          <span className="flex items-center gap-1 text-sm text-gray-400">
            <Clock size={14} /> {mins} min read
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-4">
          {article.title}
        </h1>

        {/* Meta row */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} /> {fmtDate(article.published_at)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-share-article"
              onClick={handleShare}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors"
              title="Share article"
            >
              <Share2 size={18} />
            </button>
            <button
              id="btn-bookmark-article"
              onClick={() => toast.success('Article bookmarked!')}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors"
              title="Bookmark article"
            >
              <Bookmark size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ─── Article Body ─── */}
      <article className="prose-custom mb-10">
        {paragraphs.map((paragraph, index) => (
          <p
            key={index}
            className="text-gray-700 leading-relaxed text-base mb-5"
          >
            {paragraph}
          </p>
        ))}
      </article>

      {/* ─── Tags / Related Topics ─── */}
      <div className="border-t border-gray-100 pt-6 mb-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Related Topics
        </h3>
        <div className="flex flex-wrap gap-2">
          {getRelatedTopics(article.category).map((topic) => (
            <span
              key={topic}
              className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-full hover:bg-gray-200 transition-colors cursor-default"
            >
              {topic}
            </span>
          ))}
        </div>
      </div>

      {/* ─── Back to Articles ─── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
        <p className="text-gray-500 text-sm mb-4">
          Enjoyed this article? Explore more health insights.
        </p>
        <button
          id="btn-back-to-articles-bottom"
          onClick={() => navigate('/articles')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft size={18} /> Browse All Articles
        </button>
      </div>
    </div>
  );
};

/* ─── Related topics by category ─── */
function getRelatedTopics(category: string): string[] {
  const topics: Record<string, string[]> = {
    Nutrition: ['Macronutrients', 'Meal Planning', 'Diet Tips', 'Vitamins', 'Healthy Eating'],
    Exercise: ['Workout', 'Fitness', 'Strength Training', 'Cardio', 'Recovery'],
    Habits: ['Lifestyle', 'Self-improvement', 'Daily Routine', 'Mindfulness', 'Productivity'],
    Recipes: ['Cooking', 'Meal Prep', 'Healthy Recipes', 'Budget Meals', 'Quick Meals'],
    Wellness: ['Mental Health', 'Sleep', 'Stress Relief', 'Gut Health', 'Self-care'],
  };
  return topics[category] || ['Health', 'Nutrition', 'Lifestyle'];
}
