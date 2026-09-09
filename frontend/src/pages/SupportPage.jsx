import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { supportAPI } from '../api/client';
import LoadingState, { EmptyState } from '../components/LoadingState';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { Headphones, MessageSquare, Ticket, Search, HelpCircle } from 'lucide-react';

const CATEGORIES = [
  'booking', 'provider', 'payment', 'cancellation', 'refund',
  'ai', 'tracking', 'safety', 'technical', 'account', 'partner', 'other',
];

const POPULAR = [
  'How do I track my service provider?',
  'How does AI diagnosis work?',
  'What is the Fair Price feature?',
  'How to cancel a booking?',
];

export default function SupportPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [faqQuery, setFaqQuery] = useState('');
  const [faqResults, setFaqResults] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [ticketForm, setTicketForm] = useState({ category: 'other', subject: '', description: '' });
  const [showTicket, setShowTicket] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);

  useEffect(() => {
    if (user) {
      setLoadingTickets(true);
      supportAPI.tickets().then(({ data }) => {
        setTickets(data.results || data);
      }).finally(() => setLoadingTickets(false));
    }
  }, [user]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const msg = input;
    setMessages([...messages, { role: 'user', text: msg }]);
    setInput('');
    try {
      const { data } = await supportAPI.chat({ message: msg });
      setMessages((m) => [...m, {
        role: 'ai',
        text: data.reply,
        demo: data.demo_mode_label,
        escalated: data.escalated,
      }]);
    } catch {
      setMessages((m) => [...m, { role: 'ai', text: 'Sorry, support is temporarily unavailable.', demo: t('demoSupport') }]);
    }
  };

  const searchFaq = async () => {
    if (!faqQuery.trim()) return;
    const { data } = await supportAPI.faq(faqQuery);
    setFaqResults(data.results || data);
  };

  const createTicket = async (e) => {
    e.preventDefault();
    await supportAPI.createTicket(ticketForm);
    setShowTicket(false);
    setTicketForm({ category: 'other', subject: '', description: '' });
    if (user) {
      const { data } = await supportAPI.tickets();
      setTickets(data.results || data);
    }
    alert('Ticket created successfully!');
  };

  const talkHuman = async () => {
    if (!user) {
      alert('Please login to create a support ticket.');
      return;
    }
    setShowTicket(true);
    setTicketForm({ category: 'other', subject: 'Talk to Human Support', description: 'Customer requested human support agent.' });
  };

  return (
    <PageContainer variant="wide" className="py-8 animate-fade-in">
      <PageHeader title="Support" subtitle="Search FAQ, chat with AI support, or create a ticket for human help" />

      {/* FAQ search */}
      <div className="mb-6 bg-surface rounded-2xl border border-line p-4 shadow-sm">
        <div className="flex gap-2">
          <input value={faqQuery} onChange={(e) => setFaqQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchFaq()}
            placeholder="Search FAQ..." className="flex-1 px-4 py-2.5 rounded-xl border border-line bg-page focus:outline-none focus:ring-2 focus:ring-brand/25" />
          <Button onClick={searchFaq} variant="violet"><Search size={16} /> Search</Button>
        </div>
        {faqResults.length > 0 && (
          <div className="mt-3 space-y-2">
            {faqResults.map((f, i) => (
              <div key={i} className="p-3 bg-page rounded-xl text-sm border border-line">
                <p className="font-medium text-ink">{f.question}</p>
                <p className="text-muted mt-1">{f.answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Popular questions */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-ink mb-3">Popular Questions</h2>
        <div className="flex flex-wrap gap-2">
          {POPULAR.map((q) => (
            <button key={q} type="button" onClick={() => { setFaqQuery(q); searchFaq(); }}
              className="px-3 py-1.5 text-sm bg-surface border border-line rounded-full text-muted hover:border-brand/30 hover:text-brand transition-colors">
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 min-w-0">
        {/* AI Support workspace */}
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-line overflow-hidden min-w-0 shadow-sm">
          <div className="px-4 py-3 pastel-blue border-b border-line flex items-center gap-2">
            <Headphones size={18} className="text-brand" />
            <span className="font-medium text-ink">AI Support</span>
            <span className="text-xs bg-brand/10 text-brand px-2 py-0.5 rounded-full ml-auto">{t('demoSupport')}</span>
          </div>
          <div className="h-80 overflow-y-auto p-4 space-y-3 bg-page/50">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <HelpCircle size={40} className="mx-auto text-muted/40 mb-3" />
                <p className="text-muted text-sm">Ask a question or create a ticket for human support</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                  m.role === 'user' ? 'bg-brand text-white' : 'bg-surface border border-line text-ink shadow-sm'
                }`}>
                  {m.text}
                  {m.demo && <p className="text-xs text-cyan mt-1">{m.demo}</p>}
                  {m.escalated && <p className="text-xs text-danger mt-1">Escalated to human support queue</p>}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-line flex gap-2 bg-surface">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your question..." className="flex-1 px-4 py-2.5 rounded-xl border border-line bg-page focus:outline-none focus:ring-2 focus:ring-brand/25" />
            <Button onClick={sendMessage} variant="violet"><MessageSquare size={18} /></Button>
          </div>
        </div>

        {/* Actions sidebar */}
        <div className="space-y-4 min-w-0">
          <Button onClick={() => setShowTicket(!showTicket)} variant="primary" className="w-full justify-center" size="lg">
            <Ticket size={18} /> {t('createTicket')}
          </Button>
          <Button onClick={talkHuman} variant="secondary" className="w-full justify-center" size="lg">
            {t('talkHuman')}
          </Button>
          {showTicket && (
            <form onSubmit={createTicket} className="bg-surface rounded-2xl border border-line p-4 space-y-3 shadow-sm animate-scale-in">
              <select value={ticketForm.category} onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-line bg-page">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input placeholder="Subject" value={ticketForm.subject} onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-line bg-page" required />
              <textarea placeholder="Description" value={ticketForm.description} onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                rows={3} className="w-full px-3 py-2 rounded-xl border border-line bg-page" required />
              <Button type="submit" variant="violet" className="w-full">Submit Ticket</Button>
            </form>
          )}

          {user && (
            <div className="bg-surface rounded-2xl border border-line p-4 shadow-sm">
              <h3 className="font-semibold text-ink mb-3">My Tickets</h3>
              {loadingTickets ? <LoadingState /> : tickets.length === 0 ? (
                <EmptyState message="No tickets yet" />
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {tickets.map((tk) => (
                    <div key={tk.id} className="p-2.5 bg-page rounded-xl text-sm border border-line">
                      <p className="font-medium text-ink">{tk.subject}</p>
                      <p className="text-muted text-xs">{tk.status} · {tk.category}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
