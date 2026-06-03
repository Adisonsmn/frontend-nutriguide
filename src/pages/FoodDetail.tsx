import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Save, Flame, Beef, Wheat, Droplets, UtensilsCrossed, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchFoodById, addToHistory } from '../api/food.api';
import type { Food } from '../types/food.types';
import { usePageTitle } from '../hooks/usePageTitle';

/* ─── category badge colours ─── */
const categoryBadgeColor: Record<string, string> = {
  'high protein': 'bg-blue-700 text-white',
  vegetarian: 'bg-emerald-700 text-white',
  'low carb': 'bg-violet-700 text-white',
  'low sugar': 'bg-pink-700 text-white',
  'gluten free': 'bg-amber-700 text-white',
  'budget friendly': 'bg-teal-700 text-white',
};

const getBadgeColor = (cat: string) =>
  categoryBadgeColor[cat.trim().toLowerCase()] || 'bg-gray-700 text-white';

/* ─── format price to Rupiah ─── */
const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

export const FoodDetail = () => {
  const { foodId } = useParams<{ foodId: string }>();
  const navigate = useNavigate();

  const [food, setFood] = useState<Food | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  // Bug #15: User-configurable quantity instead of hardcoded 100g
  const [quantity, setQuantity] = useState<number>(100);
  const [showEatModal, setShowEatModal] = useState(false);
  const [eatQuantity, setEatQuantity] = useState<number>(100);

  usePageTitle(food?.name ?? 'Food Detail');

  useEffect(() => {
    const load = async () => {
      if (!foodId) return;
      setIsLoading(true);
      try {
        const res = await fetchFoodById(foodId);
        setFood(res.data);
      } catch {
        toast.error('Failed to load food details');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [foodId]);

  /* ─── Save to History ─── */
  const handleSaveToHistory = async () => {
    if (!foodId || quantity <= 0) return;
    setIsSaving(true);
    try {
      // Bug #15: Use user-specified quantity
      await addToHistory(foodId, quantity, false);
      toast.success(`Saved ${quantity}g to history!`);
    } catch {
      toast.error('Failed to save to history');
    } finally {
      setIsSaving(false);
    }
  };

  /* ─── Eat Now ─── */
  const handleEatNow = async () => {
    if (!foodId || eatQuantity <= 0) return;
    setIsSaving(true);
    try {
      await addToHistory(foodId, eatQuantity, true);
      toast.success(`Nutrition for ${eatQuantity}g logged!`);
      setShowEatModal(false);
    } catch {
      toast.error('Failed to log meal');
    } finally {
      setIsSaving(false);
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

  if (!food) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Food not found</h2>
        <p className="text-gray-500 mb-6">The food you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/recommendations')}
          className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
        >
          <ArrowLeft size={18} /> Back to Recommendations
        </button>
      </div>
    );
  }

  const categories = food.category.split(',').map((c) => c.trim());

  return (
    <div className="max-w-3xl mx-auto px-2 sm:px-4 py-8 animate-fade-in">
      {/* ─── Back Link ─── */}
      <button
        id="back-to-recommendations-top"
        onClick={() => navigate('/recommendations')}
        className="inline-flex items-center gap-2 text-gray-700 font-medium mb-6 hover:text-primary transition-colors"
      >
        <ArrowLeft size={18} /> Back to Recommendations
      </button>

      {/* ─── Hero Image ─── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        {food.image_url && (
          <div className="w-full h-64 sm:h-80 overflow-hidden">
            <img
              src={food.image_url}
              alt={food.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* ─── Info Section ─── */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{food.name}</h1>
            <span className="text-lg font-bold text-primary whitespace-nowrap ml-4">
              {formatPrice(food.price_estimate)}
            </span>
          </div>

          {/* Category Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((cat) => (
              <span
                key={cat}
                className={`text-xs font-semibold px-3 py-1 rounded-full ${getBadgeColor(cat)}`}
              >
                {cat}
              </span>
            ))}
          </div>

          <p className="text-gray-500 text-sm leading-relaxed">
            A delicious and nutritious meal that fits your dietary preferences and budget goals.
          </p>
        </div>
      </div>

      {/* ─── Nutritional Information ─── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-5">Nutritional Information</h2>

        {/* Main 4-stat grid */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <Flame size={20} className="mx-auto text-orange-400 mb-1" />
            <p className="text-xl font-bold text-gray-900">{food.calories}</p>
            <p className="text-xs text-gray-500">Calories</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <Beef size={20} className="mx-auto text-blue-400 mb-1" />
            <p className="text-xl font-bold text-gray-900">{food.protein_g}g</p>
            <p className="text-xs text-gray-500">Protein</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <Wheat size={20} className="mx-auto text-indigo-400 mb-1" />
            <p className="text-xl font-bold text-gray-900">{food.carbs_g}g</p>
            <p className="text-xs text-gray-500">Carbs</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <Droplets size={20} className="mx-auto text-yellow-400 mb-1" />
            <p className="text-xl font-bold text-gray-900">{food.fat_g}g</p>
            <p className="text-xs text-gray-500">Fat</p>
          </div>
        </div>
      </div>

      {/* ─── Action Buttons ─── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        {/* Eat Now */}
        <button
          onClick={() => setShowEatModal(true)}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white font-bold hover:opacity-90 transition-opacity mb-3 shadow-md"
        >
          <UtensilsCrossed size={18} /> Eat Now
        </button>

        {/* View Recipe */}
        <button
          id="btn-view-recipe"
          onClick={() => navigate(`/food/${foodId}/recipe`)}
          disabled={!food.recipe}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <BookOpen size={18} /> View Recipe
        </button>

        {/* Bug #15: Quantity input */}
        <div className="mb-4">
          <label htmlFor="quantity-input" className="block text-sm font-semibold text-gray-700 mb-2">
            Quantity (grams)
          </label>
          <input
            id="quantity-input"
            type="number"
            min={1}
            max={2000}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </div>

        {/* Save to History */}
        <button
          id="btn-save-history"
          onClick={handleSaveToHistory}
          disabled={isSaving || quantity <= 0}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gold text-gray-900 font-semibold hover:bg-gold/90 transition-colors mb-3 disabled:opacity-50"
        >
          <Save size={18} /> {isSaving && !showEatModal ? 'Saving...' : `Save ${quantity}g to History`}
        </button>

        {/* Back to Recommendations */}
        <button
          id="btn-back-recommendations"
          onClick={() => navigate('/recommendations')}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={18} /> Back to Recommendations
        </button>
      </div>

      {/* ─── Personalized Banner ─── */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/50 rounded-2xl px-6 py-5">
        <p className="font-semibold text-amber-800">Personalized for You</p>
        <p className="text-sm text-amber-600 mt-1">
          This meal matches your dietary preferences and fits within your budget goals.
        </p>
      </div>

      {/* ─── Eat Now Modal ─── */}
      {showEatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-sm w-full mx-4 animate-fade-in relative">
            <button
              onClick={() => setShowEatModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <UtensilsCrossed size={24} className="text-orange-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">How much did you eat?</h3>
              <p className="text-sm text-gray-500 mt-1">Enter quantity to calculate nutrition.</p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity (grams)</label>
              <input
                type="number"
                min={1}
                max={2000}
                value={eatQuantity}
                onChange={(e) => setEatQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition text-center"
              />
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-600 flex justify-between">
                <span>Calories:</span>
                <span className="font-semibold text-gray-900">{Math.round(food.calories * (eatQuantity / 100))} kcal</span>
              </p>
              <p className="text-sm text-gray-600 flex justify-between mt-1">
                <span>Protein:</span>
                <span className="font-semibold text-gray-900">{Math.round(food.protein_g * (eatQuantity / 100))}g</span>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEatModal(false)}
                className="flex-1 py-3 rounded-xl font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEatNow}
                disabled={isSaving}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-400 to-orange-500 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSaving ? 'Logging...' : 'Log Meal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
