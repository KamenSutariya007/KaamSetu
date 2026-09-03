import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingState, { ErrorState } from '../../components/LoadingState';
import StatusBadge from '../../components/StatusBadge';
import TrackingMap from '../../components/TrackingMap';
import BookingTimeline from '../../components/booking/BookingTimeline';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { useLanguage } from '../../context/LanguageContext';
import { bookingsAPI, trackingAPI } from '../../api/client';
import { ArrowLeft, MapPin, Calendar, User, IndianRupee, QrCode, Printer } from 'lucide-react';
import UPIPaymentModal from '../../components/payment/UPIPaymentModal';
import InvoicePrintModal from '../../components/invoice/InvoicePrintModal';

export default function BookingDetail({ trackMode = false }) {
  const { id } = useParams();
  const { t } = useLanguage();
  const [booking, setBooking] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [otp, setOtp] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewDone, setReviewDone] = useState(false);
  const [slots, setSlots] = useState([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [holdInfo, setHoldInfo] = useState(null);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    bookingsAPI.detail(id)
      .then(({ data }) => {
        setBooking(data);
        if (['on_the_way', 'arrived', 'started', 'completed'].includes(data.status) || trackMode) {
          trackingAPI.status(id).then(({ data: tr }) => setTracking(tr)).catch(() => {});
        }
        if (data.status === 'completed') {
          bookingsAPI.invoice(id).then(({ data: inv }) => setInvoice(inv)).catch(() => {});
        }
        if (data.status === 'requested' && (data.provider || data.partner)) {
          setSlotLoading(true);
          bookingsAPI.availableSlots(id).then(({ data: s }) => setSlots(s.slots || []))
            .catch(() => {}).finally(() => setSlotLoading(false));
        }
      })
      .catch(() => setError('Booking not found'))
      .finally(() => setLoading(false));
  }, [id, trackMode]);

  const handleHoldSlot = async (slot) => {
    try {
      const { data } = await bookingsAPI.holdSlot(id, { start_datetime: slot.start, end_datetime: slot.end });
      setHoldInfo(data);
      const { data: updated } = await bookingsAPI.detail(id);
      setBooking(updated);
    } catch (err) {
      alert(err.response?.data?.detail || 'Slot not available');
    }
  };

  const handleComplete = async () => {
    try {
      const { data } = await bookingsAPI.action(id, 'complete', { otp });
      setBooking(data);
      const inv = await bookingsAPI.invoice(id);
      setInvoice(inv.data);
    } catch (err) {
      alert(err.response?.data?.detail || err.response?.data?.demo_otp || 'OTP required');
    }
  };

  const handleCancel = async () => {
    if (confirm('Cancel this booking?')) {
      const { data } = await bookingsAPI.action(id, 'cancel', { reason: 'Customer cancelled' });
      setBooking(data);
    }
  };

  const submitReview = async () => {
    await bookingsAPI.review(id, { rating, comment: reviewComment });
    setReviewDone(true);
  };

  if (loading) return <DashboardLayout role="CUSTOMER"><LoadingState variant="dashboard" /></DashboardLayout>;
  if (error) return <DashboardLayout role="CUSTOMER"><ErrorState message={error} /></DashboardLayout>;

  const showMap = trackMode || tracking;
  const providerName = booking.provider_detail?.user?.first_name || booking.partner_detail?.organization_name || 'Pending';

  return (
    <DashboardLayout role="CUSTOMER">
      <Link to="/customer/bookings" className="inline-flex items-center gap-1 text-aqua text-sm mb-4 hover:underline">
        <ArrowLeft size={16} /> {t('back')}
      </Link>

      <PageHeader
        title={`Booking #${booking.id}`}
        subtitle={booking.category_detail?.name}
        badge={<StatusBadge status={booking.status} label={t(`statuses.${booking.status}`)} />}
      />

      {trackMode && showMap && tracking && (
        <div className="mb-6 min-w-0">
          <TrackingMap tracking={tracking} booking={booking} />
        </div>
      )}

      <div className={`grid gap-6 min-w-0 ${!trackMode && showMap ? 'lg:grid-cols-2' : ''}`}>
        <div className="space-y-6 min-w-0">
          <Card>
            <CardHeader title="Booking Details" />
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="flex gap-3">
                <User size={16} className="text-aqua shrink-0 mt-0.5" />
                <div><p className="text-xs text-muted">Provider</p><p className="font-medium text-midnight">{providerName}</p></div>
              </div>
              <div className="flex gap-3">
                <Calendar size={16} className="text-aqua shrink-0 mt-0.5" />
                <div><p className="text-xs text-muted">Scheduled</p><p className="font-medium text-midnight">{booking.scheduled_start ? new Date(booking.scheduled_start).toLocaleString() : 'Flexible'}</p></div>
              </div>
              <div className="flex gap-3 sm:col-span-2">
                <MapPin size={16} className="text-aqua shrink-0 mt-0.5" />
                <div><p className="text-xs text-muted">Address</p><p className="font-medium text-midnight">{booking.address}</p></div>
              </div>
              <div className="flex gap-3 sm:col-span-2">
                <IndianRupee size={16} className="text-lime shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted">Est. Price</p>
                  <p className="font-medium text-midnight">₹{booking.estimated_price_min}–{booking.estimated_price_max} <span className="text-xs text-aqua">({t('approxDemoPrice')})</span></p>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted mt-4 pt-4 border-t border-line">{booking.issue_description}</p>
            {booking.is_demo && <p className="text-aqua text-xs font-medium mt-2">{t('demoData')}</p>}
          </Card>

          {booking.status === 'requested' && (booking.provider || booking.partner) && (
            <Card>
              <CardHeader title="Select Appointment Slot" subtitle="Choose a convenient time" />
              {slotLoading ? <LoadingState message="Loading slots..." /> : slots.length === 0 ? (
                <p className="text-sm text-muted">No available slots. Try flexible timing.</p>
              ) : (
                <div className="space-y-2">
                  {slots.slice(0, 6).map((s, i) => (
                    <button key={i} onClick={() => handleHoldSlot(s)}
                      className="w-full text-left px-4 py-3 border border-line rounded-xl text-sm hover:bg-mist hover:border-indigo/40 transition-colors">
                      {new Date(s.start).toLocaleString()} – {new Date(s.end).toLocaleTimeString()}
                    </button>
                  ))}
                </div>
              )}
              {holdInfo && <p className="text-sm text-aqua mt-3">Slot held for {holdInfo.hold_minutes} min — awaiting confirmation</p>}
            </Card>
          )}

          <Card>
            <CardHeader title="Status Timeline" />
            <BookingTimeline currentStatus={booking.status} />
          </Card>

          {invoice && (
            <Card>
              <CardHeader title={`Invoice — ${invoice.invoice_number}`} />
              <p className="text-xs text-aqua mb-3">{invoice.demo_price_label || t('approxDemoPrice')}</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted">Visit charge</span><span>₹{invoice.visit_charge}</span></div>
                <div className="flex justify-between"><span className="text-muted">Labour</span><span>₹{invoice.labour_charge}</span></div>
                <div className="flex justify-between"><span className="text-muted">Material</span><span>₹{invoice.material_charge}</span></div>
                <div className="flex justify-between font-bold text-midnight pt-2 border-t border-line mt-2"><span>Total</span><span>₹{invoice.total_amount}</span></div>
              </div>
              <p className="text-xs text-muted mt-2">{t('paymentDemo')}</p>
              <div className="pt-3 border-t border-line space-y-2 mt-3">
                <Button
                  onClick={() => setShowUpiModal(true)}
                  variant="primary"
                  size="sm"
                  className="w-full flex items-center justify-center gap-2 shadow-sm !bg-violet hover:!opacity-90"
                >
                  <QrCode size={16} />
                  <span>{lang === 'gu' ? 'UPI / QR કોડથી ચૂકવો' : 'Pay via UPI / QR Code'}</span>
                </Button>
                <Button
                  onClick={() => setShowPrintModal(true)}
                  variant="secondary"
                  size="sm"
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Printer size={15} />
                  <span>{lang === 'gu' ? 'ઇન્વોઇસ પ્રિન્ટ / PDF' : 'Download / Print Invoice'}</span>
                </Button>
              </div>
            </Card>
          )}

          {booking.status === 'completed' && !reviewDone && (
            <Card>
              <CardHeader title="Rate Service" />
              <Select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="mb-3">
                {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} stars</option>)}
              </Select>
              <Textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Comment (optional)" rows={2} className="mb-3" />
              <Button onClick={submitReview} variant="primary">Submit Review</Button>
            </Card>
          )}
          {reviewDone && <p className="text-lime text-sm font-medium">Thank you for your review!</p>}

          <div className="flex flex-wrap gap-2">
            {booking.status === 'started' && (
              <div className="flex gap-2 w-full">
                <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP from provider" className="flex-1" />
                <Button onClick={handleComplete} variant="success">Verify OTP</Button>
              </div>
            )}
            {!['completed', 'cancelled'].includes(booking.status) && (
              <Button onClick={handleCancel} variant="secondary" className="!border-danger !text-danger">Cancel Booking</Button>
            )}
            {['on_the_way', 'arrived', 'accepted', 'preparing'].includes(booking.status) && !trackMode && (
              <Button as={Link} to={`/customer/bookings/${id}/track`} variant="primary">{t('trackProvider')}</Button>
            )}
          </div>
        </div>

        {!trackMode && showMap && tracking && (
          <div className="min-w-0"><TrackingMap tracking={tracking} booking={booking} /></div>
        )}
      </div>

      {invoice && (
        <>
          <UPIPaymentModal
            isOpen={showUpiModal}
            onClose={() => setShowUpiModal(false)}
            amount={invoice.total_amount}
            bookingId={id}
            serviceName={booking.category_detail?.name}
          />
          <InvoicePrintModal
            isOpen={showPrintModal}
            onClose={() => setShowPrintModal(false)}
            booking={booking}
            invoice={invoice}
          />
        </>
      )}
    </DashboardLayout>
  );
}
