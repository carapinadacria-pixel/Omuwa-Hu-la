import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { BRAND_LOGO_URL } from '../data/huilaCatalog';
import { AuthUser } from '../types/marketplace';
import { canAccessAdminPanel } from '../utils/authRules';

export type ActiveSection = 'home' | 'register' | 'admin' | 'auth';

interface NavbarProps {
  activeView: ActiveSection;
  onNavigateView: (view: ActiveSection, sectionId?: string) => void;
  pendingCount: number;
  currentUser: AuthUser | null;
  onLogout: () => void;
}

export function Navbar({
  activeView,
  onNavigateView,
  pendingCount,
  currentUser,
  onLogout,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const showAdminTab = canAccessAdminPanel(currentUser?.role);

  const handleLink = (view: ActiveSection, sectionId?: string) => {
    setMobileOpen(false);
    onNavigateView(view, sectionId);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#09090B]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-8 px-5 py-3 md:px-8">
        {/* Zone 1: Brand Logo + Single-line Wordmark */}
        <a
          href="#topo"
          onClick={(e) => {
            e.preventDefault();
            handleLink('home', 'topo');
          }}
          className="inline-flex items-center gap-3 font-display text-xl font-semibold tracking-tight text-[#F5F2EB] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
        >
          <img
            src={BRAND_LOGO_URL}
            alt="Logotipo Omuwa-Huíla"
            className="h-9 w-9 rounded-full border border-[#D4AF37]/60 object-cover shrink-0"
          />
          <span>
            Omuwa-<span className="text-[#D4AF37]">Huíla</span>
          </span>
        </a>

        {/* Zone 2: Concise single-line nav links (Admin tab hidden unless admin/gestor) */}
        <nav
          aria-label="Navegação principal"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-[#A8A29E]"
        >
          <button
            type="button"
            onClick={() => handleLink('home', 'destaques')}
            className="py-1.5 border-b-2 border-transparent hover:border-[#D4AF37] hover:text-[#F5F2EB] transition-colors whitespace-nowrap shrink-0"
          >
            Destaques
          </button>
          <button
            type="button"
            onClick={() => handleLink('home', 'explorar')}
            className="py-1.5 border-b-2 border-transparent hover:border-[#D4AF37] hover:text-[#F5F2EB] transition-colors whitespace-nowrap shrink-0"
          >
            Explorar
          </button>
          <button
            type="button"
            onClick={() => handleLink('home', 'novidades')}
            className="py-1.5 border-b-2 border-transparent hover:border-[#D4AF37] hover:text-[#F5F2EB] transition-colors whitespace-nowrap shrink-0"
          >
            Novidades
          </button>
          <button
            type="button"
            onClick={() => handleLink('home', 'planos')}
            className="py-1.5 border-b-2 border-transparent hover:border-[#D4AF37] hover:text-[#F5F2EB] transition-colors whitespace-nowrap shrink-0"
          >
            Planos
          </button>

          {showAdminTab && (
            <button
              type="button"
              onClick={() => handleLink('admin')}
              className={`py-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'admin'
                  ? 'border-[#D4AF37] text-[#D4AF37]'
                  : 'border-transparent text-[#D4AF37]/90 hover:border-[#D4AF37] hover:text-[#D4AF37]'
              }`}
            >
              Painel Admin{pendingCount > 0 ? ` (${pendingCount})` : ''}
            </button>
          )}

          {!currentUser ? (
            <button
              type="button"
              onClick={() => handleLink('auth')}
              className={`py-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'auth'
                  ? 'border-[#D4AF37] text-[#D4AF37]'
                  : 'border-transparent hover:border-[#D4AF37] hover:text-[#F5F2EB]'
              }`}
            >
              Login
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onLogout();
              }}
              aria-label={`Terminar sessão de ${currentUser.name}`}
              className="inline-flex items-center gap-1.5 py-1.5 border-b-2 border-transparent hover:border-[#D4AF37] hover:text-[#F5F2EB] transition-colors whitespace-nowrap shrink-0"
            >
              <span className="max-w-[140px] truncate text-[#E7E5E4]">{currentUser.name}</span>
              <LogOut className="h-3.5 w-3.5 text-[#D4AF37]" />
            </button>
          )}
        </nav>

        {/* Zone 3: 1 primary CTA + mobile drawer button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleLink('register')}
            className="hidden sm:inline-flex items-center justify-center rounded-lg bg-[#D4AF37] px-4 py-2.5 text-sm font-semibold text-[#09090B] hover:bg-[#E5C158] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5E6B3]"
          >
            Cadastrar Serviço
          </button>
          <button
            type="button"
            aria-label={mobileOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex md:hidden items-center justify-center rounded-lg border border-white/15 p-2 text-[#F5F2EB] hover:border-[#D4AF37]/60 min-h-[40px] min-w-[40px]"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div className="border-t border-white/[0.08] bg-[#0F0F12] px-5 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => handleLink('home', 'destaques')}
              className="w-full text-left py-2.5 text-sm font-medium text-[#E7E5E4] hover:text-[#D4AF37]"
            >
              Destaques
            </button>
            <button
              type="button"
              onClick={() => handleLink('home', 'explorar')}
              className="w-full text-left py-2.5 text-sm font-medium text-[#E7E5E4] hover:text-[#D4AF37]"
            >
              Explorar Diretório
            </button>
            <button
              type="button"
              onClick={() => handleLink('home', 'novidades')}
              className="w-full text-left py-2.5 text-sm font-medium text-[#E7E5E4] hover:text-[#D4AF37]"
            >
              Novidades
            </button>
            <button
              type="button"
              onClick={() => handleLink('home', 'planos')}
              className="w-full text-left py-2.5 text-sm font-medium text-[#E7E5E4] hover:text-[#D4AF37]"
            >
              Planos Normal &amp; Premium
            </button>

            {showAdminTab && (
              <button
                type="button"
                onClick={() => handleLink('admin')}
                className="w-full text-left py-2.5 text-sm font-medium text-[#D4AF37]"
              >
                Painel Admin ({pendingCount} pendentes)
              </button>
            )}

            {!currentUser ? (
              <button
                type="button"
                onClick={() => handleLink('auth')}
                className="w-full text-left py-2.5 text-sm font-medium text-[#D4AF37]"
              >
                Login / Registar Conta
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onLogout();
                }}
                className="w-full text-left py-2.5 text-sm font-medium text-[#A8A29E] hover:text-[#F5F2EB]"
              >
                Sair ({currentUser.name})
              </button>
            )}

            <button
              type="button"
              onClick={() => handleLink('register')}
              className="mt-3 w-full rounded-lg bg-[#D4AF37] px-4 py-3 text-center text-sm font-semibold text-[#09090B]"
            >
              Cadastrar Serviço
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
