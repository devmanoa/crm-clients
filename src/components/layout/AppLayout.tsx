import React, { useState, useEffect, useRef, Component } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { List, UserPlus, BarChart3, GitBranch, Copy } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { loadRemoteComponent } from '../../remoteLoader';
import Topbar from './Topbar';
import Sidebar from './Sidebar';

// ── Hook: try remote, fallback to local ──────────────────────────
function useRemoteComponent(
  remoteName: string,
  LocalFallback: React.ComponentType<any>,
): { Component: React.ComponentType<any>; isRemote: boolean } {
  const [RemoteComp, setRemoteComp] = useState<React.ComponentType<any> | null>(null);
  const [failed, setFailed] = useState(false);
  const tried = useRef(false);

  useEffect(() => {
    if (tried.current) return;
    tried.current = true;

    loadRemoteComponent(remoteName)
      .then((mod) => setRemoteComp(() => mod.default))
      .catch(() => setFailed(true));
  }, [remoteName]);

  if (failed || !RemoteComp) {
    return { Component: failed ? LocalFallback : LocalFallback, isRemote: false };
  }
  return { Component: RemoteComp, isRemote: true };
}

// ── Error boundary (catches render errors from remote) ───────────
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

// ── Sidebar config ───────────────────────────────────────────────
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

// ── Layout ───────────────────────────────────────────────────────
export default function AppLayout() {
  const { user, logout, token } = useAuth();
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

  // Remote components (fallback to local if unavailable)
  const { Component: HeaderBar, isRemote: isRemoteHeader } = useRemoteComponent('./HeaderBar', Topbar);
  const { Component: SidebarComp, isRemote: isRemoteSidebar } = useRemoteComponent('./Sidebar', Sidebar);

  const handleNavigate = (path: string) => navigate(path);

  const headerUser = user
    ? {
        firstName: user.firstName || user.fullName?.split(' ')[0] || '',
        lastName: user.lastName || user.fullName?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        username: user.username || '',
      }
    : null;

  // Props depend on whether we're rendering remote or local
  const headerProps = isRemoteHeader
    ? { user: headerUser, onLogout: logout, currentAppName: 'CRM Clients', onNavigate: handleNavigate, authToken: token }
    : { onToggleMobileMenu: () => setMobileMenuOpen((v) => !v) };

  const sidebarProps = isRemoteSidebar
    ? { sections: SIDEBAR_SECTIONS, activePath: location.pathname, onNavigate: handleNavigate, collapsed: sidebarCollapsed, onCollapse: () => setSidebarCollapsed((v) => !v), onHelpClick: () => {} }
    : { collapsed: sidebarCollapsed, onToggle: () => setSidebarCollapsed((v) => !v) };

  const mobileSidebarProps = isRemoteSidebar
    ? { sections: SIDEBAR_SECTIONS, activePath: location.pathname, onNavigate: handleNavigate, collapsed: false, onCollapse: () => setMobileMenuOpen(false), onHelpClick: () => {} }
    : { collapsed: false, onToggle: () => setMobileMenuOpen(false) };

  return (
    <div className="h-screen flex flex-col bg-[--k-bg]">
      {/* Header */}
      <RemoteErrorBoundary fallback={<Topbar onToggleMobileMenu={() => setMobileMenuOpen((v) => !v)} />}>
        <HeaderBar {...headerProps} />
      </RemoteErrorBoundary>

      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <RemoteErrorBoundary fallback={<Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((v) => !v)} />}>
            <SidebarComp {...sidebarProps} />
          </RemoteErrorBoundary>
        </div>

        {/* Mobile sidebar overlay */}
        {mobileMenuOpen && (
          <>
            <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed left-0 top-12 z-40 h-[calc(100vh-48px)] md:hidden">
              <RemoteErrorBoundary fallback={<Sidebar collapsed={false} onToggle={() => setMobileMenuOpen(false)} />}>
                <SidebarComp {...mobileSidebarProps} />
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
