import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { request, ApiError } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import type { AuthData } from '../types/api';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('demo@rotik.com');
  const [password, setPassword] = useState('password');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await request<{ data: AuthData }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setAuth(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during login.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white relative">
      {/* Top Language Selector */}
      <div className="absolute top-6 right-6 flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 space-x-1 text-xs font-medium">
        <button
          onClick={() => changeLanguage('pt-BR')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            i18n.language.startsWith('pt')
              ? 'bg-indigo-600 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🇧🇷 PT-BR
        </button>
        <button
          onClick={() => changeLanguage('en')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            i18n.language.startsWith('en')
              ? 'bg-indigo-600 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🇺🇸 EN
        </button>
      </div>

      <div className="w-full max-w-md space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-xl shadow-indigo-500/20">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            {t('auth.title')}
          </h1>
          <p className="text-sm text-slate-400">
            {t('auth.subtitle')}
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-8 backdrop-blur-xl shadow-2xl space-y-6">
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 flex items-start space-x-3" role="alert">
              <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-slate-300 mb-1.5">
                {t('auth.emailLabel')}
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                placeholder={t('auth.emailPlaceholder')}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-300 mb-1.5">
                {t('auth.passwordLabel')}
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/25 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t('auth.signingIn')}</span>
                </>
              ) : (
                <span>{t('auth.signIn')}</span>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials hint */}
          <div className="pt-4 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-500 font-mono">
              {t('auth.demoCredentials', { email: 'demo@rotik.com', password: 'password' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
