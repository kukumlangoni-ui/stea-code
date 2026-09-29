import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SitesAdminGuard from './SitesAdminGuard.jsx';
import SitesAdminLayout from './SitesAdminLayout.jsx';

const Dashboard = lazy(() => import('./SitesAdminDashboard.jsx'));
const Websites = lazy(() => import('./SitesAdminWebsites.jsx'));
const PremiumWebsiteEditor = lazy(() => import('./PremiumWebsiteEditor.jsx'));
const Categories = lazy(() => import('./SitesAdminCategories.jsx'));
const Developers = lazy(() => import('./SitesAdminDevelopers.jsx'));
const Popular = lazy(() => import('./SitesAdminPopular.jsx'));
const Search = lazy(() => import('./SitesAdminSearch.jsx'));
const Members = lazy(() => import('./SitesAdminMembers.jsx'));
const Submissions = lazy(() => import('./SitesAdminSubmissions.jsx'));
const Analytics = lazy(() => import('./SitesAdminAnalytics.jsx'));
const Settings = lazy(() => import('./SitesAdminSettings.jsx'));

const LoadingFallback = () => (
  <div style={{ padding: 40, color: 'rgba(255,255,255,.62)' }}>Loading...</div>
);

export default function SitesAdminApp() {
  return (
    <SitesAdminGuard>
      <SitesAdminLayout>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/websites" element={<Websites />} />
            <Route path="/websites/new" element={<PremiumWebsiteEditor />} />
            <Route path="/websites/edit/:siteId" element={<PremiumWebsiteEditor />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/developers" element={<Developers />} />
            <Route path="/popular" element={<Popular />} />
            <Route path="/search" element={<Search />} />
            <Route path="/members" element={<Members />} />
            <Route path="/submissions" element={<Submissions />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </SitesAdminLayout>
    </SitesAdminGuard>
  );
}
