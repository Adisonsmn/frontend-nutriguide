import { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../api/notification.api';
import type { Notification } from '../types/notification.types';
import { usePageTitle } from '../hooks/usePageTitle';

/* ─── Notification type → emoji + label ─── */
const TYPE_META: Record<string, { icon: string; label: string; color: string }> = {
  login:          { icon: '👋', label: 'Login',          color: 'bg-blue-50 text-blue-600 border-blue-100' },
  profile:        { icon: '✅', label: 'Profile',        color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  history:        { icon: '🍽️', label: 'History',        color: 'bg-orange-50 text-orange-600 border-orange-100' },
  recommendation: { icon: '🥗', label: 'Recommendation', color: 'bg-green-50 text-green-600 border-green-100' },
  password:       { icon: '🔐', label: 'Security',       color: 'bg-red-50 text-red-600 border-red-100' },
  reminder:       { icon: '🍲', label: 'Reminder',       color: 'bg-amber-50 text-amber-600 border-amber-100' },
  motivation:     { icon: '💪', label: 'Motivation',     color: 'bg-purple-50 text-purple-600 border-purple-100' },
};

const getTypeMeta = (type: string) =>
  TYPE_META[type] ?? { icon: '🔔', label: type, color: 'bg-gray-50 text-gray-600 border-gray-100' };

/* ─── relative time helper ─── */
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ─── Loading skeleton ─── */
const NotificationSkeleton = () => (
  <div className="animate-pulse space-y-0">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-start gap-4 px-6 py-5 border-b border-gray-50">
        <div className="w-10 h-10 bg-gray-100 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-100 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/4" />
        </div>
      </div>
    ))}
  </div>
);

export const Notifications = () => {
  usePageTitle('Notifications');

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchNotifications();
      setNotifications(res.data);
    } catch {
      toast.error('Failed to load notifications.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  /* ─── Mark single as read ─── */
  const handleMarkRead = async (notifId: string) => {
    try {
      await markNotificationAsRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.notif_id === notifId ? { ...n, is_read: true } : n))
      );
    } catch {
      // silently fail
    }
  };

  /* ─── Mark all as read ─── */
  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setIsMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark notifications as read.');
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      {/* ─── Page Header ─── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {isLoading
              ? 'Loading...'
              : unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        <button
          id="mark-all-read-btn"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0 || isMarkingAll}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border border-primary/20 bg-primary/5 text-primary rounded-xl hover:bg-primary/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CheckCheck size={16} />
          {isMarkingAll ? 'Marking...' : 'Mark all as read'}
        </button>
      </div>

      {/* ─── Content ─── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <NotificationSkeleton />
        ) : notifications.length === 0 ? (
          /* ─── Empty state ─── */
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <Bell size={28} className="text-gray-300" />
            </div>
            <p className="text-gray-600 font-semibold text-lg">No notifications yet</p>
            <p className="text-gray-400 text-sm mt-1">
              We'll notify you about meals, goals, and updates here.
            </p>
          </div>
        ) : (
          /* ─── Notification list ─── */
          <div>
            {notifications.map((notif, idx) => {
              const meta = getTypeMeta(notif.type);
              return (
                <div
                  key={notif.notif_id}
                  id={`notif-${notif.notif_id}`}
                  onClick={() => !notif.is_read && handleMarkRead(notif.notif_id)}
                  className={[
                    'flex items-start gap-4 px-6 py-5 transition-colors cursor-pointer',
                    idx !== notifications.length - 1 ? 'border-b border-gray-50' : '',
                    !notif.is_read
                      ? 'bg-primary/5 border-l-4 border-l-primary hover:bg-primary/10'
                      : 'bg-white hover:bg-gray-50/70',
                  ].join(' ')}
                >
                  {/* Icon bubble */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xl leading-none">
                    {meta.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      {/* Type badge */}
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${meta.color}`}
                      >
                        {meta.label}
                      </span>
                      {/* Time */}
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {timeAgo(notif.created_date)}
                      </span>
                    </div>
                    <p
                      className={`text-sm leading-relaxed ${
                        !notif.is_read ? 'font-medium text-gray-900' : 'text-gray-600'
                      }`}
                    >
                      {notif.message}
                    </p>
                  </div>

                  {/* Unread indicator dot */}
                  {!notif.is_read && (
                    <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-primary mt-1" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
