import { ArrowLeft, LogIn, UserPlus } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { AuthUser } from '../types/marketplace';

interface AuthViewProps {
  onCancel: () => void;
  onAuthenticated: (user: AuthUser) => void;
}

export function AuthView({ onCancel, onAuthenticated }: AuthViewProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload =
        mode === 'login'
          ? { email, password }
          : { name, email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { user?: AuthUser; error?: string };
      if (!res.ok || !data.user) {
        setError(data.error || 'Não foi possível concluir a autenticação.');
        return;
      }

      onAuthenticated(data.user);
    } catch {
      setError('Erro de comunicação com o servidor. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-md px-5">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 text-xs font-medium text-[#A8A29E] hover:text-[#D4AF37]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Diretório
        </button>

        <div className="mt-5 rounded-2xl border border-[#D4AF37]/25 bg-[#121216] p-6 md:p-8">
          <p className="text-xs font-medium tracking-wide text-[#D4AF37]">
            Acesso de Utilizadores &amp; Equipa
          </p>
          <h1 className="mt-1.5 font-display text-2xl font-semibold text-[#F5F2EB]">
            {mode === 'login' ? 'Entrar na Plataforma' : 'Criar Conta Omuwa-Huíla'}
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-[#A8A29E]">
            {mode === 'login'
              ? 'Inicie sessão para gerir os seus cadastros ou aceder ao painel se tiver perfil de Administrador ou Gestor.'
              : 'Crie a sua conta gratuita para registar empresas ou serviços profissionais na Província da Huíla.'}
          </p>

          {/* Segmented Switch */}
          <div
            role="tablist"
            aria-label="Modo de autenticação"
            className="mt-6 grid grid-cols-2 gap-1 rounded-lg border border-white/10 bg-[#09090B] p-1"
          >
            <button
              role="tab"
              type="button"
              aria-selected={mode === 'login'}
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`rounded-md py-2 text-xs font-semibold transition-colors ${
                mode === 'login'
                  ? 'bg-[#D4AF37] text-[#09090B]'
                  : 'text-[#A8A29E] hover:text-[#F5F2EB]'
              }`}
            >
              Entrar
            </button>
            <button
              role="tab"
              type="button"
              aria-selected={mode === 'register'}
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`rounded-md py-2 text-xs font-semibold transition-colors ${
                mode === 'register'
                  ? 'bg-[#D4AF37] text-[#09090B]'
                  : 'text-[#A8A29E] hover:text-[#F5F2EB]'
              }`}
            >
              Registar Conta
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-lg border border-red-500/40 bg-red-950/30 px-3.5 py-2.5 text-xs text-red-200"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {mode === 'register' && (
              <div>
                <label htmlFor="auth-name" className="block text-xs font-semibold text-[#F5F2EB]">
                  Nome Completo *
                </label>
                <input
                  id="auth-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F2EB] placeholder:text-[#78716C] focus:border-[#D4AF37] focus:outline-none min-h-[44px]"
                />
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-xs font-semibold text-[#F5F2EB]">
                E-mail *
              </label>
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@exemplo.ao"
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F2EB] placeholder:text-[#78716C] focus:border-[#D4AF37] focus:outline-none min-h-[44px]"
              />
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="block text-xs font-semibold text-[#F5F2EB]"
              >
                Palavra-passe *
              </label>
              <input
                id="auth-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F2EB] placeholder:text-[#78716C] focus:border-[#D4AF37] focus:outline-none min-h-[44px]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-[#09090B] hover:bg-[#E5C158] disabled:opacity-50 min-h-[44px]"
            >
              {mode === 'login' ? (
                <>
                  <LogIn className="h-4 w-4" />
                  {isSubmitting ? 'A entrar...' : 'Entrar na Conta'}
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  {isSubmitting ? 'A criar conta...' : 'Criar Conta'}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
