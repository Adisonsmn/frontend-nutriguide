import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard,
  BookOpen,
  History,
  FileText,
  User,
  Bell,
  LogOut
} from 'lucide-react';

export const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    logout();
    navigate('/');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
      isActive
        ? 'bg-white/10 text-white'
        : 'text-primary-foreground/70 hover:bg-white/5 hover:text-white'
    }`;

  // Helper to get initial
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <nav className="bg-primary text-primary-foreground px-6 py-3 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Logo & Links */}
        <div className="flex items-center gap-8">
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-primary font-bold text-lg leading-none">N</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">Nutri Guide</span>
          </Link>

          {/* Nav Links - Desktop Only */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-1">
              <NavLink to="/dashboard" className={navLinkClass}>
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/recommendations" className={navLinkClass}>
                <BookOpen size={18} />
                <span>Recommendations</span>
              </NavLink>
              <NavLink to="/history" className={navLinkClass}>
                <History size={18} />
                <span>History</span>
              </NavLink>
              <NavLink to="/articles" className={navLinkClass}>
                <FileText size={18} />
                <span>Articles</span>
              </NavLink>
              <NavLink to="/profile" className={navLinkClass}>
                <User size={18} />
                <span>Profile</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Right: Notification & Avatar / Auth */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              {/* Notification Bell */}
              <button className="relative p-2 text-primary-foreground/70 hover:text-white transition-colors">
                <Bell size={20} />
                {/* Red dot badge */}
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-primary"></span>
              </button>

              {/* User Avatar & Logout */}
              <div className="flex items-center gap-3 border-l border-white/10 pl-4 ml-2">
                <div className="w-9 h-9 rounded-full bg-gold flex items-center justify-center shadow-sm">
                  <span className="text-primary font-bold">{userInitial}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-primary-foreground/70 hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex gap-3">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-white hover:bg-white/10 rounded-full transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-medium bg-gold text-primary rounded-full hover:bg-yellow-400 transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
