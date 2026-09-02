import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import { PublicLayout, AuthLayout } from './components/layout/Layouts';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AIAssistantPage from './pages/AIAssistantPage';
import ProvidersPage from './pages/ProvidersPage';
import GuidesPage from './pages/GuidesPage';
import GuideDetailPage from './pages/GuideDetailPage';
import SupportPage from './pages/SupportPage';
import FairPricePage from './pages/FairPricePage';
import BookServicePage from './pages/BookServicePage';

import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerBookings from './pages/customer/CustomerBookings';
import BookingDetail from './pages/customer/BookingDetail';
import PassportPage from './pages/customer/PassportPage';
import NotificationsPage from './pages/customer/NotificationsPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';

import ProviderDashboard from './pages/provider/ProviderDashboard';
import PartnerDashboard from './pages/partner/PartnerDashboard';
import SupportDeskPage from './pages/support/SupportDeskPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBookings from './pages/admin/AdminBookings';

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
            <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
            <Route path="/register" element={<AuthLayout><RegisterPage /></AuthLayout>} />
            <Route path="/forgot-password" element={<AuthLayout><ForgotPasswordPage /></AuthLayout>} />
            <Route path="/reset-password" element={<AuthLayout><ResetPasswordPage /></AuthLayout>} />
            <Route path="/ai-assistant" element={<PublicLayout><AIAssistantPage /></PublicLayout>} />
            <Route path="/providers" element={<PublicLayout><ProvidersPage /></PublicLayout>} />
            <Route path="/guides" element={<PublicLayout><GuidesPage /></PublicLayout>} />
            <Route path="/guides/:slug" element={<PublicLayout><GuideDetailPage /></PublicLayout>} />
            <Route path="/support" element={<PublicLayout><SupportPage /></PublicLayout>} />
            <Route path="/fair-price" element={<PublicLayout><FairPricePage /></PublicLayout>} />
            <Route path="/book" element={<PublicLayout><BookServicePage /></PublicLayout>} />

            <Route path="/customer" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><CustomerDashboard /></ProtectedRoute>} />
            <Route path="/customer/bookings" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><CustomerBookings /></ProtectedRoute>} />
            <Route path="/customer/bookings/:id" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><BookingDetail /></ProtectedRoute>} />
            <Route path="/customer/bookings/:id/track" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><BookingDetail trackMode /></ProtectedRoute>} />
            <Route path="/customer/passport" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><PassportPage /></ProtectedRoute>} />
            <Route path="/customer/notifications" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><NotificationsPage /></ProtectedRoute>} />
            <Route path="/customer/profile" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><ProfileSettingsPage role="CUSTOMER" /></ProtectedRoute>} />

            <Route path="/provider" element={<ProtectedRoute allowedRoles={['INDIVIDUAL_PROVIDER']}><ProviderDashboard /></ProtectedRoute>} />
            <Route path="/provider/jobs" element={<ProtectedRoute allowedRoles={['INDIVIDUAL_PROVIDER']}><ProviderDashboard tab="jobs" /></ProtectedRoute>} />
            <Route path="/provider/calendar" element={<ProtectedRoute allowedRoles={['INDIVIDUAL_PROVIDER']}><ProviderDashboard tab="calendar" /></ProtectedRoute>} />
            <Route path="/provider/profile" element={<ProtectedRoute allowedRoles={['INDIVIDUAL_PROVIDER']}><ProfileSettingsPage role="INDIVIDUAL_PROVIDER" /></ProtectedRoute>} />

            <Route path="/partner" element={<ProtectedRoute allowedRoles={['THIRD_PARTY_PARTNER']}><PartnerDashboard /></ProtectedRoute>} />
            <Route path="/partner/jobs" element={<ProtectedRoute allowedRoles={['THIRD_PARTY_PARTNER']}><PartnerDashboard /></ProtectedRoute>} />
            <Route path="/partner/calendar" element={<ProtectedRoute allowedRoles={['THIRD_PARTY_PARTNER']}><PartnerDashboard /></ProtectedRoute>} />
            <Route path="/partner/profile" element={<ProtectedRoute allowedRoles={['THIRD_PARTY_PARTNER']}><ProfileSettingsPage role="THIRD_PARTY_PARTNER" /></ProtectedRoute>} />

            <Route path="/support-desk" element={<ProtectedRoute allowedRoles={['SUPPORT_AGENT', 'SENIOR_SUPPORT_AGENT']}><SupportDeskPage /></ProtectedRoute>} />
            <Route path="/support-desk/profile" element={<ProtectedRoute allowedRoles={['SUPPORT_AGENT', 'SENIOR_SUPPORT_AGENT']}><ProfileSettingsPage role="SUPPORT_AGENT" /></ProtectedRoute>} />

            <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/bookings" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminBookings /></ProtectedRoute>} />
            <Route path="/admin/profile" element={<ProtectedRoute allowedRoles={['ADMIN']}><ProfileSettingsPage role="ADMIN" /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}
