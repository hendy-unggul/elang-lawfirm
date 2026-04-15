'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

// ============================================================
// TYPES
// ============================================================
export interface Notification {
  id: string;
  request_id: string;
  request_number: string;
  customer_name: string;
  old_status: string;
  new_status: string;
  message: string;
  action_url: string;
  timestamp: string;
  read: boolean;
  priority: 'high' | 'medium' | 'info';
}

// ============================================================
// STATUS MESSAGES — apa yang ditampilkan ke cabang
// ============================================================
const STATUS_MESSAGES: Record<string, { message: string; priority: 'high' | 'medium' | 'info' }> = {
  data_incomplete: {
    message: 'Data tidak lengkap. AI menemukan inkonsistensi — silakan lengkapi sesuai instruksi.',
    priority: 'high',
  },
  data_intelligence: {
    message: 'AI sedang menganalisa korelasi data…',
    priority: 'info',
  },
  compliance_check: {
    message: 'Data diterima. AI memeriksa kepatuhan regulasi OJK & DSN-MUI…',
    priority: 'info',
  },
  under_analysis: {
    message: 'Analisa risiko hukum sedang berjalan. Estimasi selesai dalam 1–2 menit.',
    priority: 'info',
  },
  under_review: {
    message: 'Analisa selesai. Permintaan dalam antrian review lawyer.',
    priority: 'info',
  },
  info_requested: {
    message: 'Lawyer membutuhkan informasi tambahan. Mohon segera dijawab.',
    priority: 'high',
  },
  approved: {
    message: 'Permintaan DISETUJUI oleh lawyer. Proses dapat dilanjutkan.',
    priority: 'high',
  },
  rejected: {
    message: 'Permintaan DITOLAK oleh lawyer. Baca catatan untuk penjelasan.',
    priority: 'high',
  },
  draft_ready: {
    message: 'Draft kontrak sudah siap. Silakan download dan koordinasikan dengan notaris.',
    priority: 'high',
  },
};

// ============================================================
// HOOK — useNotifications
// Subscribe ke perubahan status request milik cabang
// ============================================================
export function useNotifications(branchId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevStatuses = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!branchId) return;

    // Load existing notifications dari localStorage
    const stored = localStorage.getItem(`notif_${branchId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
        setUnreadCount(parsed.filter((n: Notification) => !n.read).length);
      } catch {}
    }

    // Subscribe ke realtime changes
    const channel = supabase
      .channel(`branch_${branchId}_notifications`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contract_requests',
          filter: `branch_id=eq.${branchId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          const oldStatus = prevStatuses.current[updated.id] || payload.old?.status;
          const newStatus = updated.status;

          if (oldStatus === newStatus) return;
          prevStatuses.current[updated.id] = newStatus;

          const statusInfo = STATUS_MESSAGES[newStatus];
          if (!statusInfo) return;

          const notif: Notification = {
            id: `${updated.id}_${newStatus}_${Date.now()}`,
            request_id: updated.id,
            request_number: updated.request_number || updated.id.slice(0, 8).toUpperCase(),
            customer_name: updated.customer_name,
            old_status: oldStatus,
            new_status: newStatus,
            message: statusInfo.message,
            action_url: `/branch/status?id=${updated.id}`,
            timestamp: new Date().toISOString(),
            read: false,
            priority: statusInfo.priority,
          };

          setNotifications(prev => {
            const updated = [notif, ...prev].slice(0, 50); // max 50 notifikasi
            localStorage.setItem(`notif_${branchId}`, JSON.stringify(updated));
            return updated;
          });
          setUnreadCount(c => c + 1);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [branchId]);

  const markRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      if (branchId) localStorage.setItem(`notif_${branchId}`, JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(c => Math.max(0, c - 1));
  };

  const markAllRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      if (branchId) localStorage.setItem(`notif_${branchId}`, JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(0);
  };

  return { notifications, unreadCount, markRead, markAllRead };
}

// ============================================================
// COMPONENT — NotificationBell
// Tombol lonceng dengan badge unread count
// ============================================================
const BELL_STYLES = `
.notif-wrap { position: relative; }
.notif-bell {
  width: 34px; height: 34px;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 3px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all .15s;
  color: rgba(232,230,224,0.4);
  position: relative;
}
.notif-bell:hover { border-color: rgba(255,255,255,0.15); color: rgba(232,230,224,0.7); }
.notif-bell.has-unread { border-color: rgba(192,160,98,0.3); color: #c0a062; }
.notif-badge {
  position: absolute; top: -5px; right: -5px;
  width: 16px; height: 16px; border-radius: 50%;
  background: #e8705a; color: white;
  font-size: 9px; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  font-family: 'DM Sans', sans-serif;
}
.notif-panel {
  position: absolute; top: calc(100% + 8px); right: 0;
  width: 340px;
  background: #1a1b1e;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 4px;
  z-index: 500;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}
.notif-panel-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.notif-panel-title { font-size: 12px; font-weight: 500; color: rgba(232,230,224,0.7); font-family: 'DM Sans', sans-serif; }
.notif-mark-all { font-size: 10px; color: rgba(192,160,98,0.6); background: none; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: color .15s; }
.notif-mark-all:hover { color: #c0a062; }
.notif-list { max-height: 360px; overflow-y: auto; }
.notif-item {
  display: flex; gap: 10px; padding: 12px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  cursor: pointer; transition: background .12s;
  text-decoration: none;
}
.notif-item:hover { background: rgba(255,255,255,0.03); }
.notif-item.unread { background: rgba(192,160,98,0.04); }
.notif-item:last-child { border-bottom: none; }
.notif-indicator {
  width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 5px;
}
.ni-high { background: #e8705a; }
.ni-medium { background: #c0a062; }
.ni-info { background: rgba(255,255,255,0.2); }
.notif-item.unread .ni-info { background: #c0a062; }
.notif-body { flex: 1; min-width: 0; }
.notif-req { font-size: 10px; font-family: 'DM Mono', monospace; color: rgba(192,160,98,0.5); margin-bottom: 2px; }
.notif-customer { font-size: 12px; font-weight: 500; color: rgba(232,230,224,0.7); margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: 'DM Sans', sans-serif; }
.notif-message { font-size: 11px; color: rgba(232,230,224,0.4); line-height: 1.4; font-family: 'DM Sans', sans-serif; }
.notif-time { font-size: 10px; color: rgba(232,230,224,0.2); margin-top: 3px; font-family: 'DM Sans', sans-serif; }
.notif-empty { padding: 32px 20px; text-align: center; font-size: 13px; color: rgba(232,230,224,0.2); font-family: 'DM Sans', sans-serif; }
`;

interface NotificationBellProps {
  branchId: string | null;
}

export function NotificationBell({ branchId }: NotificationBellProps) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(branchId);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Baru saja';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <>
      <style>{BELL_STYLES}</style>
      <div className="notif-wrap" ref={ref}>
        <button
          className={`notif-bell ${unreadCount > 0 ? 'has-unread' : ''}`}
          onClick={() => setOpen(o => !o)}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M7.5 1.5A4.5 4.5 0 003 6v3.5L1.5 11h12L12 9.5V6A4.5 4.5 0 007.5 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            <path d="M6 11.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          {unreadCount > 0 && (
            <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </button>

        {open && (
          <div className="notif-panel">
            <div className="notif-panel-head">
              <span className="notif-panel-title">
                Notifikasi {unreadCount > 0 ? `(${unreadCount} baru)` : ''}
              </span>
              {unreadCount > 0 && (
                <button className="notif-mark-all" onClick={markAllRead}>Tandai semua dibaca</button>
              )}
            </div>
            <div className="notif-list">
              {notifications.length === 0 ? (
                <div className="notif-empty">Belum ada notifikasi</div>
              ) : (
                notifications.map(n => (
                  <a
                    key={n.id}
                    href={n.action_url}
                    className={`notif-item ${!n.read ? 'unread' : ''}`}
                    onClick={() => { markRead(n.id); setOpen(false); }}
                  >
                    <div className={`notif-indicator ni-${n.priority}`} />
                    <div className="notif-body">
                      <div className="notif-req">{n.request_number}</div>
                      <div className="notif-customer">{n.customer_name}</div>
                      <div className="notif-message">{n.message}</div>
                      <div className="notif-time">{formatTime(n.timestamp)}</div>
                    </div>
                  </a>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================
// COMPONENT — StatusToast
// Pop-up notifikasi saat status berubah (untuk halaman status)
// ============================================================
const TOAST_STYLES = `
.status-toast-wrap {
  position: fixed; bottom: 28px; right: 28px;
  display: flex; flex-direction: column; gap: 10px;
  z-index: 300; pointer-events: none;
}
.status-toast {
  background: #1a1b1e;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 4px;
  padding: 14px 18px;
  display: flex; gap: 12px; align-items: flex-start;
  max-width: 340px;
  pointer-events: all;
  animation: toastIn .25s ease;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  font-family: 'DM Sans', sans-serif;
}
.st-high { border-left: 3px solid #e8705a; }
.st-medium { border-left: 3px solid #c0a062; }
.st-info { border-left: 3px solid rgba(255,255,255,0.15); }
.toast-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
.td-high { background: #e8705a; } .td-medium { background: #c0a062; } .td-info { background: rgba(255,255,255,0.3); }
.toast-body { flex: 1; }
.toast-req { font-size: 10px; font-family: 'DM Mono', monospace; color: rgba(192,160,98,0.5); margin-bottom: 3px; }
.toast-message { font-size: 13px; color: rgba(232,230,224,0.7); line-height: 1.4; }
.toast-action { font-size: 11px; color: #c0a062; margin-top: 4px; display: inline-block; text-decoration: none; }
.toast-close { background: none; border: none; cursor: pointer; color: rgba(232,230,224,0.25); font-size: 14px; padding: 0; flex-shrink: 0; transition: color .15s; }
.toast-close:hover { color: rgba(232,230,224,0.5); }
@keyframes toastIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
`;

interface ToastItem {
  id: string;
  message: string;
  priority: 'high' | 'medium' | 'info';
  request_number: string;
  action_url: string;
}

export function StatusToastContainer({ branchId }: { branchId: string | null }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const { notifications } = useNotifications(branchId);
  const lastCount = useRef(0);

  useEffect(() => {
    if (notifications.length > lastCount.current) {
      const newNotifs = notifications.slice(0, notifications.length - lastCount.current);
      newNotifs.forEach(n => {
        if (!n.read) {
          const toast: ToastItem = {
            id: n.id,
            message: n.message,
            priority: n.priority,
            request_number: n.request_number,
            action_url: n.action_url,
          };
          setToasts(prev => [toast, ...prev].slice(0, 3));
          setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== toast.id));
          }, 8000);
        }
      });
    }
    lastCount.current = notifications.length;
  }, [notifications]);

  const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  if (!toasts.length) return null;

  return (
    <>
      <style>{TOAST_STYLES}</style>
      <div className="status-toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`status-toast st-${t.priority}`}>
            <div className={`toast-dot td-${t.priority}`} />
            <div className="toast-body">
              <div className="toast-req">{t.request_number}</div>
              <div className="toast-message">{t.message}</div>
              <a href={t.action_url} className="toast-action">Lihat detail →</a>
            </div>
            <button className="toast-close" onClick={() => dismiss(t.id)}>✕</button>
          </div>
        ))}
      </div>
    </>
  );
}
