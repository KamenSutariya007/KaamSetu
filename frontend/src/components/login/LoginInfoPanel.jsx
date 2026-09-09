import {

  Sparkles, ShieldCheck, Calendar, IndianRupee, MapPin, BookOpen, Lock,

} from 'lucide-react';

import { useLanguage } from '../../context/LanguageContext';



const BENEFIT_KEYS = [

  { icon: Sparkles, titleKey: 'loginBenefitAI', descKey: 'loginBenefitAIDesc', color: 'bg-brand/10 text-brand' },

  { icon: ShieldCheck, titleKey: 'loginBenefitTrusted', descKey: 'loginBenefitTrustedDesc', color: 'bg-green/10 text-green' },

  { icon: Calendar, titleKey: 'loginBenefitScheduling', descKey: 'loginBenefitSchedulingDesc', color: 'bg-blue/10 text-blue' },

  { icon: IndianRupee, titleKey: 'loginBenefitPricing', descKey: 'loginBenefitPricingDesc', color: 'bg-brand/10 text-brand' },

  { icon: MapPin, titleKey: 'loginBenefitTracking', descKey: 'loginBenefitTrackingDesc', color: 'bg-cyan/10 text-cyan' },

  { icon: BookOpen, titleKey: 'loginBenefitPassport', descKey: 'loginBenefitPassportDesc', color: 'bg-purple/10 text-purple' },

];



export default function LoginInfoPanel() {

  const { t } = useLanguage();



  return (

    <aside className="space-y-6" aria-label={t('loginWhyKaamSetu')}>

      <div className="bg-surface rounded-2xl border border-line p-6 shadow-sm">

        <h2 className="text-lg font-bold text-ink mb-4">{t('loginWhyKaamSetu')}</h2>

        <ul className="space-y-4">

          {BENEFIT_KEYS.map(({ icon: Icon, titleKey, descKey, color }) => (

            <li key={titleKey} className="flex gap-3">

              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>

                <Icon size={18} aria-hidden="true" />

              </div>

              <div>

                <p className="font-semibold text-ink text-sm">{t(titleKey)}</p>

                <p className="text-xs text-muted leading-relaxed">{t(descKey)}</p>

              </div>

            </li>

          ))}

        </ul>

      </div>



      <div className="pastel-purple rounded-2xl border border-line p-6">

        <h2 className="text-lg font-bold text-ink mb-2">{t('loginTrustTitle')}</h2>

        <p className="text-sm text-muted mb-4 leading-relaxed">{t('loginTrustDesc')}</p>

        <ul className="space-y-2 text-sm text-ink">

          <li className="flex items-center gap-2">

            <Lock size={16} className="text-brand" aria-hidden="true" /> {t('loginTrustSecureLogin')}

          </li>

          <li className="flex items-center gap-2">

            <ShieldCheck size={16} className="text-green" aria-hidden="true" /> {t('loginTrustProtected')}

          </li>

          <li className="flex items-center gap-2">

            <MapPin size={16} className="text-brand" aria-hidden="true" /> {t('loginTrustLocation')}

          </li>

        </ul>

      </div>

    </aside>

  );

}

