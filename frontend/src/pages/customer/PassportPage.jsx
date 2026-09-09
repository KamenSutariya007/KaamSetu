import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingState, { EmptyState } from '../../components/LoadingState';
import { useLanguage } from '../../context/LanguageContext';
import { passportAPI } from '../../api/client';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const ASSET_TYPES = [
  'ac', 'refrigerator', 'washing_machine', 'geyser', 'ro', 'fan', 'inverter', 'laptop', 'other',
];
const CONDITIONS = ['excellent', 'good', 'fair', 'poor'];

const emptyForm = {
  asset_type: 'ac',
  brand: '',
  model_name: '',
  purchase_date: '',
  warranty_end: '',
  last_service: '',
  next_service: '',
  condition: 'good',
  notes: '',
};

export default function PassportPage() {
  const { t } = useLanguage();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    passportAPI.assets().then(({ data }) => {
      setAssets(data.results || data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (a) => {
    setEditId(a.id);
    setForm({
      asset_type: a.asset_type,
      brand: a.brand || '',
      model_name: a.model_name || '',
      purchase_date: a.purchase_date || '',
      warranty_end: a.warranty_end || '',
      last_service: a.last_service || '',
      next_service: a.next_service || '',
      condition: a.condition || 'good',
      notes: a.notes || '',
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      Object.keys(payload).forEach((k) => { if (payload[k] === '') payload[k] = null; });
      if (editId) {
        await passportAPI.updateAsset(editId, payload);
      } else {
        await passportAPI.createAsset(payload);
      }
      setShowForm(false);
      load();
    } catch (err) {
      alert(err.response?.data?.detail || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this appliance?')) return;
    await passportAPI.deleteAsset(id);
    load();
  };

  return (
    <DashboardLayout role="CUSTOMER">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t('passport')}</h1>
          <p className="text-muted text-sm">Track appliances, warranty & service history</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-indigo text-white rounded-xl font-medium hover:bg-indigo-hover transition-colors">
          <Plus size={18} /> Add Appliance
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-surface rounded-2xl border border-line p-5 mb-6 space-y-3">
          <h3 className="font-semibold text-ink">{editId ? 'Edit Appliance' : 'Add Appliance'}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <select value={form.asset_type} onChange={(e) => setForm({ ...form, asset_type: e.target.value })}
              className="px-3 py-2 rounded-lg border border-line">
              {ASSET_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
            <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}
              className="px-3 py-2 rounded-lg border border-line">
              {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input placeholder="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}
              className="px-3 py-2 rounded-lg border border-line" />
            <input placeholder="Model" value={form.model_name} onChange={(e) => setForm({ ...form, model_name: e.target.value })}
              className="px-3 py-2 rounded-lg border border-line" />
            <input type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
              className="px-3 py-2 rounded-lg border border-line" />
            <input type="date" value={form.warranty_end} onChange={(e) => setForm({ ...form, warranty_end: e.target.value })}
              className="px-3 py-2 rounded-lg border border-line" />
            <input type="date" value={form.last_service} onChange={(e) => setForm({ ...form, last_service: e.target.value })}
              className="px-3 py-2 rounded-lg border border-line" />
            <input type="date" value={form.next_service} onChange={(e) => setForm({ ...form, next_service: e.target.value })}
              className="px-3 py-2 rounded-lg border border-line" />
          </div>
          <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2} className="w-full px-3 py-2 rounded-lg border border-line" />
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo text-white rounded-lg font-medium">
              {saving ? t('loading') : 'Save'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-line rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      {loading ? <LoadingState /> : assets.length === 0 ? <EmptyState message="No appliances yet. Add your first one!" /> : (
        <div className="grid sm:grid-cols-2 gap-4">
          {assets.map((a) => (
            <div key={a.id} className="bg-surface rounded-2xl border border-line p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-ink">{a.asset_type?.replace(/_/g, ' ').toUpperCase()}</h3>
                  <p className="text-sm text-muted">{a.brand} {a.model_name}</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="text-right">
                    <p className="text-lg font-bold text-indigo">{a.health_score}%</p>
                    <p className="text-xs text-muted">Health</p>
                  </div>
                  <button onClick={() => openEdit(a)} className="p-1 text-muted hover:text-ink"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(a.id)} className="p-1 text-danger hover:text-red-700"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="text-sm text-muted space-y-1">
                {a.warranty_end && <p>Warranty until: {a.warranty_end}</p>}
                {a.next_service && <p className="text-brand font-medium">Next service: {a.next_service}</p>}
                {a.last_service && <p>Last service: {a.last_service}</p>}
                <p>Condition: {a.condition}</p>
              </div>
              {a.is_demo && <span className="text-xs text-brand mt-2 inline-block">{t('demoData')}</span>}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
