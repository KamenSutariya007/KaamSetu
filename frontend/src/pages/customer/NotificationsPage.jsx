import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingState, { EmptyState } from '../../components/LoadingState';
import { useLanguage } from '../../context/LanguageContext';
import { notificationsAPI } from '../../api/client';

export default function NotificationsPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationsAPI.list().then(({ data }) => {
      setItems(data.results || data);
      setLoading(false);
    });
  }, []);

  const markAll = async () => {
    await notificationsAPI.markAllRead();
    setItems(items.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <DashboardLayout role="CUSTOMER">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-midnight">{t('notifications')}</h1>
        <button onClick={markAll} className="text-sm text-aqua">Mark all read</button>
      </div>
      {loading ? <LoadingState /> : items.length === 0 ? <EmptyState /> : (
        <div className="space-y-3">
          {items.map((n) => (
            <div key={n.id} className={`rounded-xl border p-4 ${n.is_read ? 'bg-surface border-line' : 'bg-indigo/10 border-indigo'}`}>
              <p className="font-medium text-midnight">{n.title}</p>
              <p className="text-sm text-muted">{n.message}</p>
              {n.is_demo && <span className="text-xs text-aqua">{t('demoData')}</span>}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
