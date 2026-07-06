import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider, WebSocketProvider } from '@/providers';
import { ThemeProvider } from '@/providers/theme-provider';
import { Toaster } from 'sonner';
import { DashboardLayout, ProtectedRoute, ScrollToTop, ErrorBoundary } from '@/components/layout';
import { ROUTES } from '@/constants';
import { LanguageProvider } from '@/i18n';

const LoginPage = lazy(() => import('./pages/login-page').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('./pages/dashboard-page').then((m) => ({ default: m.DashboardPage })));
const ClientsPage = lazy(() => import('./pages/clients/clients-page').then((m) => ({ default: m.ClientsPage })));
const ClientFormPage = lazy(() => import('./pages/clients/client-form-page').then((m) => ({ default: m.ClientFormPage })));
const ClientProfilePage = lazy(() => import('./pages/clients/client-profile-page').then((m) => ({ default: m.ClientProfilePage })));
const VisaCasesPage = lazy(() => import('./pages/visa-cases/visa-cases-page').then((m) => ({ default: m.VisaCasesPage })));
const VisaCaseFormPage = lazy(() => import('./pages/visa-cases/visa-case-form-page').then((m) => ({ default: m.VisaCaseFormPage })));
const VisaCaseDetailPage = lazy(() => import('./pages/visa-cases/visa-case-detail-page').then((m) => ({ default: m.VisaCaseDetailPage })));
const VisaDecisionsPage = lazy(() => import('./pages/visa-cases/visa-decisions-page').then((m) => ({ default: m.VisaDecisionsPage })));
const KanbanPage = lazy(() => import('./pages/kanban-page').then((m) => ({ default: m.KanbanPage })));
const AppointmentsPage = lazy(() => import('./pages/appointments/appointments-page').then((m) => ({ default: m.AppointmentsPage })));
const TrackingPage = lazy(() => import('./pages/tracking-page').then((m) => ({ default: m.TrackingPage })));
const NotificationsPage = lazy(() => import('./pages/notifications/notifications-page').then((m) => ({ default: m.NotificationsPage })));
const BackupCenterPage = lazy(() => import('./pages/backup/backup-center-page').then((m) => ({ default: m.BackupCenterPage })));
const SystemHealthPage = lazy(() => import('./pages/health/system-health-page').then((m) => ({ default: m.SystemHealthPage })));
const SystemLogsPage = lazy(() => import('./pages/system-logs/system-logs-page').then((m) => ({ default: m.SystemLogsPage })));
const AuditLogsPage = lazy(() => import('./pages/audit-logs/audit-logs-page').then((m) => ({ default: m.AuditLogsPage })));
const PdfPrintingPage = lazy(() => import('./pages/pdf/pdf-printing-page').then((m) => ({ default: m.PdfPrintingPage })));
const SettingsPage = lazy(() => import('./pages/settings/settings-page').then((m) => ({ default: m.SettingsPage })));
const ManagersPage = lazy(() => import('./pages/managers/managers-page').then((m) => ({ default: m.ManagersPage })));

function PageLoader() {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <LanguageProvider>
      <QueryProvider>
        <BrowserRouter>
          <AuthProvider>
            <WebSocketProvider>
              <ScrollToTop />
              <Suspense fallback={<PageLoader />}>
                <ErrorBoundary>
                  <Routes>
                  <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                  <Route element={<DashboardLayout />}>
                    <Route path={ROUTES.TRACKING} element={<TrackingPage />} />
                    <Route element={<ProtectedRoute />}>
                      <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
                      <Route path={ROUTES.CLIENTS} element={<ClientsPage />} />
                      <Route path={ROUTES.CLIENTS_NEW} element={<ClientFormPage />} />
                      <Route path={ROUTES.CLIENTS_DETAIL(':id')} element={<ClientProfilePage />} />
                      <Route path={ROUTES.CLIENTS_DETAIL(':id') + '/edit'} element={<ClientFormPage />} />
                      <Route path={ROUTES.VISA_CASES} element={<VisaCasesPage />} />
                      <Route path={ROUTES.VISA_CASES_NEW} element={<VisaCaseFormPage />} />
                      <Route path={ROUTES.VISA_CASES_DETAIL(':id')} element={<VisaCaseDetailPage />} />
                      <Route path={ROUTES.VISA_DECISIONS} element={<VisaDecisionsPage />} />
                      <Route path={ROUTES.KANBAN} element={<KanbanPage />} />
                      <Route path={ROUTES.APPOINTMENTS} element={<AppointmentsPage />} />
                      <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />
                      <Route path={ROUTES.BACKUP_CENTER} element={<BackupCenterPage />} />
                      <Route path={ROUTES.SYSTEM_HEALTH} element={<SystemHealthPage />} />
                      <Route path={ROUTES.SYSTEM_LOGS} element={<SystemLogsPage />} />
                      <Route path={ROUTES.AUDIT_LOGS} element={<AuditLogsPage />} />
                      <Route path={ROUTES.PDF} element={<PdfPrintingPage />} />
                      <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
                      <Route path={ROUTES.USERS} element={<ManagersPage />} />
                      <Route path="/" element={<Navigate to={ROUTES.VISA_CASES} replace />} />
                    </Route>
                  </Route>
                  <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
                </Routes>
                </ErrorBoundary>
              </Suspense>
              <Toaster richColors position="top-right" />
            </WebSocketProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
