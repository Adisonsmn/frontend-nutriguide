import { useState, useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Calendar,
  Flame,
  Star,
  TrendingUp,
  Download,
  Settings,
  Trash2,
} from 'lucide-react';
import { fetchHistory, deleteHistoryEntry } from '../api/history.api';
import type { FoodHistory } from '../types/history.types';
import { usePageTitle } from '../hooks/usePageTitle';

/* ─── meal-time badge helpers ─── */
const getMealType = (dateStr: string): string => {
  const hour = new Date(dateStr).getHours();
  if (hour < 10) return 'Breakfast';
  if (hour < 14) return 'Lunch';
  if (hour < 18) return 'Snack';
  return 'Dinner';
};

const mealBadgeColor: Record<string, string> = {
  Breakfast: 'bg-amber-100 text-amber-700',
  Lunch: 'bg-emerald-100 text-emerald-700',
  Snack: 'bg-pink-100 text-pink-700',
  Dinner: 'bg-indigo-100 text-indigo-700',
};

/* ─── group history by date ─── */
interface DayGroup {
  dateKey: string;        // e.g. "2026-04-15"
  displayDate: string;    // e.g. "Wed, Apr 15"
  entries: FoodHistory[];
  totalCalories: number;
}

const groupByDate = (items: FoodHistory[]): DayGroup[] => {
  const map = new Map<string, FoodHistory[]>();

  for (const item of items) {
    const d = new Date(item.consumed_at);
    const key = d.toISOString().split('T')[0]; // "YYYY-MM-DD"
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }

  // Sort keys descending (newest first)
  const sorted = [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  return sorted.map(([dateKey, entries]) => {
    const d = new Date(dateKey + 'T00:00:00');
    const displayDate = d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    const totalCalories = entries.reduce((sum, e) => {
      if (!e.is_consumed) return sum;
      const ratio = e.qty_gram / 100;
      return sum + (e.food?.calories ?? 0) * ratio;
    }, 0);

    return { dateKey, displayDate, entries, totalCalories: Math.round(totalCalories) };
  });
};

/* ─── compute "day streak" ─── */
const computeDayStreak = (groups: DayGroup[]): number => {
  if (groups.length === 0) return 0;

  // groups already sorted newest-first
  let streak = 1;
  for (let i = 0; i < groups.length - 1; i++) {
    const curr = new Date(groups[i].dateKey + 'T00:00:00');
    const prev = new Date(groups[i + 1].dateKey + 'T00:00:00');
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
};

export const History = () => {
  usePageTitle('History');
  const [history, setHistory] = useState<FoodHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /* ─── load data ─── */
  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetchHistory();
      setHistory(res.data);
    } catch {
      console.error('Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  /* ─── derived data ─── */
  const dayGroups = useMemo(() => groupByDate(history), [history]);

  const stats = useMemo(() => {
    const totalMeals = history.length;
    const totalCal = history.reduce((sum, e) => {
      if (!e.is_consumed) return sum;
      const ratio = e.qty_gram / 100;
      return sum + (e.food?.calories ?? 0) * ratio;
    }, 0);
    const avgCalories = totalMeals > 0 ? Math.round(totalCal / totalMeals) : 0;
    const dayStreak = computeDayStreak(dayGroups);

    // Top category
    const catCount: Record<string, number> = {};
    history.forEach((e) => {
      if (e.food?.category) {
        e.food.category.split(',').forEach((c) => {
          const t = c.trim();
          catCount[t] = (catCount[t] || 0) + 1;
        });
      }
    });
    const topCategory =
      Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return { totalMeals, avgCalories, dayStreak, topCategory };
  }, [history, dayGroups]);

  /* ─── delete handler ─── */
  // Bug #16: Track in-flight deletes with a ref to prevent double-click
  const deletingIds = useRef(new Set<string>());

  const handleDelete = async (historyId: string) => {
    if (deletingIds.current.has(historyId)) return;
    deletingIds.current.add(historyId);
    setDeletingId(historyId);
    try {
      await deleteHistoryEntry(historyId);
      toast.success('Entry deleted');
      setHistory((prev) => prev.filter((e) => e.history_id !== historyId));
    } catch {
      toast.error('Failed to delete entry');
    } finally {
      deletingIds.current.delete(historyId);
      setDeletingId(null);
    }
  };

  /* ─── export CSV ─── */
  const handleExport = () => {
    if (history.length === 0) return;
    let csv = 'Date,Food Name,Meal Type,Quantity (g),Calories,Protein (g),Carbs (g),Fat (g)\n';
    for (const e of history) {
      const date = new Date(e.consumed_at).toLocaleDateString();
      const meal = getMealType(e.consumed_at);
      const ratio = e.qty_gram / 100;
      csv += `${date},${e.food?.name ?? ''},${meal},${e.qty_gram},${Math.round((e.food?.calories ?? 0) * ratio)},${Math.round((e.food?.protein_g ?? 0) * ratio)},${Math.round((e.food?.carbs_g ?? 0) * ratio)},${Math.round((e.food?.fat_g ?? 0) * ratio)}\n`;
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `food-history-${new Date().toISOString().split('T')[0]}.csv`;
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

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-8 animate-fade-in">
      {/* ─── Page Title ─── */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Food History</h1>
        <p className="text-gray-500 mt-1">Track your nutrition journey and view past meals</p>
      </div>

      {/* ─── Summary Stat Cards (2×2 grid — matching design) ─── */}
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

        {/* Day Streak */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
          <Star size={20} className="text-gold" />
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.dayStreak}</p>
          <p className="text-sm text-gray-500">Day Streak</p>
        </div>

        {/* Top Category */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary text-white">
            {stats.topCategory}
          </span>
          <p className="text-sm text-gray-500 mt-3">Top Category</p>
        </div>
      </div>

      {/* ─── Export Button ─── */}
      <div className="flex justify-end mb-6">
        <button
          id="export-history"
          onClick={handleExport}
          disabled={history.length === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-full text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
        >
          <Download size={16} />
          Export History
        </button>
      </div>

      {/* ─── Empty State ─── */}
      {dayGroups.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No food history yet</h3>
          <p className="text-sm text-gray-400">
            Start logging your meals to track your nutrition journey.
          </p>
        </div>
      )}

      {/* ─── Daily Cards ─── */}
      <div className="flex flex-col gap-6 mb-8">
        {dayGroups.map((group) => (
          <div
            key={group.dateKey}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Card Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar size={18} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{group.displayDate}</h3>
                  <p className="text-sm text-gray-400">
                    {group.entries.length}{' '}
                    {group.entries.length === 1 ? 'meal' : 'meals'} •{' '}
                    {group.totalCalories} calories
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span className="font-medium text-primary/70">
                  {group.entries.length}{' '}
                  {group.entries.length === 1 ? 'meal' : 'meals'}
                </span>
                <Settings size={18} className="text-gray-300" />
              </div>
            </div>

            {/* Food Items */}
            <div className="divide-y divide-gray-50">
              {group.entries.map((entry) => {
                const ratio = entry.qty_gram / 100;
                const calories = Math.round((entry.food?.calories ?? 0) * ratio);
                const mealType = getMealType(entry.consumed_at);

                return (
                  <div
                    key={entry.history_id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-800">
                          {entry.food?.name ?? 'Unknown Food'}
                        </p>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                            mealBadgeColor[mealType] || 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {mealType}
                        </span>
                        {entry.is_consumed && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                            Consumed
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-0.5">{calories} calories</p>
                    </div>
                    {/* Delete button — visible on hover */}
                    <button
                      onClick={() => handleDelete(entry.history_id)}
                      disabled={deletingId === entry.history_id}
                      className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 transition-all disabled:opacity-50"
                      title="Delete entry"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Card Footer — Daily Total */}
            <div className="flex items-center justify-between px-6 py-3 bg-gray-50/50 border-t border-gray-100">
              <span className="text-sm font-semibold text-gray-600">Daily Total</span>
              <span className="text-sm font-bold text-primary">
                {group.totalCalories} calories
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Motivational Banner ─── */}
      {stats.dayStreak > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-2xl px-6 py-5">
          <p className="font-semibold text-amber-800">
            Keep up the great work! 🎉
          </p>
          <p className="text-sm text-amber-600 mt-1">
            You've maintained a {stats.dayStreak}-day streak of tracking your meals. Consistent
            tracking helps you achieve your health goals faster.
          </p>
        </div>
      )}
    </div>
  );
};
