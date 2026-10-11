import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MainLayout } from './layouts/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ProfilePage } from './pages/ProfilePage';
import { AccountSettingsPage } from './pages/AccountSettingsPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { CreatorDetailPage } from './pages/CreatorDetailPage';
import { CampaignsExplorePage } from './pages/CampaignsExplorePage';
import { CampaignDetailPage } from './pages/CampaignDetailPage';
import { CampaignBuilderPage } from './pages/CampaignBuilderPage';
import { CollaborationsPage } from './pages/CollaborationsPage';
import { MessagesPage } from './pages/MessagesPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<MainLayout />}>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            {/* Marketplace & Discovery */}
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/marketplace/creator/:id" element={<CreatorDetailPage />} />

            {/* Campaigns */}
            <Route path="/campaigns" element={<CampaignsExplorePage />} />
            <Route
              path="/campaigns/new"
              element={
                <ProtectedRoute allowedRoles={['brand']}>
                  <CampaignBuilderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/campaigns/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['brand']}>
                  <CampaignBuilderPage />
                </ProtectedRoute>
              }
            />
            <Route path="/campaigns/:id" element={<CampaignDetailPage />} />

            {/* Collaborations Workspace */}
            <Route
              path="/collaborations"
              element={
                <ProtectedRoute>
                  <CollaborationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/collaborations/:id"
              element={
                <ProtectedRoute>
                  <CollaborationsPage />
                </ProtectedRoute>
              }
            />

            {/* Direct Messaging */}
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              }
            />

            {/* Authenticated Protected Account Routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AccountSettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
