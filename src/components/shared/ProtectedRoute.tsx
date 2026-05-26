import { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { fetchProfileData } from '../../api/profile.api';

const SESSION_KEY = 'profileChecked';

export const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore();
  const token = localStorage.getItem('accessToken'); // Fallback check
  const location = useLocation();

  const [isCheckingProfile, setIsCheckingProfile] = useState<boolean>(false);
  const [profileExists, setProfileExists] = useState<boolean | null>(null);

  const isProfileRoute = location.pathname === '/profile';

  useEffect(() => {
    // Skip profile check if not authenticated
    if (!isAuthenticated && !token) return;
    // Skip if we're already on /profile (prevent redirect loop)
    if (isProfileRoute) {
      setProfileExists(true);
      return;
    }
    // Skip if already checked this session
    const already = sessionStorage.getItem(SESSION_KEY);
    if (already === 'true') {
      setProfileExists(true);
      return;
    }
    if (already === 'false') {
      setProfileExists(false);
      return;
    }

    // Run the profile check
    let cancelled = false;
    const checkProfile = async () => {
      setIsCheckingProfile(true);
      try {
        const res = await fetchProfileData();
        const exists = res.data.profile !== null;
        if (!cancelled) {
          sessionStorage.setItem(SESSION_KEY, String(exists));
          setProfileExists(exists);
          if (!exists) {
            toast('Please complete your profile first', {
              icon: '👤',
              duration: 4000,
            });
          }
        }
      } catch {
        // On error, allow navigation (backend may be unavailable)
        if (!cancelled) {
          sessionStorage.setItem(SESSION_KEY, 'true');
          setProfileExists(true);
        }
      } finally {
        if (!cancelled) setIsCheckingProfile(false);
      }
    };

    checkProfile();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, token, isProfileRoute]);

  // Not authenticated → redirect to login
  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace />;
  }

  // On /profile route — always allow through
  if (isProfileRoute) {
    return <Outlet />;
  }

  // Still checking — show spinner (prevents flash of content)
  if (isCheckingProfile || profileExists === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Profile missing → redirect to /profile
  if (!profileExists) {
    return <Navigate to="/profile" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
};
