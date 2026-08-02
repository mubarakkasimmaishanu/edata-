import React, { useState, useEffect } from 'react';
import { ChevronLeft, Bell, Info, RefreshCw, CheckCheck, Trash2, Calendar } from 'lucide-react';
import { AppNotification } from '../types';
import { api, resolveImageUrl } from '../services/api';
import { useToast } from './Toast';
import BottomSheet from './BottomSheet';
import { useTheme } from '../context/ThemeContext';

interface NotificationsProps {
  notifications?: AppNotification[];
  onBack: () => void;
  onRefreshUnreadCount?: (count: number) => void;
}

export default function Notifications({ notifications: propNotifications = [], onBack, onRefreshUnreadCount }: NotificationsProps) {
  const toast = useToast();
  const { theme } = useTheme();
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedNotif, setSelectedNotif] = useState<any | null>(null);

  // System fallback if server has no broadcast yet
  const defaultNotifications = [
    {
      id: 'admin_sys_1',
      title: 'eData Mobile System Active',
      message: 'Welcome to eData Mobile! All instant VTU airtime, data bundles, electricity bill tokens, and exam result pins are operational 24/7.',
      image: null,
      type: 'info',
      date: 'Just now',
      read: false
    }
  ];

  const fetchBackendNotifications = async () => {
    setRefreshing(true);
    try {
      const res = await api.getNotifications();

      const notifArray = res?.data?.notifications || res?.notifications || (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
      const backendUnreadCount = res?.data?.unread_count ?? notifArray.filter((n: any) => !n.is_read && !n.read).length;

      let formatted: any[] = [];
      if (notifArray.length > 0) {
        formatted = notifArray.map((item: any, idx: number) => ({
          id: item.id || `notif_${idx}`,
          title: item.title || item.subject || item.header || 'Admin Announcement',
          message: item.message || item.content || item.body || item.text || '',
          image: resolveImageUrl(item.image),
          type: item.type || (item.title?.toLowerCase().includes('success') ? 'success' : 'info'),
          date: item.created_at || item.date || item.timestamp || 'Recent',
          read: Boolean(item.is_read || item.read)
        }));
      } else if (propNotifications && propNotifications.length > 0) {
        formatted = propNotifications.map((n, i) => ({
          id: n.id || `prop_${i}`,
          title: n.title,
          message: n.message,
          image: null,
          type: n.type || 'info',
          date: n.timestamp || 'Recent',
          read: false
        }));
      } else {
        formatted = [];
      }

      setNotificationsList(formatted);
      if (onRefreshUnreadCount) onRefreshUnreadCount(backendUnreadCount || formatted.filter(n => !n.read).length);
    } catch (err: any) {
      console.warn('Backend notification fetch note:', err.message);
      if (propNotifications && propNotifications.length > 0) {
        setNotificationsList(propNotifications);
      } else {
        setNotificationsList(defaultNotifications);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBackendNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markNotificationRead('all');
    } catch {}
    setNotificationsList(prev => prev.map(n => ({ ...n, read: true })));
    if (onRefreshUnreadCount) onRefreshUnreadCount(0);
    toast.success('All notifications marked as read.');
  };

  const handleClearAll = async () => {
    try {
      await api.deleteNotification('all');
    } catch {}
    setNotificationsList([]);
    if (onRefreshUnreadCount) onRefreshUnreadCount(0);
    toast.success('All notifications cleared.');
  };

  const handleDeleteSingle = async (e: React.MouseEvent, id: any) => {
    e.stopPropagation();
    try {
      await api.deleteNotification(id);
    } catch {}
    const updated = notificationsList.filter(n => n.id !== id);
    setNotificationsList(updated);
    const unread = updated.filter(n => !n.read).length;
    if (onRefreshUnreadCount) onRefreshUnreadCount(unread);
    toast.success('Notification removed.');
  };

  const handleOpenNotification = async (notif: any) => {
    setSelectedNotif(notif);
    if (!notif.read) {
      try {
        await api.markNotificationRead(notif.id);
      } catch {}
      setNotificationsList(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
      const unread = notificationsList.filter(n => n.id !== notif.id && !n.read).length;
      if (onRefreshUnreadCount) onRefreshUnreadCount(unread);
    }
  };

  const unreadCount = notificationsList.filter(n => !n.read).length;

  return (
    <div className={`min-h-screen flex flex-col max-w-lg mx-auto w-full pb-28 font-display transition-colors ${
      theme === 'light' ? 'bg-[#f4f7fb] text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* ── Top Header Bar ── */}
      <header className={`sticky top-0 z-40 backdrop-blur-2xl border-b px-4 py-3.5 flex items-center justify-between shadow-md transition-colors ${
        theme === 'light' ? 'bg-white/90 border-slate-200/80 shadow-slate-200/50' : 'bg-slate-950/90 border-slate-900'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className={`p-1.5 rounded-2xl transition-all active:scale-95 cursor-pointer ${
              theme === 'light' ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div>
            <h1 className={`text-base font-black font-display ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Notifications</h1>
            <p className={`text-[11px] font-medium ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Tap any notification to view details</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer font-display"
              title="Mark All as Read"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Read All
            </button>
          )}

          {notificationsList.length > 0 && (
            <button
              onClick={handleClearAll}
              className="p-2 text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 rounded-xl transition-all cursor-pointer"
              title="Clear All Notifications"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={fetchBackendNotifications}
            disabled={refreshing}
            className={`p-2 rounded-xl transition-all cursor-pointer border ${
              theme === 'light' ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50' : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
            }`}
            title="Refresh Notifications"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-sky-500' : ''}`} />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 space-y-3.5">
        {loading ? (
          <div className={`p-8 border rounded-3xl text-center space-y-2 ${
            theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900/60 border-slate-800'
          }`}>
            <RefreshCw className="w-6 h-6 text-sky-500 animate-spin mx-auto" />
            <p className={`text-xs font-bold font-display ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>Syncing notifications from backend...</p>
          </div>
        ) : notificationsList.length === 0 ? (
          <div className={`p-8 border rounded-3xl text-center shadow-xl space-y-2 ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <Bell className={`w-10 h-10 mx-auto ${theme === 'light' ? 'text-slate-400' : 'text-slate-600'}`} />
            <h3 className={`text-sm font-black font-display ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>No Notifications</h3>
            <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>You're all caught up! No active notifications found.</p>
          </div>
        ) : (
          notificationsList.map((n) => {
            const isUnread = !n.read;

            return (
              <div
                key={n.id}
                onClick={() => handleOpenNotification(n)}
                className={`p-4 rounded-3xl border transition-all cursor-pointer shadow-lg relative group ${
                  theme === 'light'
                    ? (isUnread ? 'bg-sky-50/90 border-sky-300 shadow-sky-100/50 hover:border-sky-400' : 'bg-white border-slate-200/90 hover:border-slate-300')
                    : (isUnread ? 'bg-slate-900/95 border-sky-500/40 shadow-sky-950/30 hover:border-sky-400' : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700')
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {n.image ? (
                    <div className={`w-12 h-12 rounded-2xl overflow-hidden shrink-0 border p-0.5 ${
                      theme === 'light' ? 'border-slate-300 bg-slate-100' : 'border-slate-800 bg-slate-950'
                    }`}>
                      <img src={n.image} alt={n.title} className="w-full h-full object-cover rounded-xl" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30">
                      <Info className="w-5 h-5" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-xs font-black font-display truncate transition-colors ${
                        theme === 'light' ? 'text-slate-900 group-hover:text-sky-600' : 'text-white group-hover:text-sky-300'
                      }`}>
                        {n.title}
                      </h4>
                      <div className="flex items-center gap-2 shrink-0">
                        {isUnread && (
                          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" title="Unread" />
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSingle(e, n.id)}
                          className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete notification"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed font-medium line-clamp-2 ${
                      theme === 'light' ? 'text-slate-700' : 'text-slate-300'
                    }`}>
                      {n.message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-[10px] font-mono font-semibold ${
                        theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                      }`}>{n.date}</span>
                      <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold group-hover:underline">Tap to read &rarr;</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* ── Full Notification Detail Reader Bottom Sheet ── */}
      <BottomSheet
        open={Boolean(selectedNotif)}
        onClose={() => setSelectedNotif(null)}
        title="Notification Details"
      >
        {selectedNotif && (
          <div className="space-y-4 py-2">
            {/* Optional Image Banner */}
            {selectedNotif.image && (
              <div className={`w-full h-48 rounded-2xl overflow-hidden border shadow-md ${
                theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <img
                  src={selectedNotif.image}
                  alt={selectedNotif.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Title & Metadata */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 font-display">
                  Admin Broadcast
                </span>
                <span className={`text-[10.5px] font-mono flex items-center gap-1 ${
                  theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  <Calendar className="w-3 h-3" /> {selectedNotif.date}
                </span>
              </div>
              <h3 className={`text-base font-black font-display pt-1 ${
                theme === 'light' ? 'text-slate-900' : 'text-white'
              }`}>
                {selectedNotif.title}
              </h3>
            </div>

            {/* Notification Body Message Card */}
            <div className={`p-4 border rounded-2xl space-y-2 shadow-sm ${
              theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <p className={`text-xs leading-relaxed font-medium whitespace-pre-wrap ${
                theme === 'light' ? 'text-slate-800' : 'text-slate-200'
              }`}>
                {selectedNotif.message}
              </p>
            </div>

            {/* Actions: Close Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedNotif(null)}
                className="w-full py-3.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-black rounded-2xl text-xs transition-all shadow-lg active:scale-95 uppercase tracking-wider font-display cursor-pointer"
              >
                Close Notification
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
