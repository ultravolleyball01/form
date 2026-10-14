import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  LayoutDashboard,
  ClipboardList,
  FormInput,
  Users,
  Ruler,
  Shirt,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';

interface AdminLayoutProps {
  currentPath: string;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ currentPath, children }) => {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const data = await api.getAdminMe();
      setAdminUser(data.user);
    } catch (err) {
      window.location.href = '/admin/login';
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.adminLogout();
    window.location.href = '/admin/login';
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Inscrições', path: '/admin/inscricoes', icon: ClipboardList },
    { label: 'Formulário', path: '/admin/formulario', icon: FormInput },
    { label: 'Turmas', path: '/admin/turmas', icon: Users },
    { label: 'Tamanhos', path: '/admin/tamanhos', icon: Ruler },
    { label: 'Camisetas', path: '/admin/camisas', icon: Shirt },
    { label: 'Configurações', path: '/admin/configuracoes', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-sm font-bold text-slate-500 animate-pulse">Carregando painel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden bg-blue-950 text-white px-4 py-3 flex items-center justify-between border-b border-blue-900 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏐</span>
          <span className="font-black text-sm uppercase tracking-wider text-white">
            Ultra Admin
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Desktop & Mobile */}
      <aside
        className={`fixed md:sticky top-0 left-0 bottom-0 z-30 w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col transition-transform duration-200 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-md">
            🏐
          </div>
          <div>
            <h2 className="font-black tracking-tight text-white uppercase text-base leading-none">
              Ultra Volley
            </h2>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 mt-0.5 block">
              Gestão de Camisetas
            </span>
          </div>
        </div>

        {/* Navigation (Rule 62) */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              currentPath === item.path ||
              (item.path !== '/admin' && currentPath.startsWith(item.path));
            const Icon = item.icon;
            return (
              <a
                key={item.path}
                href={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Public view shortcut */}
        <div className="px-3 py-2 border-t border-slate-800/80">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 transition-colors"
          >
            <span>Ver Formulário Público</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Admin User info & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-xs font-bold text-white truncate">
              {adminUser?.name || 'Administrador'}
            </p>
            <p className="text-[10px] text-slate-500 font-mono">@{adminUser?.username || 'admin'}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sair do painel"
            className="p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
};
