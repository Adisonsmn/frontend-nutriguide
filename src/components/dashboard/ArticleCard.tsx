import { useNavigate } from 'react-router-dom';
import type { Article } from '../../types/article.types';

interface ArticleCardProps {
  article: Article;
}

export const ArticleCard = ({ article }: ArticleCardProps) => {
  const navigate = useNavigate();

  // Determine badge styling based on category
  const getBadgeStyle = (category: string) => {
    switch (category.toLowerCase()) {
      case 'nutrition':
        return 'bg-red-100 text-red-700';
      case 'education':
        return 'bg-green-100 text-green-700';
      case 'habits':
        return 'bg-orange-100 text-orange-700';
      case 'exercise':
        return 'bg-blue-100 text-blue-700';
      case 'recipes':
        return 'bg-emerald-100 text-emerald-700';
      case 'wellness':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Format date
  const formattedDate = new Date(article.published_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      onClick={() => navigate(`/articles/${article.article_id}`)}
      className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 bg-white cursor-pointer group hover:-translate-y-1"
    >
      {/* Image */}
      {article.image_url ? (
        <div className="w-full h-40 overflow-hidden">
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="w-full h-40 bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
          Image not yet available
        </div>
      )}

      {/* Info */}
      <div className="p-4">
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium inline-block mb-2 ${getBadgeStyle(
            article.category
          )}`}
        >
          {article.category}
        </span>
        <h3 className="font-semibold text-gray-800 text-base leading-snug line-clamp-2 mt-1 group-hover:text-primary transition-colors">
          {article.title}
        </h3>
        <p className="text-xs text-gray-400 mt-2 font-medium">{formattedDate}</p>
      </div>
    </div>
  );
};

