import { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Pencil,
  LogOut,
  User as UserIcon,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import {
  fetchProfileData,
  createProfile,
  updateProfile,
  upsertPreferences,
} from '../api/profile.api';
import type {
  ProfileResponse,
  CreateProfilePayload,
  UpdateProfilePayload,
  UpsertPreferencesPayload,
} from '../api/profile.api';
import { usePageTitle } from '../hooks/usePageTitle';

/* ─── constants ─── */
const GOALS = ['Lose Weight', 'Maintain Weight', 'Build Muscle', 'Improve Health', 'Increase Energy'];
const GENDERS = ['Male', 'Female'];
const DIET_TYPES = ['High Protein', 'Vegetarian', 'Low Carb', 'Budget Friendly', 'Low Sugar', 'Gluten Free'];

export const Profile = () => {
  usePageTitle('Profile');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /* ─── form state ─── */
  const [age, setAge] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [gender, setGender] = useState('');
  const [goal, setGoal] = useState('');
  const [dietType, setDietType] = useState('');
  const [dailyBudget, setDailyBudget] = useState('');

  /* ─── load profile ─── */
  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const res = await fetchProfileData();
      setProfileData(res.data);

      // Pre-fill form
      if (res.data.profile) {
        setAge(String(res.data.profile.age));
        setWeightKg(String(res.data.profile.weight_kg));
        setHeightCm(String(res.data.profile.height_cm));
        setGender(res.data.profile.gender);
        setGoal(res.data.profile.goal);
      }
      if (res.data.preferences) {
        setDietType(res.data.preferences.diet_type);
        setDailyBudget(String(res.data.preferences.daily_budget));
      }
    } catch {
      // profile might not exist yet — that's OK
      setProfileData({ profile: null, preferences: null });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  /* ─── helpers ─── */
  const profileExists = !!profileData?.profile;
  const showForm = !profileExists || isEditing;

  const handleLogout = async () => {
    // Call the logout API so the server clears the HTTP-only cookie
    try {
      await api.post('/auth/logout');
    } catch {
      // Proceed with client-side cleanup even if server logout fails
    }
    // Bug #30: Clear profileChecked so a different user triggers the guard
    sessionStorage.removeItem('profileChecked');
    localStorage.removeItem('auth-storage');
    sessionStorage.removeItem('auth-storage');
    localStorage.removeItem('rememberMe');
    logout();
    navigate('/');
  };

  /* ─── save profile ─── */
  const handleSave = async () => {
    // ── Client-side validation ──
    const ageNum = Number(age);
    const weightNum = Number(weightKg);
    const heightNum = Number(heightCm);

    if (!age || ageNum <= 0) {
      toast.error('Please enter a valid age (greater than 0).');
      return;
    }
    if (!weightKg || weightNum <= 0) {
      toast.error('Please enter a valid weight (greater than 0).');
      return;
    }
    if (!heightCm || heightNum <= 0) {
      toast.error('Please enter a valid height (greater than 0).');
      return;
    }
    if (!gender) {
      toast.error('Please select your gender.');
      return;
    }
    if (!goal) {
      toast.error('Please select a health goal.');
      return;
    }

    setIsSaving(true);
    try {
      if (profileExists) {
        // ── Update existing profile ──
        const updateData: UpdateProfilePayload = {
          age: ageNum,
          weight_kg: weightNum,
          height_cm: heightNum,
          gender,
          goal,
        };
        await updateProfile(updateData);
      } else {
        // ── Create new profile ──
        const createData: CreateProfilePayload = {
          age: ageNum,
          weight_kg: weightNum,
          height_cm: heightNum,
          gender,
          goal,
        };
        await createProfile(createData);
        // Clear profile-checked flag so ProtectedRoute re-validates next navigation
        sessionStorage.removeItem('profileChecked');
      }

      // ── Save preferences only if both fields are provided ──
      if (dietType && dailyBudget && Number(dailyBudget) > 0) {
        const prefData: UpsertPreferencesPayload = {
          diet_type: dietType,
          daily_budget: Number(dailyBudget),
          currency: 'IDR',
        };
        await upsertPreferences(prefData);
      }

      toast.success('Profile saved successfully! ✅');
      setIsEditing(false);
      await loadProfile();

      // ── Redirect back if user came from a redirect ──
      const from = (location.state as { from?: string } | null)?.from;
      if (!profileExists && from && from !== '/profile') {
        navigate(from, { replace: true });
      } else if (!profileExists) {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  /* ─── format date ─── */
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  /* ─── Loading ─── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════
   *  FORM VIEW — Complete Profile / Edit Profile
   * ══════════════════════════════════════════════════════════════════ */
  if (showForm) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {/* Title */}
          <h1 className="text-3xl font-bold text-primary text-center">
            {profileExists ? 'Edit Profile' : 'Complete Your Profile'}
          </h1>
          <p className="text-gray-500 text-center mt-2 mb-8">
            Help us personalize your nutrition recommendations
          </p>

          {/* Age / Weight / Height — 3 columns */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label htmlFor="profile-age" className="block text-sm font-medium text-gray-700 mb-1">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                id="profile-age"
                type="number"
                placeholder="28"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="profile-weight" className="block text-sm font-medium text-gray-700 mb-1">
                Weight (kg) <span className="text-red-500">*</span>
              </label>
              <input
                id="profile-weight"
                type="number"
                placeholder="72"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="profile-height" className="block text-sm font-medium text-gray-700 mb-1">
                Height (cm) <span className="text-red-500">*</span>
              </label>
              <input
                id="profile-height"
                type="number"
                placeholder="175"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
              />
            </div>
          </div>

          {/* Gender */}
          <div className="mb-6">
            <label htmlFor="profile-gender" className="block text-sm font-medium text-gray-700 mb-1">
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              id="profile-gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
            >
              <option value="">Select gender</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Health Goals */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Health Goals <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGoal(g)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    goal === g
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary/40'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* ── Dietary Preference (bonus, maps to preferences table) ── */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Diet Type <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {DIET_TYPES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDietType(dietType === d ? '' : d)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    dietType === d
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary/40'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Daily Budget */}
          <div className="mb-8">
            <label htmlFor="profile-budget" className="block text-sm font-medium text-gray-700 mb-1">
              Daily Budget (IDR) <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <input
              id="profile-budget"
              type="number"
              placeholder="50000"
              value={dailyBudget}
              onChange={(e) => setDailyBudget(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            {profileExists && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : profileExists ? 'Save Changes' : 'Save & Continue'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════
   *  DISPLAY VIEW — My Profile (matches profile-page.png)
   * ══════════════════════════════════════════════════════════════════ */
  const profile = profileData!.profile!;
  const preferences = profileData?.preferences;
  const displayName = profile.user?.name || user?.name || 'User';
  const displayEmail = profile.user?.email || user?.email || '';
  const memberSince = user?.created_at ? formatDate(user.created_at) : '';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      {/* ─── Breadcrumb ─── */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
        <Link to="/dashboard" className="hover:text-gray-600 transition-colors">Home</Link>
        <ChevronRight size={14} />
        <span className="text-primary font-medium">Profile</span>
      </div>

      {/* ─── Page Header ─── */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <button
          id="edit-profile-btn"
          onClick={() => setIsEditing(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
        >
          <Pencil size={16} />
          Edit Profile
        </button>
      </div>

      {/* ─── Card: Account Overview ─── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-bold text-primary mb-5">Account Overview</h2>

        {/* Avatar + Name */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gold flex items-center justify-center shadow-sm">
            <UserIcon size={28} className="text-primary" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-lg">{displayName}</p>
            <p className="text-gray-400 text-sm">@{displayName.split(' ')[0]?.toLowerCase()}</p>
          </div>
        </div>

        <hr className="border-gray-100 mb-4" />

        {/* Info rows */}
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-400">Email Address</p>
            <p className="font-medium text-gray-900">{displayEmail}</p>
          </div>
          {memberSince && (
            <div>
              <p className="text-sm text-gray-400">Member Since</p>
              <p className="font-medium text-gray-900">{memberSince}</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Card: Health & Personal Data ─── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-bold text-primary mb-4">Health &amp; Personal Data</h2>

        {/* Info banner */}
        <div className="bg-blue-50/60 border border-blue-100 rounded-xl px-4 py-3 mb-6">
          <p className="text-sm text-blue-700">
            These parameters calculate your daily nutritional targets and filter recommendations.
          </p>
        </div>

        <div className="space-y-4">
          {/* Age */}
          <div>
            <p className="text-sm text-gray-400">Age</p>
            <p className="font-medium text-gray-900">{profile.age} years</p>
          </div>

          {/* Gender */}
          <div>
            <p className="text-sm text-gray-400">Gender</p>
            <p className="font-medium text-gray-900">{profile.gender}</p>
          </div>

          {/* Weight + Height — 2 columns */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-sm text-gray-400">Weight (kg)</p>
              <p className="font-medium text-gray-900">{profile.weight_kg} kg</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Height (cm)</p>
              <p className="font-medium text-gray-900">{profile.height_cm} cm</p>
            </div>
          </div>

          {/* Goal */}
          <div>
            <p className="text-sm text-gray-400">Active Health Goals</p>
            <span className="inline-block mt-1 px-4 py-1.5 rounded-full text-sm font-semibold bg-primary text-white">
              {profile.goal}
            </span>
          </div>

          {/* Preferences */}
          {preferences && (
            <>
              <div>
                <p className="text-sm text-gray-400">Diet Type</p>
                <p className="font-medium text-gray-900">{preferences.diet_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Daily Budget</p>
                <p className="font-medium text-gray-900">
                  {preferences.currency} {preferences.daily_budget.toLocaleString()}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── Bottom Actions ─── */}
      <hr className="border-gray-100 mb-6" />
      <div className="flex items-center justify-between">
        <button
          id="delete-account-btn"
          className="text-sm font-semibold text-red-500 hover:text-red-600 transition-colors"
        >
          Delete Account
        </button>
        <button
          id="logout-btn"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-red-200 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} />
          Log Out
        </button>
      </div>
    </div>
  );
};
