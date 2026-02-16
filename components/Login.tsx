import React, { useState } from 'react';
import { authService } from '../utils/auth';
import '../styles/Login.css';

interface LoginProps {
  onLoginSuccess: (user: { id: string; name: string; email: string }) => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const response = await authService.login({ email, password });
        authService.storeUser(response.user);
        onLoginSuccess(response.user);
      } else {
        const response = await authService.register({ name, email, password });
        authService.storeUser(response.user);
        onLoginSuccess(response.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-blue-300 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 8.463 19.123 4.293 12 0C4.877 4.293 2 8.463 2 12C2 17.5228 6.47715 22 12 22Z" />
            </svg>
          </div>
          <h1>HydroTime</h1>
        </div>
        <p className="subtitle">Controle sua hidratação diária</p>

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Nome</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                required={!isLogin}
                disabled={loading}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Aguarde...' : isLogin ? 'Entrar' : 'Registrar'}
          </button>
        </form>

        <div className="toggle-auth">
          <p>
            {isLogin ? 'Não tem conta? ' : 'Já tem conta? '}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              disabled={loading}
              className="toggle-button"
            >
              {isLogin ? 'Crie uma' : 'Entre aqui'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
