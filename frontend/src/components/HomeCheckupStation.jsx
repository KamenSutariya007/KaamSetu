import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { aiAPI } from '../api/client';
import { Camera, Upload, Video, Mic, FileText, AlertTriangle, ScanLine, Globe } from 'lucide-react';
import LoadingState from './LoadingState';
import Button from './ui/Button';
import { Select, Textarea } from './ui/Input';
import Card from './ui/Card';
import VoiceInputButton from './VoiceInputButton';
import cn from '../utils/cn';

const CATEGORIES = [
  'plumbing', 'electrical', 'ac-refrigerator', 'appliance-repair', 'carpentry',
  'cleaning', 'wall-ceiling', 'door-lock', 'ro-water', 'computer-mobile',
];

const INPUT_METHODS = [
  { icon: Upload, labelKey: 'uploadPhoto', action: 'image', color: 'bg-blue/15 text-blue' },
  { icon: Camera, labelKey: 'camera', action: 'image', color: 'bg-brand/15 text-brand' },
  { icon: Video, labelKey: 'video', action: 'video', color: 'bg-pink/15 text-pink' },
  { icon: Mic, labelKey: 'voice', action: 'voice', color: 'bg-cyan/15 text-cyan' },
  { icon: FileText, labelKey: 'textDesc', action: 'text', color: 'bg-brand/15 text-brand' },
];

export default function HomeCheckupStation({ compact = false }) {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeMethod, setActiveMethod] = useState(null);

  const handleMethodClick = (method) => {
    setActiveMethod(method.action);
    if (method.action === 'image') document.getElementById('checkup-image')?.click();
    else if (method.action === 'text') document.getElementById('checkup-text')?.focus();
  };

  const handleAnalyze = async () => {
    if (!text && !image && !category) { setError('Please describe the issue or select a category.'); return; }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      if (text) formData.append('text', text);
      if (category) formData.append('category', category);
      formData.append('language', lang);
      if (image) formData.append('image', image);
      const { data } = await aiAPI.analyze(formData);
      navigate('/ai-assistant', { state: { result: data } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState message="Analyzing your issue..." />;

  return (
    <Card className={cn('!shadow-md', !compact && 'lg:!p-8')} hover={false}>
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-line">
        <div className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center">
          <ScanLine size={22} className="text-brand" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-ink">{t('homeCheckupTitle')}</h2>
          <p className="text-sm text-muted">{t('homeCheckupSubtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5">
        {INPUT_METHODS.map(({ icon: Icon, labelKey, action, color }) => (
          <button
            key={labelKey}
            type="button"
            onClick={() => handleMethodClick({ action })}
            className={cn(
              'flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all duration-200 hover:scale-[1.03]',
              activeMethod === action ? 'border-brand bg-brand/5 shadow-sm' : 'border-line bg-page hover:border-brand/30',
            )}
          >
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', color)}>
              <Icon size={20} />
            </div>
            <span className="text-[11px] font-medium text-ink text-center">{t(labelKey)}</span>
          </button>
        ))}
      </div>

      <input id="checkup-image" type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => { setImage(e.target.files?.[0] || null); setActiveMethod('image'); }} />

      <div className="space-y-4">
        <Select label="Service Category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Select category</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/-/g, ' ')}</option>)}
        </Select>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="checkup-text" className="text-sm font-medium text-ink">
              {lang === 'gu' ? 'સમસ્યા જણાવો' : 'Describe the problem'}
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted">
                {lang === 'gu' ? 'બોલીને લખો:' : 'Voice input:'}
              </span>
              <VoiceInputButton
                onTranscript={(spoken) => setText((prev) => prev ? `${prev} ${spoken}` : spoken)}
                size={16}
                className="!p-1.5"
              />
            </div>
          </div>
          <Textarea id="checkup-text" value={text} onChange={(e) => setText(e.target.value)}
            placeholder={lang === 'gu' ? 'તમારા ઘરમાં શું સમસ્યા છે? (લખો અથવા માઇક પર ક્લિક કરીને બોલો)' : 'What issue are you facing at home? (type or click mic to speak)'} rows={compact ? 2 : 3} />
        </div>
        {image && <p className="text-sm text-green flex items-center gap-1">✓ Photo attached: {image.name}</p>}
        <div className="flex items-center gap-2 text-xs text-muted bg-page px-3 py-2 rounded-lg border border-line">
          <Globe size={14} /> Analysis: {lang === 'gu' ? 'ગુજરાતી' : lang === 'hi' ? 'हिन्दी' : 'English'}
        </div>
        {error && (
          <div className="flex items-center gap-2 text-danger text-sm bg-danger/5 px-3 py-2 rounded-lg border border-danger/20" role="alert">
            <AlertTriangle size={16} /> {error}
          </div>
        )}
        <Button onClick={handleAnalyze} variant="violet" size="lg" className="w-full">{t('analyze')}</Button>
      </div>
    </Card>
  );
}
