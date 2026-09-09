import { Printer, X, CheckCircle2, Shield } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../ui/Button';

export default function InvoicePrintModal({ isOpen, onClose, booking, invoice }) {
  const { lang } = useLanguage();
  if (!isOpen || !booking || !invoice) return null;

  const isGu = lang === 'gu';
  const handlePrint = () => {
    window.print();
  };

  const bookingId = booking.id;
  const invoiceDate = invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : new Date().toLocaleDateString();
  const customerName = `${booking.customer_detail?.first_name || ''} ${booking.customer_detail?.last_name || ''}`.trim() || 'Valued Customer';
  const providerName = booking.provider_detail?.user?.first_name
    ? `${booking.provider_detail.user.first_name} ${booking.provider_detail.user.last_name || ''}`.trim()
    : booking.partner_detail?.organization_name || 'KaamSetu Technician';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-surface rounded-2xl border border-line shadow-2xl max-w-2xl w-full overflow-hidden my-6">
        {/* Top actions toolbar (hidden during print) */}
        <div className="bg-page border-b border-line p-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-ink">
              {isGu ? 'સર્વિસ ઇન્વોઇસ' : 'Official Service Invoice'}
            </span>
            <span className="text-xs text-muted">#{bookingId}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} variant="primary" size="sm" className="flex items-center gap-1.5 shadow-sm">
              <Printer size={15} />
              <span>{isGu ? 'પ્રિન્ટ / PDF ડાઉનલોડ' : 'Print / Save PDF'}</span>
            </Button>
            <button
              onClick={onClose}
              className="text-muted hover:text-ink p-1.5 rounded-lg hover:bg-surface"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Document */}
        <div id="printable-invoice" className="p-6 sm:p-8 bg-white text-slate-800 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-9 h-9 rounded-xl bg-brand text-white font-bold text-lg flex items-center justify-center">
                  K
                </div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">KaamSetu</h1>
              </div>
              <p className="text-xs text-slate-500">Home Maintenance Platform</p>
              <p className="text-xs text-slate-500">support@kaamsetu.in • www.kaamsetu.in</p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200 mb-2">
                ✓ PAID & VERIFIED
              </span>
              <p className="text-xs font-bold text-slate-800">INVOICE #{bookingId}</p>
              <p className="text-xs text-slate-500">Date: {invoiceDate}</p>
            </div>
          </div>

          {/* Billed To / Service By */}
          <div className="grid grid-cols-2 gap-6 text-xs">
            <div className="space-y-1">
              <span className="font-semibold text-slate-400 uppercase tracking-wider block">Customer Details</span>
              <p className="font-bold text-slate-900 text-sm">{customerName}</p>
              <p className="text-slate-600">{booking.address || 'Address provided at booking'}</p>
              <p className="text-slate-600">Pincode: {booking.pin_code || '—'}</p>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-slate-400 uppercase tracking-wider block">Service Professional</span>
              <p className="font-bold text-slate-900 text-sm flex items-center gap-1">
                {providerName}
                <Shield size={13} className="text-cyan fill-cyan/20" />
              </p>
              <p className="text-slate-600">Category: {booking.category_detail?.name || 'General Maintenance'}</p>
              <p className="text-slate-600">Status: OTP Verified Completion</p>
            </div>
          </div>

          {/* Itemized charges table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 px-4">Visiting & Inspection Charge</td>
                  <td className="py-2.5 px-4 text-right">₹{invoice.visit_charge || 0}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4">Service & Labor Charge</td>
                  <td className="py-2.5 px-4 text-right">₹{invoice.labor_charge || 0}</td>
                </tr>
                {invoice.material_charge > 0 && (
                  <tr>
                    <td className="py-2.5 px-4">Spare Parts & Materials</td>
                    <td className="py-2.5 px-4 text-right">₹{invoice.material_charge}</td>
                  </tr>
                )}
                <tr className="bg-slate-50/70 font-bold text-slate-900 text-sm">
                  <td className="py-3 px-4">Total Amount</td>
                  <td className="py-3 px-4 text-right text-brand">₹{invoice.total_amount || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer note */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-600" />
              <span>Job completed with secure customer OTP verification.</span>
            </div>
            <span>KaamSetu — Thank you!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
