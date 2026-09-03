import { useState } from 'react';
import { X, QrCode, CheckCircle2, Copy, Check, Smartphone, ExternalLink } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../ui/Button';

export default function UPIPaymentModal({
  isOpen,
  onClose,
  amount,
  bookingId,
  serviceName = 'Home Service',
  upiId = 'kamensutariya01@okaxis',
  onPaymentSuccess,
}) {
  const { lang } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [paidConfirmed, setPaidConfirmed] = useState(false);

  if (!isOpen) return null;

  const isGu = lang === 'gu';
  const cleanAmount = parseFloat(amount || 0).toFixed(2);
  const note = `KaamSetu_Booking_${bookingId}`;
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=KaamSetu&am=${cleanAmount}&cu=INR&tn=${encodeURIComponent(note)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=10&data=${encodeURIComponent(upiUri)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleConfirmPaid = () => {
    setPaidConfirmed(true);
    setTimeout(() => {
      if (onPaymentSuccess) onPaymentSuccess();
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface rounded-2xl border border-line shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet to-indigo p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <QrCode size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {isGu ? 'UPI પેમેન્ટ' : 'UPI Instant Payment'}
              </h3>
              <p className="text-xs text-white/80">
                {isGu ? 'GPay, PhonePe, Paytm અથવા કોઈપણ UPI થી ચૂકવો' : 'Pay via GPay, PhonePe, Paytm, or BHIM'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          {paidConfirmed ? (
            <div className="py-8 space-y-3 animate-fade-in">
              <CheckCircle2 size={52} className="text-green mx-auto animate-bounce-short" />
              <h4 className="text-lg font-bold text-ink">
                {isGu ? 'પેમેન્ટ સફળતાપૂર્વક નોંધી લેવાયું!' : 'Payment Recorded Successfully!'}
              </h4>
              <p className="text-sm text-muted">
                {isGu ? 'તમારું ઇનવોઇસ અપડેટ થઈ ગયું છે.' : 'Your invoice has been marked as paid.'}
              </p>
            </div>
          ) : (
            <>
              {/* Amount badge */}
              <div className="inline-block bg-violet/10 border border-violet/20 px-4 py-1.5 rounded-full mb-4">
                <span className="text-xs text-muted font-medium">{isGu ? 'કુલ રકમ: ' : 'Total Amount: '}</span>
                <span className="text-lg font-bold text-violet">₹{cleanAmount}</span>
              </div>

              {/* QR Code Container */}
              <div className="bg-white p-3.5 rounded-2xl border-2 border-dashed border-violet/30 inline-block shadow-sm mb-4">
                <img
                  src={qrCodeUrl}
                  alt="UPI QR Code"
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain mx-auto"
                />
                <p className="text-[11px] text-muted mt-1.5 font-medium">
                  {isGu ? 'કોઈપણ UPI એપથી સ્કેન કરો' : 'Scan with any UPI app'}
                </p>
              </div>

              {/* UPI ID copy pill */}
              <div className="flex items-center justify-between bg-page border border-line rounded-xl px-3.5 py-2 mb-5 text-left text-xs">
                <div>
                  <span className="text-muted block text-[10px] uppercase tracking-wider font-semibold">
                    UPI ID
                  </span>
                  <span className="font-bold text-ink">{upiId}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="flex items-center gap-1 text-violet font-semibold hover:opacity-80 p-1"
                >
                  {copied ? <Check size={14} className="text-green" /> : <Copy size={14} />}
                  <span>{copied ? (isGu ? 'કોપી થયું' : 'Copied') : (isGu ? 'કોપી' : 'Copy')}</span>
                </button>
              </div>

              {/* Mobile direct UPI app link buttons */}
              <div className="space-y-2 mb-5">
                <a
                  href={upiUri}
                  className="w-full py-3 px-4 bg-violet text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 hover:opacity-90 shadow-md shadow-violet/20 transition-all"
                >
                  <Smartphone size={16} />
                  <span>{isGu ? 'મોબાઇલ UPI એપથી ચૂકવો' : 'Pay Directly in UPI App'}</span>
                  <ExternalLink size={14} className="opacity-80" />
                </a>
              </div>

              {/* Confirmation button */}
              <Button
                onClick={handleConfirmPaid}
                variant="success"
                size="md"
                className="w-full flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} />
                <span>{isGu ? 'પેમેન્ટ થઈ ગયું (Confirm Payment)' : 'I Have Completed Payment'}</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
