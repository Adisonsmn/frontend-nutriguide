import { Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Food } from '../../types/food.types';

interface FoodCardProps {
  food: Food;
}

export const FoodCard = ({ food }: FoodCardProps) => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(`/food/${food.food_id}`)}
      className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 bg-white cursor-pointer group"
    >
      {/* Image */}
      {food.image_url ? (
        <div className="relative w-full h-48 overflow-hidden">
          <img
            src={food.image_url}
            alt={food.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="w-full h-48 bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
          Image not yet available
        </div>
      )}

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 text-base group-hover:text-primary transition-colors">{food.name}</h3>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-sm text-gray-500">
            <Flame size={14} className="text-orange-400" />
            {food.calories} cal
          </span>
          <span className="text-green-600 font-semibold text-sm">
            Rp {food.price_estimate.toLocaleString('id-ID')}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 mt-2.5">
          {food.category.split(',').map((cat) => (
            <span
              key={cat.trim()}
              className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium"
            >
              {cat.trim()}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
