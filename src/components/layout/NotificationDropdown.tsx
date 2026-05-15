import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check } from 'lucide-react';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../api/notification.api';
import type { Notification } from '../../types/notification.types';

/* ─── notification type → emoji icon ─── */
const typeIcon: Record<string, string> = {
  login: '👋',
  profile: '✅',
  history: '🍽️',
  recommendation: '🥗',
  password: '🔐',
  reminder: '🍲',
  motivation: '💧',
};

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
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* ─── Fetch unread count (polling every 30s) ─── */
  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await fetchUnreadCount();
      setUnreadCount(res.data.count);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  /* ─── Load full notifications when dropdown opens ─── */
  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await fetchNotifications();
      setNotifications(res.data);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) loadNotifications();
  };

  /* ─── Close on outside click ─── */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  /* ─── Mark single as read ─── */
  const handleMarkRead = async (notifId: string) => {
    try {
      await markNotificationAsRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.notif_id === notifId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silently fail
    }
  };

  /* ─── Mark all as read ─── */
  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* ─── Bell Button ─── */}
      <button
        id="btn-notification-bell"
        onClick={handleToggle}
        className="relative p-2 text-primary-foreground/70 hover:text-white transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-gold text-primary text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-primary">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ─── Dropdown Panel ─── */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
            <span className="text-sm text-gray-400">
              {unreadCount} unread
            </span>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell size={32} className="mx-auto text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.notif_id}
                  onClick={() => !notif.is_read && handleMarkRead(notif.notif_id)}
                  className={`flex items-start gap-3 px-5 py-4 border-b border-gray-50 transition-colors cursor-pointer hover:bg-gray-50/80 ${
                    !notif.is_read ? 'bg-blue-50/30' : ''
                  }`}
                >
                  {/* Icon */}
                  <span className="text-2xl flex-shrink-0 mt-0.5">
                    {typeIcon[notif.type] || '🔔'}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!notif.is_read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {timeAgo(notif.created_date)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!notif.is_read && (
                    <span className="flex-shrink-0 w-2.5 h-2.5 bg-gold rounded-full mt-2"></span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                View All
              </button>
              <button
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check size={14} /> Mark All as Read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
