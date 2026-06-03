import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Flame,
  Star,
  TrendingUp,
  RefreshCw,
  Download,
  Search,
  SearchX,
  SlidersHorizontal,
} from 'lucide-react';
import { fetchRecommendations } from '../api/recommendation.api';
import { fetchProfile } from '../api/dashboard.api';
import type { ProfileData } from '../api/dashboard.api';
import type { RecommendationData } from '../types/recommendation.types';
import type { Food } from '../types/food.types';
import { usePageTitle } from '../hooks/usePageTitle';

/* ─── helper: capitalise first letter ─── */
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ─── category badge colours ─── */
const categoryBadgeColor: Record<string, string> = {
  'high protein': 'bg-blue-50 text-blue-600 border-blue-100',
  'vegetarian': 'bg-emerald-50 text-emerald-600 border-emerald-100',
  'low carb': 'bg-violet-50 text-violet-600 border-violet-100',
  'low sugar': 'bg-pink-50 text-pink-600 border-pink-100',
  'gluten free': 'bg-amber-50 text-amber-600 border-amber-100',
  'budget friendly': 'bg-teal-50 text-teal-600 border-teal-100',
};

const getBadgeColor = (cat: string) =>
  categoryBadgeColor[cat.trim().toLowerCase()] || 'bg-gray-50 text-gray-600 border-gray-100';

export const Recommendation = () => {
  usePageTitle('Recommendations');
  const navigate = useNavigate();

  const [recommendation, setRecommendation] = useState<RecommendationData | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNoFoodAlert, setShowNoFoodAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  /* ─── budget / preference filter states ─── */
  const [budgetFilter, setBudgetFilter] = useState<string>('');
  const [preferenceFilter, setPreferenceFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  /* ─── track whether filters have been initialized from profile ─── */
  const filtersInitialized = useRef(false);

  /* ─── fetch recommendations with current filter values ─── */
  const fetchRecs = async (
    budget: string,
    preference: string,
    showRefresh = false
  ) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const params: Record<string, unknown> = {};
      if (budget !== '') params.budget = Number(budget);
      if (preference) params.preference = preference;

      const recRes = await fetchRecommendations(
        params as { budget?: number; preference?: string }
      );
      setRecommendation(recRes.data);
      
      const allFetchedFoods = recRes.data.meals ? Object.values(recRes.data.meals).flat() : [];
      if (recRes.data.message && allFetchedFoods.length === 0) {
        setAlertMessage(recRes.data.message);
        setShowNoFoodAlert(true);
      } else {
        setShowNoFoodAlert(false);
      }
    } catch (err: unknown) {
      const reason = err as { response?: { data?: { message?: string } } };
      const backendMsg = reason?.response?.data?.message;
      setError(
        backendMsg ||
          'Failed to generate recommendations. Please ensure your profile is set up.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  /* ─── initial load: fetch profile first, populate filters, then fetch recs ─── */
  useEffect(() => {
    if (filtersInitialized.current) return;
    filtersInitialized.current = true;

    const initLoad = async () => {
      setIsLoading(true);
      try {
        const profileRes = await fetchProfile();
        const pData = profileRes.data;
        setProfileData(pData);

        // Pre-populate filter state from saved preferences
        const initBudget =
          pData?.preferences?.daily_budget != null
            ? String(pData.preferences.daily_budget)
            : '';
        const initPreference = pData?.preferences?.diet_type ?? '';

        setBudgetFilter(initBudget);
        setPreferenceFilter(initPreference);

        // Fetch recommendations with initialized filters
        await fetchRecs(initBudget, initPreference, false);
      } catch {
        // Profile fetch failed — still attempt recommendations with empty filters
        await fetchRecs('', '', false);
      }
    };

    initLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── apply filters (user-triggered) ─── */
  const handleApplyFilters = () => {
    fetchRecs(budgetFilter, preferenceFilter, true);
  };

  /* ─── derived: flat list of all recommended foods ─── */
  const allFoods = useMemo<Food[]>(() => {
    if (!recommendation) return [];
    return Object.values(recommendation.meals).flat();
  }, [recommendation]);

  /* ─── filtered foods (by search) ─── */
  const filteredFoods = useMemo(() => {
    if (!searchQuery.trim()) return allFoods;
    const q = searchQuery.toLowerCase();
    return allFoods.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
    );
  }, [allFoods, searchQuery]);

  /* ─── derived stats ─── */
  const stats = useMemo(() => {
    if (!recommendation) return null;
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
  }, [recommendation, allFoods]);

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
            onClick={() => fetchRecs(budgetFilter, preferenceFilter, false)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <RefreshCw size={16} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 py-8 animate-fade-in">
      {/* ─── Page Title ─── */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Food Recommendations</h1>
        <p className="text-gray-500 mt-1">
          Personalized meals auto-generated based on your nutritional profile, goals, and budget.
        </p>
      </div>

      {/* ─── Summary Stat Cards (2×2 grid) ─── */}
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
            <p className="text-sm text-gray-500">Daily Meals ({stats.mealSlots}/4)</p>
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

      {/* ─── Search Bar + Filter Row ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="search-recommendations"
            type="text"
            placeholder="Search for meals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
          />
        </div>

        {/* Filters button area */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <select
            id="preference-filter"
            value={preferenceFilter}
            onChange={(e) => setPreferenceFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Categories</option>
            <option value="High Protein">High Protein</option>
            <option value="Vegetarian">Vegetarian</option>
            <option value="Low Carb">Low Carb</option>
            <option value="Budget Friendly">Budget Friendly</option>
            <option value="Low Sugar">Low Sugar</option>
            <option value="Gluten Free">Gluten Free</option>
          </select>

          {/* Budget input — always visible */}
          <input
            id="budget-filter"
            type="number"
            placeholder={
              profileData?.preferences?.daily_budget != null
                ? `Budget (max ${profileData.preferences.daily_budget})`
                : 'Budget (IDR)'
            }
            value={budgetFilter}
            onChange={(e) => setBudgetFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-4 py-2.5 w-44 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />

          <button
            id="filter-apply-btn"
            onClick={handleApplyFilters}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border border-primary/20 bg-primary/5 text-primary rounded-xl hover:bg-primary/10 transition-colors disabled:opacity-50"
          >
            <SlidersHorizontal size={15} />
            Filters
          </button>
        </div>
      </div>

      {/* ─── Actions Row ─── */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-400">
          Showing{' '}
          <span className="font-semibold text-gray-600">{filteredFoods.length}</span> of{' '}
          <span className="font-semibold text-gray-600">{allFoods.length}</span> results
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={handleApplyFilters}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Generating...' : 'Regenerate'}
          </button>
          <button
            id="export-recommendations"
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* ─── Food Cards Grid (2-column, matching design reference) ─── */}
      {!showNoFoodAlert && filteredFoods.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          {filteredFoods.map((food, idx) => (
            <div
              key={`${food.food_id}-${idx}`}
              id={`food-card-${food.food_id}`}
              onClick={() => navigate(`/food/${food.food_id}`)}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              style={{ transformOrigin: 'center center' }}
            >
              {/* Food Image */}
              <div className="relative w-full h-48 overflow-hidden">
                {food.image_url ? (
                  <img
                    src={food.image_url}
                    alt={food.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <Flame size={32} className="text-gray-300" />
                  </div>
                )}
              </div>

              {/* Food Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-base mb-2 group-hover:text-primary transition-colors">
                  {food.name}
                </h3>

                {/* Calories + Price Row */}
                <div className="flex items-center gap-4 mb-3">
                  <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                    <Flame size={14} className="text-orange-400" />
                    {Math.round(food.calories)} cal
                  </span>
                  <span className="text-sm font-semibold text-emerald-600">
                    Rp {food.price_estimate.toLocaleString('id-ID')}
                  </span>
                </div>

                {/* Category Badges */}
                <div className="flex flex-wrap gap-1.5">
                  {food.category.split(',').map((cat) => (
                    <span
                      key={cat.trim()}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium border ${getBadgeColor(cat)}`}
                    >
                      {cat.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !showNoFoodAlert ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center mb-8">
          <Search size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No foods match your search</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search terms or filters</p>
        </div>
      ) : null}

      {/* ─── No Food Alert Modal ─── */}
      {showNoFoodAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm mx-4 text-center animate-fade-in">
            <SearchX size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Makanan Tidak Ditemukan</h3>
            <p className="text-sm text-gray-500 mb-6">{alertMessage}</p>
            <button 
              onClick={() => setShowNoFoodAlert(false)} 
              className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              OK
            </button>
          </div>
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

      {/* ─── Motivational Banner ─── */}
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
