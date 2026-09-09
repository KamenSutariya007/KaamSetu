import { useState } from 'react';
import { Shield, CheckCircle2, Clock, Upload, AlertCircle, FileText } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import Card, { CardHeader } from '../ui/Card';
import Button from '../ui/Button';

export default function ProviderKYCSection({ profile, onRefresh }) {
  const { lang } = useLanguage();
  const [docType, setDocType] = useState('id');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isGu = lang === 'gu';
  const status = profile?.verification_status || 'pending';
  const isVerified = status === 'verified';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) return;
    setSubmitting(true);
    // Simulate/send document submission
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setFile(null);
      if (onRefresh) onRefresh();
    }, 1200);
  };

  return (
    <Card className="!p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-line">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
            <Shield size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-ink">
              {isGu ? 'ટેકનિશિયન KYC & વેરીફિકેશન સ્ટેટસ' : 'Technician KYC & Verification Status'}
            </h3>
            <p className="text-xs text-muted">
              {isGu ? 'ઓફિશિયલ Verified Pro બ્લુ બેજ મેળવો અને વિશ્વાસ વધારો' : 'Earn the Verified Pro trust badge and get 3x more bookings'}
            </p>
          </div>
        </div>

        {isVerified ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
            <CheckCircle2 size={15} />
            {isGu ? 'વેરીફાઈડ પ્રોવાઇડર (Verified)' : 'Verified Professional'}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-sm">
            <Clock size={15} />
            {isGu ? 'વેરીફિકેશન પેન્ડિંગ (Pending)' : 'Verification Pending Review'}
          </span>
        )}
      </div>

      {/* Trust benefits banner */}
      <div className="bg-gradient-to-r from-brand/10 via-teal/5 to-transparent p-4 rounded-xl border border-brand/20 flex items-center gap-3 text-xs text-ink">
        <span className="text-lg">⭐</span>
        <p>
          <strong className="text-brand">Trust Boost:</strong>{' '}
          {isGu
            ? 'KYC વેરિફિકેશનથી તમારો ટ્રસ્ટ સ્કોર +૨૦% વધશે અને ગ્રાહકોને પ્રોફાઇલ પર ઓફિશિયલ બેજ દેખાશે.'
            : 'Verified profiles gain +20% to their KaamSetu Trust Score and appear in top recommendation sections.'}
        </p>
      </div>

      {/* Upload Document Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <h4 className="text-sm font-bold text-ink">
          {isGu ? 'નવો દસ્તાવેજ અપલોડ કરો' : 'Upload Verification Document'}
        </h4>

        {submitted && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs">
            <CheckCircle2 size={16} />
            <span>
              {isGu
                ? 'દસ્તાવેજ સફળતાપૂર્વક અપલોડ થયો! એડમિન ટીમ ટૂંક સમયમાં ચકાસી લેશે.'
                : 'Document uploaded successfully! Our admin team will verify it shortly.'}
            </span>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">
              {isGu ? 'દસ્તાવેજનો પ્રકાર' : 'Document Type'}
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-page border border-line text-ink focus:ring-2 focus:ring-brand/30"
            >
              <option value="id">{isGu ? 'ઓળખ કાર્ડ (Aadhaar / Voter ID)' : 'Government ID (Aadhaar / Voter ID)'}</option>
              <option value="certificate">{isGu ? 'સ્કિલ / ITI / ટ્રેડ સર્ટિફિકેટ' : 'Trade / ITI Skill Certificate'}</option>
              <option value="other">{isGu ? 'અન્ય દસ્તાવેજ' : 'Other Proof'}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1">
              {isGu ? 'ફાઇલ પસંદ કરો (PDF, JPG, PNG)' : 'Select File (PDF, JPG, PNG)'}
            </label>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-muted file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand file:text-white hover:file:opacity-90 cursor-pointer"
            />
          </div>
        </div>

        {file && (
          <p className="text-xs text-green flex items-center gap-1">
            <FileText size={14} /> Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!file || submitting}
          className="flex items-center gap-1.5 shadow-sm"
        >
          <Upload size={14} />
          <span>{submitting ? (isGu ? 'અપલોડ થઈ રહ્યું છે...' : 'Uploading...') : (isGu ? 'દસ્તાવેજ સબમિટ કરો' : 'Submit Document')}</span>
        </Button>
      </form>
    </Card>
  );
}
