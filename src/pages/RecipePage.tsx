import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download, Clock, ChefHat, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchFoodById } from '../api/food.api';
import type { Food } from '../types/food.types';
import { usePageTitle } from '../hooks/usePageTitle';

export const RecipePage = () => {
  const { foodId } = useParams<{ foodId: string }>();
  const navigate = useNavigate();

  const [food, setFood] = useState<Food | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  usePageTitle(food ? `Recipe — ${food.name}` : 'Recipe');

  useEffect(() => {
    const load = async () => {
      if (!foodId) return;
      setIsLoading(true);
      try {
        const res = await fetchFoodById(foodId);
        setFood(res.data);
      } catch {
        toast.error('Failed to load recipe');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [foodId]);

  /* ─── Print handler ─── */
  const handlePrint = () => window.print();

  /* ─── Save / download as text ─── */
  const handleSave = () => {
    if (!food?.recipe) return;
    const ingredients = safeParseJson(food.recipe.ingredients);
    const steps = safeParseJson(food.recipe.steps);

    let text = `${food.name}\n${'='.repeat(food.name.length)}\n\n`;
    text += `Prep Time: ${food.recipe.prep_time_min} min\n\n`;
    text += `INGREDIENTS\n${'-'.repeat(12)}\n`;
    ingredients.forEach((item: string) => {
      text += `• ${item}\n`;
    });
    text += `\nINSTRUCTIONS\n${'-'.repeat(12)}\n`;
    steps.forEach((step: string, i: number) => {
      text += `${i + 1}. ${step}\n`;
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recipe-${food.name.toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ─── Loading ─── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!food || !food.recipe) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Recipe not found</h2>
        <p className="text-gray-500 mb-6">This food doesn't have a recipe yet.</p>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
        >
          <ArrowLeft size={18} /> Go Back
        </button>
      </div>
    );
  }

  const recipe = food.recipe;
  const ingredients = safeParseJson(recipe.ingredients);
  const steps = safeParseJson(recipe.steps);

  return (
    <div className="max-w-3xl mx-auto px-2 sm:px-4 py-8 animate-fade-in">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between mb-6">
        <button
          id="btn-back-from-recipe"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-gray-700 font-medium hover:text-primary transition-colors"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <div className="flex items-center gap-2">
          <button
            id="btn-print-recipe"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Printer size={16} /> Print
          </button>
          <button
            id="btn-save-recipe"
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download size={16} /> Save
          </button>
        </div>
      </div>

      {/* ─── Title Section ─── */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{food.name}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <Clock size={16} className="text-gray-400" /> Prep: {recipe.prep_time_min} min
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ChefHat size={16} className="text-gray-400" /> Cook: {Math.round(recipe.prep_time_min * 0.8)} min
          </span>
          <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-gold text-gray-900">
            Easy
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users size={16} className="text-gray-400" /> 2 servings
          </span>
        </div>
      </div>

      {/* ─── Ingredients Card ─── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-5">Ingredients</h2>
        <div className="flex flex-col gap-4">
          {ingredients.map((item: string, index: number) => {
            return (
              <div key={index} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                <p className="font-medium text-gray-800">{item}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Instructions Card ─── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Instructions</h2>
        <div className="flex flex-col gap-6">
          {steps.map((step: string, index: number) => (
            <div key={index} className="flex gap-4 items-start border-b border-gray-50 pb-5 last:border-0 last:pb-0">
              {/* Step Number Circle */}
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
              <div className="flex-1 pt-1">
                <p className="text-gray-700 leading-relaxed">{step}</p>
                <p className="text-xs text-gray-400 mt-1.5 inline-flex items-center gap-1">
                  <Clock size={12} /> ~{Math.max(2, Math.round(recipe.prep_time_min / steps.length))} min
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Chef's Tips ─── */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/50 rounded-2xl px-6 py-5">
        <div className="flex items-center gap-2 mb-2">
          <ChefHat size={18} className="text-amber-700" />
          <p className="font-semibold text-amber-800">Chef's Tips</p>
        </div>
        <ul className="text-sm text-amber-600 space-y-1">
          <li>Always let meat rest after cooking to retain juices</li>
          <li>Adjust seasoning to your personal taste preferences</li>
          <li>Meal prep by cooking ingredients in advance</li>
        </ul>
      </div>
    </div>
  );
};

/* ─── Safely parse JSON string → array ─── */
function safeParseJson(jsonStr: string): string[] {
  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed : [jsonStr];
  } catch {
    // If not valid JSON, split by newline or return as-is
    return jsonStr.includes('\n') ? jsonStr.split('\n').filter(Boolean) : [jsonStr];
  }
}
