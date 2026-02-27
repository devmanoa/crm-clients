import React, { Suspense, useState, useEffect, Component } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { List, UserPlus, BarChart3, GitBranch, Copy } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { loadRemoteComponent } from '../../remoteLoader';
import Topbar from './Topbar';
import Sidebar from './Sidebar';

// Lazy-load remote components
const RemoteHeaderBar = React.lazy(() => loadRemoteComponent('./HeaderBar'));
const RemoteSidebar = React.lazy(() => loadRemoteComponent('./Sidebar'));

// ── Placeholders ────────────────────────────────────────────────
function HeaderFallback() {
  return <div className="h-12 shrink-0 border-b border-[--k-border] bg-gradient-to-r from-white to-blue-50" />;
}

function SidebarFallback() {
  return <div className="w-[210px] shrink-0 bg-[--k-sidebar-bg] h-full" />;
}

// ── Error boundary ──────────────────────────────────────────────
interface EBProps { fallback: React.ReactNode; children: React.ReactNode }
interface EBState { hasError: boolean }

class RemoteErrorBoundary extends Component<EBProps, EBState> {
  constructor(props: EBProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): EBState {
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

// ── Sidebar config ──────────────────────────────────────────────
const SIDEBAR_SECTIONS = [
  {
    label: 'Clients',
    items: [
      { icon: List, label: 'Liste clients', path: '/clients' },
      { icon: UserPlus, label: 'Nouveau client', path: '/clients/add' },
      { icon: BarChart3, label: 'Tableau de bord', path: '/clients/dashboard' },
      { icon: Copy, label: 'Doublons', path: '/clients/duplicates' },
    ],
  },
  {
    label: 'Opportunités',
    items: [
      { icon: List, label: 'Liste', path: '/opportunities' },
      { icon: GitBranch, label: 'Pipeline', path: '/opportunities/pipeline' },
      { icon: BarChart3, label: 'Tableau de bord', path: '/opportunities/dashboard' },
    ],
  },
];

// ── Layout ──────────────────────────────────────────────────────
export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('k_sidebar_collapsed') === '1'; }
    catch { return false; }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem('k_sidebar_collapsed', sidebarCollapsed ? '1' : '0'); }
    catch { /* ignore */ }
  }, [sidebarCollapsed]);

  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  const handleNavigate = (path: string) => navigate(path);

  const headerUser = user
    ? {
        firstName: user.firstName || user.fullName?.split(' ')[0] || '',
        lastName: user.lastName || user.fullName?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        username: user.username || '',
      }
    : null;

  const localTopbar = (
    <Topbar onToggleMobileMenu={() => setMobileMenuOpen((v) => !v)} />
  );

  const localSidebar = (
    <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((v) => !v)} />
  );

  const localMobileSidebar = (
    <Sidebar collapsed={false} onToggle={() => setMobileMenuOpen(false)} />
  );

  return (
    <div className="h-screen flex flex-col bg-[--k-bg]">
      {/* Header — remote with local fallback */}
      <RemoteErrorBoundary fallback={localTopbar}>
        <Suspense fallback={<HeaderFallback />}>
          <RemoteHeaderBar
            user={headerUser}
            onLogout={logout}
            currentAppName="CRM Clients"
            onNavigate={handleNavigate}
          />
        </Suspense>
      </RemoteErrorBoundary>

      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <RemoteErrorBoundary fallback={localSidebar}>
            <Suspense fallback={<SidebarFallback />}>
              <RemoteSidebar
                sections={SIDEBAR_SECTIONS}
                activePath={location.pathname}
                onNavigate={handleNavigate}
                collapsed={sidebarCollapsed}
                onCollapse={() => setSidebarCollapsed((v) => !v)}
                onHelpClick={() => {}}
              />
            </Suspense>
          </RemoteErrorBoundary>
        </div>

        {/* Mobile sidebar overlay */}
        {mobileMenuOpen && (
          <>
            <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed left-0 top-12 z-40 h-[calc(100vh-48px)] md:hidden">
              <RemoteErrorBoundary fallback={localMobileSidebar}>
                <Suspense fallback={<SidebarFallback />}>
                  <RemoteSidebar
                    sections={SIDEBAR_SECTIONS}
                    activePath={location.pathname}
                    onNavigate={handleNavigate}
                    collapsed={false}
                    onCollapse={() => setMobileMenuOpen(false)}
                    onHelpClick={() => {}}
                  />
                </Suspense>
              </RemoteErrorBoundary>
            </div>
          </>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto p-3 md:p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
