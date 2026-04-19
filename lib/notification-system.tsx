'use client';

import { useEffect, useRef, useState, useCallback, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabaseClient';

// ============================================================
// TYPES
// ============================================================
export interface Notification {
  id: string;
  request_id: string;
  request_number: string;
  customer_name: string;
  new_status: string;
  message: string;
  action_url: string;
  timestamp: string;
  read: boolean;
  priority: 'high' | 'medium' | 'info';
}

const STATUS_MESSAGES: Record<string, { message: string; priority: 'high' | 'medium' | 'info' }> = {
  data_incomplete:  { message: 'Data tidak lengkap — lengkapi sesuai instruksi.', priority: 'high' },
  compliance_check: { message: 'Data diterima. AI memeriksa kepatuhan regulasi…', priority: 'info' },
  under_analysis:   { message: 'Analisa risiko hukum sedang berjalan.', priority: 'info' },
  under_review:     { message: 'Analisa selesai. Menunggu review lawyer.', priority: 'info' },
  info_requested:   { message: 'Lawyer membutuhkan informasi tambahan. Segera dijawab.', priority: 'high' },
  approved:         { message: 'Akad DISETUJUI oleh lawyer. Proses dapat dilanjutkan.', priority: 'high' },
  rejected:         { message: 'Akad DITOLAK oleh lawyer. Baca catatan untuk penjelasan.', priority: 'high' },
  draft_ready:      { message: 'Draft kontrak sudah siap. Download dan koordinasikan dengan notaris.', priority: 'high' },
};

// ============================================================
// CONTEXT — satu subscriber untuk seluruh halaman
// Mencegah "cannot add callbacks after subscribe()" error
// ============================================================
interface NotifContextValue {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const NotifContext = createContext<NotifContextValue>({
  notifications: [], unreadCount: 0,
  markRead: () => {}, markAllRead: () => {},
});

// ============================================================
// PROVIDER — pasang di layout atau page level, SEKALI saja
// ============================================================
export function NotificationProvider({
  branchId,
  children,
}: {
  branchId: string | null;
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const channelRef = useRef<any>(null);

  // FIX hydration: localStorage hanya diakses setelah mount (client-only)
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !branchId) return;

    // Load dari localStorage hanya di client
    try {
      const stored = localStorage.getItem(`notif_${branchId}`);
      if (stored) {
        const parsed: Notification[] = JSON.parse(stored);
        setNotifications(parsed);
        setUnreadCount(parsed.filter(n => !n.read).length);
      }
    } catch { /* ignore parse errors */ }

    // FIX "cannot add after subscribe": buat channel sekali saja
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`notif_${branchId}_${Date.now()}`)
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
          const newStatus = updated.status;
          const oldStatus = payload.old?.status;
          if (!newStatus || oldStatus === newStatus) return;

          const statusInfo = STATUS_MESSAGES[newStatus];
          if (!statusInfo) return;

          const notif: Notification = {
            id: `${updated.id}_${newStatus}_${Date.now()}`,
            request_id: updated.id,
            request_number: updated.request_number || updated.id.slice(0, 8).toUpperCase(),
            customer_name: updated.customer_name || 'Nasabah',
            new_status: newStatus,
            message: statusInfo.message,
            action_url: `/branch/status?id=${updated.id}`,
            timestamp: new Date().toISOString(),
            read: false,
            priority: statusInfo.priority,
          };

          setNotifications(prev => {
            const next = [notif, ...prev].slice(0, 50);
            try { localStorage.setItem(`notif_${branchId}`, JSON.stringify(next)); } catch {}
            return next;
          });
          setUnreadCount(c => c + 1);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [mounted, branchId]);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, read: true } : n);
      try { if (branchId) localStorage.setItem(`notif_${branchId}`, JSON.stringify(next)); } catch {}
      return next;
    });
    setUnreadCount(c => Math.max(0, c - 1));
  }, [branchId]);

  const markAllRead = useCallback(() => {
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, read: true }));
      try { if (branchId) localStorage.setItem(`notif_${branchId}`, JSON.stringify(next)); } catch {}
      return next;
    });
    setUnreadCount(0);
  }, [branchId]);

  return (
    <NotifContext.Provider value={{ notifications, unreadCount, markRead, markAllRead }}>
      {children}
    </NotifContext.Provider>
  );
}

// ============================================================
// HOOK — pakai context, tidak buat subscriber baru
// ============================================================
export function useNotifications() {
  return useContext(NotifContext);
}

// ============================================================
// STYLES
// ============================================================
const BELL_CSS = `
.nb-wrap{position:relative;display:inline-flex}
.nb-btn{width:34px;height:34px;background:transparent;border:1px solid rgba(255,255,255,.08);border-radius:3px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;color:rgba(232,230,224,.4);position:relative}
.nb-btn:hover{border-color:rgba(255,255,255,.15);color:rgba(232,230,224,.7)}
.nb-btn.has-unread{border-color:rgba(192,160,98,.3);color:#c0a062}
.nb-badge{position:absolute;top:-5px;right:-5px;width:16px;height:16px;border-radius:50%;background:#e8705a;color:white;font-size:9px;font-weight:600;display:flex;align-items:center;justify-content:center;font-family:'DM Sans',sans-serif;pointer-events:none}
.nb-panel{position:absolute;top:calc(100% + 8px);right:0;width:340px;background:#1a1b1e;border:1px solid rgba(255,255,255,.08);border-radius:4px;z-index:500;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.4)}
.nb-head{display:flex;align-items:center;justify-content:space-between;padding:11px 15px;border-bottom:1px solid rgba(255,255,255,.06)}
.nb-head-title{font-size:12px;font-weight:500;color:rgba(232,230,224,.7);font-family:'DM Sans',sans-serif}
.nb-mark-all{font-size:10px;color:rgba(192,160,98,.6);background:none;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;transition:color .15s}
.nb-mark-all:hover{color:#c0a062}
.nb-list{max-height:360px;overflow-y:auto}
.nb-item{display:flex;gap:10px;padding:11px 15px;border-bottom:1px solid rgba(255,255,255,.04);cursor:pointer;transition:background .12s;text-decoration:none}
.nb-item:hover{background:rgba(255,255,255,.03)}
.nb-item.unread{background:rgba(192,160,98,.04)}
.nb-item:last-child{border-bottom:none}
.nb-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;margin-top:5px}
.nd-high{background:#e8705a}.nd-medium{background:#c0a062}.nd-info{background:rgba(255,255,255,.2)}
.nb-item.unread .nd-info{background:#c0a062}
.nb-body{flex:1;min-width:0}
.nb-req{font-size:10px;font-family:'DM Mono',monospace;color:rgba(192,160,98,.5);margin-bottom:2px}
.nb-customer{font-size:12px;font-weight:500;color:rgba(232,230,224,.7);margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:'DM Sans',sans-serif}
.nb-msg{font-size:11px;color:rgba(232,230,224,.4);line-height:1.4;font-family:'DM Sans',sans-serif}
.nb-time{font-size:10px;color:rgba(232,230,224,.2);margin-top:3px;font-family:'DM Sans',sans-serif}
.nb-empty{padding:32px 20px;text-align:center;font-size:13px;color:rgba(232,230,224,.2);font-family:'DM Sans',sans-serif}
.toast-wrap{position:fixed;bottom:22px;right:22px;display:flex;flex-direction:column;gap:9px;z-index:300;pointer-events:none}
.toast-item{background:#1a1b1e;border:1px solid rgba(255,255,255,.08);border-radius:4px;padding:13px 17px;display:flex;gap:11px;align-items:flex-start;max-width:340px;pointer-events:all;animation:toastIn .25s ease;box-shadow:0 8px 24px rgba(0,0,0,.4);font-family:'DM Sans',sans-serif}
.ti-high{border-left:3px solid #e8705a}.ti-medium{border-left:3px solid #c0a062}.ti-info{border-left:3px solid rgba(255,255,255,.15)}
.ti-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;margin-top:4px}
.ti-body{flex:1}
.ti-req{font-size:10px;font-family:'DM Mono',monospace;color:rgba(192,160,98,.5);margin-bottom:3px}
.ti-msg{font-size:12px;color:rgba(232,230,224,.7);line-height:1.4}
.ti-link{font-size:11px;color:#c0a062;margin-top:4px;display:inline-block;text-decoration:none}
.ti-close{background:none;border:none;cursor:pointer;color:rgba(232,230,224,.25);font-size:13px;flex-shrink:0;transition:color .15s}
.ti-close:hover{color:rgba(232,230,224,.5)}
@keyframes toastIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
`;

// ============================================================
// COMPONENT — NotificationBell (pakai context, bukan hook mandiri)
// ============================================================
export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60000) return 'Baru saja';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`;
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  // Jangan render sampai mount agar tidak ada hydration mismatch
  if (!mounted) return (
    <div style={{ width: 34, height: 34 }} />
  );

  return (
    <>
      <style>{BELL_CSS}</style>
      <div className="nb-wrap" ref={ref}>
        <button
          className={`nb-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
          onClick={() => setOpen(o => !o)}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M7.5 1.5A4.5 4.5 0 003 6v3.5L1.5 11h12L12 9.5V6A4.5 4.5 0 007.5 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            <path d="M6 11.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          {unreadCount > 0 && (
            <span className="nb-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </button>

        {open && (
          <div className="nb-panel">
            <div className="nb-head">
              <span className="nb-head-title">
                Notifikasi {unreadCount > 0 ? `(${unreadCount} baru)` : ''}
              </span>
              {unreadCount > 0 && (
                <button className="nb-mark-all" onClick={markAllRead}>Tandai semua dibaca</button>
              )}
            </div>
            <div className="nb-list">
              {notifications.length === 0
                ? <div className="nb-empty">Belum ada notifikasi</div>
                : notifications.map(n => (
                  <a
                    key={n.id}
                    href={n.action_url}
                    className={`nb-item ${!n.read ? 'unread' : ''}`}
                    onClick={() => { markRead(n.id); setOpen(false); }}
                  >
                    <div className={`nb-dot nd-${n.priority}`} />
                    <div className="nb-body">
                      <div className="nb-req">{n.request_number}</div>
                      <div className="nb-customer">{n.customer_name}</div>
                      <div className="nb-msg">{n.message}</div>
                      <div className="nb-time">{formatTime(n.timestamp)}</div>
                    </div>
                  </a>
                ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================
// COMPONENT — StatusToastContainer (pakai context yang sama)
// ============================================================
interface ToastItem {
  id: string;
  message: string;
  priority: 'high' | 'medium' | 'info';
  request_number: string;
  action_url: string;
}

export function StatusToastContainer() {
  const { notifications } = useNotifications();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const prevLen = useRef(0);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (notifications.length > prevLen.current) {
      const newOnes = notifications.slice(0, notifications.length - prevLen.current);
      newOnes.forEach(n => {
        if (!n.read) {
          const t: ToastItem = {
            id: n.id, message: n.message, priority: n.priority,
            request_number: n.request_number, action_url: n.action_url,
          };
          setToasts(prev => [t, ...prev].slice(0, 3));
          setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 8000);
        }
      });
    }
    prevLen.current = notifications.length;
  }, [notifications, mounted]);

  if (!mounted || toasts.length === 0) return null;

  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast-item ti-${t.priority}`}>
          <div className={`ti-dot nd-${t.priority}`} style={{
            background: t.priority === 'high' ? '#e8705a' : t.priority === 'medium' ? '#c0a062' : 'rgba(255,255,255,.3)'
          }} />
          <div className="ti-body">
            <div className="ti-req">{t.request_number}</div>
            <div className="ti-msg">{t.message}</div>
            <a href={t.action_url} className="ti-link">Lihat detail →</a>
          </div>
          <button className="ti-close" onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}>✕</button>
        </div>
      ))}
    </div>
  );
}
