import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingState from '../../components/LoadingState';
import StatusBadge from '../../components/StatusBadge';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Input';
import { useLanguage } from '../../context/LanguageContext';
import { supportAPI } from '../../api/client';
import cn from '../../utils/cn';

export default function SupportDeskPage() {
  const { t } = useLanguage();
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supportAPI.tickets().then(({ data }) => {
      setTickets(data.results || data);
      setLoading(false);
    });
  }, []);

  const assign = async (id) => {
    await supportAPI.updateTicket(id, { status: 'assigned' });
    loadTickets();
  };

  const resolve = async (id) => {
    await supportAPI.updateTicket(id, { status: 'resolved' });
    loadTickets();
  };

  const loadTickets = () => supportAPI.tickets().then(({ data }) => setTickets(data.results || data));

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    await supportAPI.message(selected.id, { message: reply });
    setReply('');
    const { data } = await supportAPI.ticket(selected.id);
    setSelected(data);
  };

  return (
    <DashboardLayout role="SUPPORT_AGENT">
      <PageHeader
        title={t('supportDesk')}
        subtitle="Professional service center — manage tickets and customer conversations"
        badge={<span className="text-xs bg-indigo/15 text-ink px-2.5 py-1 rounded-full font-medium">{t('demoSupport')}</span>}
      />

      {loading ? <LoadingState variant="dashboard" /> : (
        <div className="grid lg:grid-cols-5 gap-6 min-w-0">
          <div className="lg:col-span-2 space-y-2 max-h-[75vh] overflow-y-auto min-w-0">
            <CardHeader title="Ticket Queue" subtitle={`${tickets.length} tickets`} className="mb-2 px-1" />
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => setSelected(ticket)}
                className={cn(
                  'w-full text-left rounded-xl border p-4 min-w-0 transition-colors',
                  selected?.id === ticket.id ? 'border-indigo bg-indigo/5 shadow-sm' : 'border-line bg-surface hover:bg-page',
                )}
              >
                <div className="flex justify-between gap-2 min-w-0 mb-1">
                  <p className="font-semibold text-ink truncate">{ticket.ticket_number}</p>
                  <StatusBadge status={ticket.status} label={ticket.status} />
                </div>
                <p className="text-sm text-muted truncate">{ticket.subject}</p>
                <div className="flex gap-2 mt-2 text-xs text-muted">
                  <span className="capitalize">{ticket.category}</span>
                  {ticket.priority && <span>· {ticket.priority}</span>}
                </div>
                {ticket.is_demo && <span className="text-xs text-brand mt-1 inline-block">{t('demoData')}</span>}
              </button>
            ))}
          </div>

          <div className="lg:col-span-3 min-w-0">
            {selected ? (
              <Card>
                <CardHeader
                  title={selected.subject}
                  subtitle={selected.description}
                  action={<StatusBadge status={selected.status} label={selected.status} />}
                />
                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                  {selected.messages?.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        'text-sm p-3 rounded-xl',
                        m.is_internal ? 'bg-indigo/10 border border-line' : 'bg-page border border-line/50',
                      )}
                    >
                      {m.is_internal && <span className="text-xs font-medium text-muted block mb-1">Internal note</span>}
                      {m.message}
                    </div>
                  ))}
                </div>
                <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2} placeholder="Reply to customer" className="mb-3" />
                <div className="flex flex-wrap gap-2">
                  <Button onClick={sendReply} variant="primary" size="sm">Send Reply</Button>
                  <Button onClick={() => assign(selected.id)} variant="secondary" size="sm">Assign</Button>
                  <Button onClick={() => resolve(selected.id)} variant="success" size="sm">Resolve</Button>
                </div>
              </Card>
            ) : (
              <Card className="flex items-center justify-center min-h-[300px]">
                <p className="text-muted text-sm">Select a ticket to view conversation</p>
              </Card>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
