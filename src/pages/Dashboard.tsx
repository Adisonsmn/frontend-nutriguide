import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  fetchNutritionTarget,
  fetchDailySummary,
  fetchFoods,
  fetchArticles,
} from '../api/dashboard.api';
import type { NutritionTarget, DailySummary } from '../api/dashboard.api';
import type { Food } from '../types/food.types';
import type { Article } from '../types/article.types';
import { NutritionRing } from '../components/dashboard/NutritionRing';
import { MacroBar } from '../components/dashboard/MacroBar';
import { FoodCard } from '../components/dashboard/FoodCard';
import { ArticleCard } from '../components/dashboard/ArticleCard';
import { usePageTitle } from '../hooks/usePageTitle';

export const Dashboard = () => {
  usePageTitle('Dashboard');
  const [nutritionTarget, setNutritionTarget] = useState<NutritionTarget | null>(null);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [foods, setFoods] = useState<Food[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [nutritionRes, summaryRes, foodsRes, articlesRes] = await Promise.allSettled([
          fetchNutritionTarget(),
          fetchDailySummary(),
          fetchFoods(activeFilter || undefined),
          fetchArticles(),
        ]);

        if (nutritionRes.status === 'fulfilled') setNutritionTarget(nutritionRes.value.data);
        if (summaryRes.status === 'fulfilled') setDailySummary(summaryRes.value.data);
        if (foodsRes.status === 'fulfilled') setFoods(foodsRes.value.data);
        if (articlesRes.status === 'fulfilled') setArticles(articlesRes.value.data);
      } catch (error) {
        console.error('Error loading dashboard data', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [activeFilter]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* 1. Greeting Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Good {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}! ✨
        </h1>
        <p className="text-gray-500 mt-1">Let's keep up your healthy eating journey</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Main Stats) */}
        <div className="lg:col-span-2">
          {/* 2. Today's Nutrition Goals (4 Rings) */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Today's Nutrition Goals</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <NutritionRing
                label="Calories"
                unit="kcal"
                color="#1e3a5f"
                current={dailySummary?.totalCalories ?? 0}
                target={nutritionTarget?.dailyCalorieTarget ?? 2000}
              />
              <NutritionRing
                label="Protein"
                unit="g"
                color="#22c55e"
                current={dailySummary?.macros.protein ?? 0}
                target={nutritionTarget?.macros.protein ?? 120}
              />
              <NutritionRing
                label="Carbs"
                unit="g"
                color="#4f46e5"
                current={dailySummary?.macros.carbs ?? 0}
                target={nutritionTarget?.macros.carbs ?? 250}
              />
              <NutritionRing
                label="Fat"
                unit="g"
                color="#f97316"
                current={dailySummary?.macros.fat ?? 0}
                target={nutritionTarget?.macros.fat ?? 70}
              />
            </div>
          </div>

          {/* 3. Detailed Macro Breakdown (3 Bars) */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Detailed Macro Breakdown</h2>
            <MacroBar
              label="Protein"
              color="#22c55e"
              current={dailySummary?.macros.protein ?? 0}
              target={nutritionTarget?.macros.protein ?? 120}
            />
            <MacroBar
              label="Carbs"
              color="#4f46e5"
              current={dailySummary?.macros.carbs ?? 0}
              target={nutritionTarget?.macros.carbs ?? 250}
            />
            <MacroBar
              label="Fat"
              color="#f97316"
              current={dailySummary?.macros.fat ?? 0}
              target={nutritionTarget?.macros.fat ?? 70}
            />
          </div>

          {/* 4. CTA Banner */}
          <div className="bg-primary rounded-2xl p-8 mb-8 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📈</span>
              <h2 className="text-xl font-bold text-white">Get Personalized Recommendations</h2>
            </div>
            <p className="text-primary-foreground/80 mb-5">
              Discover meals tailored to your goals, budget, and dietary preferences
            </p>
            <Link
              to="/recommendations"
              className="inline-flex items-center gap-2 bg-white text-primary px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-gray-100 transition-colors shadow-sm"
            >
              View Recommendations &rarr;
            </Link>
          </div>
        </div>

        {/* Right Column (Side content) */}
        <div className="lg:col-span-1">
          {/* 5. Quick Filters + Featured Foods */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Featured for You</h2>
              <Link to="/recommendations" className="text-primary text-sm font-semibold hover:underline">
                View All &rarr;
              </Link>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              {['Budget Friendly', 'Vegetarian', 'Low Sugar', 'High Protein', 'Gluten Free', 'Low Carb'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(activeFilter === filter ? '' : filter)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    activeFilter === filter
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Food Cards List */}
            <div className="flex flex-col gap-4">
              {foods.length > 0 ? (
                foods.slice(0, 3).map((food) => <FoodCard key={food.food_id} food={food} />)
              ) : (
                <p className="text-sm text-gray-500 italic">No foods found.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 6. Latest Health Tips (Articles) */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Latest Health Tips</h2>
          <Link to="/articles" className="text-primary text-sm font-semibold hover:underline">
            View All &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.length > 0 ? (
            articles.slice(0, 3).map((article) => <ArticleCard key={article.article_id} article={article} />)
          ) : (
            <p className="text-sm text-gray-500 italic col-span-3">No articles found.</p>
          )}
        </div>
      </div>
    </div>
  );
};
