import React, { useState, useEffect } from 'react';
import { PublicFormPage } from './pages/PublicFormPage';
import { SandboxCheckoutPage } from './pages/SandboxCheckoutPage';
import { ProcessingPage } from './pages/ProcessingPage';
import { SuccessPage } from './pages/SuccessPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminRegistrationsPage } from './pages/admin/AdminRegistrationsPage';
import { AdminRegistrationDetailPage } from './pages/admin/AdminRegistrationDetailPage';
import { AdminFormBuilderPage } from './pages/admin/AdminFormBuilderPage';
import { AdminClassesPage } from './pages/admin/AdminClassesPage';
import { AdminSizesPage } from './pages/admin/AdminSizesPage';
import { AdminShirtsReportPage } from './pages/admin/AdminShirtsReportPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const onLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', onLocationChange);
    return () => window.removeEventListener('popstate', onLocationChange);
  }, []);

  // Helper route matching
  const path = currentPath.toLowerCase();

  // Public: Success
  if (path === '/inscricao/sucesso') {
    return <SuccessPage />;
  }

  // Public: Processing
  if (path === '/pagamento/processando') {
    return <ProcessingPage />;
  }

  // Public: Checkout gateway (simulated or redirect)
  if (path === '/checkout/infinitepay') {
    return <SandboxCheckoutPage />;
  }

  // Admin: Login
  if (path === '/admin/login') {
    return <AdminLoginPage />;
  }

  // Admin routes wrapped in AdminLayout
  if (path.startsWith('/admin')) {
    // Single Registration Detail: /admin/inscricoes/:id
    const regDetailMatch = path.match(/^\/admin\/inscricoes\/([a-zA-Z0-9_-]+)$/);
    if (regDetailMatch) {
      const regId = regDetailMatch[1];
      return (
        <AdminLayout currentPath={path}>
          <AdminRegistrationDetailPage registrationId={regId} />
        </AdminLayout>
      );
    }

    if (path === '/admin/inscricoes') {
      return (
        <AdminLayout currentPath={path}>
          <AdminRegistrationsPage />
        </AdminLayout>
      );
    }

    if (path === '/admin/formulario') {
      return (
        <AdminLayout currentPath={path}>
          <AdminFormBuilderPage />
        </AdminLayout>
      );
    }

    if (path === '/admin/turmas') {
      return (
        <AdminLayout currentPath={path}>
          <AdminClassesPage />
        </AdminLayout>
      );
    }

    if (path === '/admin/tamanhos') {
      return (
        <AdminLayout currentPath={path}>
          <AdminSizesPage />
        </AdminLayout>
      );
    }

    if (path === '/admin/camisas') {
      return (
        <AdminLayout currentPath={path}>
          <AdminShirtsReportPage />
        </AdminLayout>
      );
    }

    if (path === '/admin/configuracoes') {
      return (
        <AdminLayout currentPath={path}>
          <AdminSettingsPage />
        </AdminLayout>
      );
    }

    // Default admin: Dashboard (/admin)
    return (
      <AdminLayout currentPath={path}>
        <AdminDashboardPage />
      </AdminLayout>
    );
  }

  // Default: Public Form (/ or /inscricao)
  return <PublicFormPage />;
}
