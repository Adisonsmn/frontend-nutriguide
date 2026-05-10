import { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Flame,
  Star,
  TrendingUp,
  RefreshCw,
  Settings,
  Download,
  UtensilsCrossed,
} from 'lucide-react';
import { fetchRecommendations } from '../api/recommendation.api';
import { fetchNutritionTarget, fetchProfile } from '../api/dashboard.api';
import type { NutritionTarget, ProfileData } from '../api/dashboard.api';
import type { RecommendationData } from '../types/recommendation.types';
import type { Food } from '../types/food.types';
import { usePageTitle } from '../hooks/usePageTitle';

/* ─── helper: capitalise first letter ─── */
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ─── meal-type badge colours ─── */
const mealBadge: Record<string, string> = {
  breakfast: 'bg-amber-100 text-amber-700',
  lunch: 'bg-emerald-100 text-emerald-700',
  dinner: 'bg-indigo-100 text-indigo-700',
  snack: 'bg-pink-100 text-pink-700',
};

/* ─── meal emoji icons ─── */
const mealEmoji: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};

/* ─── meal calorie target percentages ─── */
const mealTargetPct: Record<string, number> = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.30,
  snack: 0.10,
};

export const Recommendation = () => {
  usePageTitle('Recommendations');
  const [recommendation, setRecommendation] = useState<RecommendationData | null>(null);
  const [nutritionTarget, setNutritionTarget] = useState<NutritionTarget | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ─── budget / preference filter states ─── */
  const [budgetFilter, setBudgetFilter] = useState<string>('');
  const [preferenceFilter, setPreferenceFilter] = useState<string>('');

  /* ─── load data ─── */
  const loadData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const params: Record<string, unknown> = {};
      if (budgetFilter) params.budget = Number(budgetFilter);
      if (preferenceFilter) params.preference = preferenceFilter;

      const [recRes, nutritionRes, profileRes] = await Promise.allSettled([
        fetchRecommendations(params as { budget?: number; preference?: string }),
        fetchNutritionTarget(),
        fetchProfile(),
      ]);

      if (recRes.status === 'fulfilled') setRecommendation(recRes.value.data);
      else setError('Failed to generate recommendations. Please ensure your profile is set up.');

      if (nutritionRes.status === 'fulfilled') setNutritionTarget(nutritionRes.value.data);
      if (profileRes.status === 'fulfilled') setProfileData(profileRes.value.data);
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── derived stats ─── */
  const stats = useMemo(() => {
    if (!recommendation) return null;
    const allFoods: Food[] = Object.values(recommendation.meals).flat();
    const totalMeals = allFoods.length;
    const avgCalories = totalMeals > 0 ? Math.round(recommendation.total_calories / totalMeals) : 0;

    // Find top category
    const categoryCount: Record<string, number> = {};
    allFoods.forEach((f) => {
      const cats = f.category.split(',');
      cats.forEach((c) => {
        const trimmed = c.trim();
        categoryCount[trimmed] = (categoryCount[trimmed] || 0) + 1;
      });
    });
    const topCategory =
      Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Balanced';

    const mealSlots = Object.keys(recommendation.meals).filter(
      (k) => recommendation.meals[k as keyof typeof recommendation.meals].length > 0
    ).length;

    return { totalMeals, avgCalories, topCategory, mealSlots };
  }, [recommendation]);

  /* ─── export handler (CSV download) ─── */
  const handleExport = () => {
    if (!recommendation) return;
    let csv = 'Meal Type,Food Name,Calories,Protein (g),Carbs (g),Fat (g),Price\n';
    for (const [meal, foods] of Object.entries(recommendation.meals)) {
      for (const f of foods) {
        csv += `${cap(meal)},${f.name},${f.calories},${f.protein_g},${f.carbs_g},${f.fat_g},${f.price_estimate}\n`;
      }
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recommendations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ─── Loading ─── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Generating your personalized recommendations...</p>
        </div>
      </div>
    );
  }

  /* ─── Error state ─── */
  if (error && !recommendation) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={() => loadData()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <RefreshCw size={16} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-8 animate-fade-in">
      {/* ─── Page Title ─── */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Food Recommendations</h1>
        <p className="text-gray-500 mt-1">
          Personalized meal plan based on your goals and preferences
        </p>
      </div>

      {/* ─── Summary Stat Cards (2×2 grid like the design) ─── */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Total Meals */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <Calendar size={20} className="text-primary/60" />
              <TrendingUp size={18} className="text-blue-medium" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalMeals}</p>
            <p className="text-sm text-gray-500">Total Meals</p>
          </div>

          {/* Avg Calories / Meal */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <Flame size={20} className="text-orange-400" />
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.avgCalories}</p>
            <p className="text-sm text-gray-500">Avg Calories/Meal</p>
          </div>

          {/* Meal Slots */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <Star size={20} className="text-gold" />
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.mealSlots}</p>
            <p className="text-sm text-gray-500">Meal Slots</p>
          </div>

          {/* Top Category */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary text-white">
              {stats.topCategory}
            </span>
            <p className="text-sm text-gray-500 mt-3">Top Category</p>
          </div>
        </div>
      )}

      {/* ─── Filter Bar + Actions ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        {/* Left: filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            id="preference-filter"
            value={preferenceFilter}
            onChange={(e) => setPreferenceFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-full px-4 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Categories</option>
            <option value="High Protein">High Protein</option>
            <option value="Vegetarian">Vegetarian</option>
            <option value="Low Carb">Low Carb</option>
            <option value="Budget Friendly">Budget Friendly</option>
            <option value="Low Sugar">Low Sugar</option>
            <option value="Gluten Free">Gluten Free</option>
          </select>
          {profileData?.preferences?.daily_budget && (
            <input
              id="budget-filter"
              type="number"
              placeholder={`Budget (max ${profileData.preferences.daily_budget})`}
              value={budgetFilter}
              onChange={(e) => setBudgetFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-full px-4 py-2 w-44 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          )}
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Generating...' : 'Regenerate'}
          </button>
        </div>

        {/* Right: Export */}
        <button
          id="export-recommendations"
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-full text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Download size={16} />
          Export Recommendations
        </button>
      </div>

      {/* ─── Meal Cards (matches the design's daily-card pattern) ─── */}
      {recommendation && (
        <div className="flex flex-col gap-6 mb-8">
          {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((mealType) => {
            const foods = recommendation.meals[mealType];
            if (foods.length === 0) return null;

            const mealCalories = foods.reduce((sum, f) => sum + f.calories, 0);
            const targetForMeal = nutritionTarget
              ? Math.round(nutritionTarget.dailyCalorieTarget * mealTargetPct[mealType])
              : null;

            return (
              <div
                key={mealType}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
                      {mealEmoji[mealType]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{cap(mealType)}</h3>
                      <p className="text-sm text-gray-400">
                        {foods.length} {foods.length === 1 ? 'item' : 'items'} •{' '}
                        {Math.round(mealCalories)} calories
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <span className="font-medium text-primary/70">
                      {foods.length} {foods.length === 1 ? 'meal' : 'meals'}
                    </span>
                    <Settings size={18} className="text-gray-300" />
                  </div>
                </div>

                {/* Food Items */}
                <div className="divide-y divide-gray-50">
                  {foods.map((food, idx) => (
                    <div
                      key={`${food.food_id}-${idx}`}
                      className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                          <UtensilsCrossed size={14} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{food.name}</p>
                          <p className="text-sm text-gray-400">{food.calories} calories</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${mealBadge[mealType]}`}
                        >
                          {cap(mealType)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between px-6 py-3 bg-gray-50/50 border-t border-gray-100">
                  <span className="text-sm font-semibold text-gray-600">Meal Total</span>
                  <span className="text-sm font-bold text-primary">
                    {Math.round(mealCalories)} calories
                    {targetForMeal && (
                      <span className="text-gray-400 font-normal"> / {targetForMeal} target</span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Daily Total Summary ─── */}
      {recommendation && stats && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Daily Total</h3>
              <p className="text-sm text-gray-400 mt-0.5">
                {stats.totalMeals} meals across {stats.mealSlots} meal slots
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{recommendation.total_calories} cal</p>
              {recommendation.target_calories && (
                <p className="text-sm text-gray-400">
                  Target: {recommendation.target_calories} cal
                </p>
              )}
            </div>
          </div>
          {/* Progress Bar */}
          {recommendation.target_calories > 0 && (
            <div className="mt-4">
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(
                      100,
                      (recommendation.total_calories / recommendation.target_calories) * 100
                    )}%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                {Math.round(
                  (recommendation.total_calories / recommendation.target_calories) * 100
                )}
                % of daily target
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── Motivational Banner (matching design) ─── */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-2xl px-6 py-5">
        <p className="font-semibold text-amber-800">
          Eat smart, live well! 🥗
        </p>
        <p className="text-sm text-amber-600 mt-1">
          These recommendations are tailored to your nutritional profile.
          Regenerate anytime to discover new meal combinations!
        </p>
      </div>
    </div>
  );
};
