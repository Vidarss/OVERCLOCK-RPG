import React, { useState } from 'react';
import { TerminalInput } from './TerminalInput';
import type { AuthPlugin } from '../../plugins/AuthPlugin';

interface LoginScreenProps {
  authPlugin: AuthPlugin;
  onSwitchToRegister: () => void;
  onSwitchToReset: () => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'INVALID CREDENTIALS. CHECK YOUR USERNAME/EMAIL AND PASSWORD.',
  'Email not confirmed': 'CONFIRM YOUR EMAIL BEFORE LOGGING IN.',
  'User not found. Check your username.': 'USER NOT FOUND. CHECK YOUR USERNAME.',
};

function friendlyError(raw: string): string {
  return ERROR_MESSAGES[raw] ?? raw.toUpperCase();
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ authPlugin, onSwitchToRegister, onSwitchToReset }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const trimmed = email.trim();
    if (!trimmed || !password) return;
    setError('');
    setLoading(true);
    const { error: err } = await authPlugin.signIn(trimmed, password);
    setLoading(false);
    if (err) setError(friendlyError(err));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundImage: 'url(/overclock-character.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="w-full max-w-sm mx-4">
        {/* Spacer to push form down below the character art */}
        <div style={{ height: '38vh' }} />

        {/* Transparent login form positioned in the empty area */}
        <div
          style={{
            background: 'transparent',
            padding: '0 8px',
          }}
        >
          <div onKeyDown={handleKeyDown}>
            <TerminalInput
              label="USERNAME"
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="[ ENTER USERNAME ]"
            />

            <TerminalInput
              label="PASSWORD"
              value={password}
              onChange={setPassword}
              type="password"
              placeholder="[ ENTER PASSWORD ]"
            />
          </div>

          {error && (
            <div className="mb-4 font-pixel glow-red text-center" style={{ color: '#ff2222', fontSize: '8px', lineHeight: '1.8' }}>
              {'> ERROR: '}{error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full font-pixel mt-2"
            style={{
              background: loading ? 'rgba(0, 61, 66, 0.6)' : 'rgba(57, 255, 20, 0.15)',
              color: '#39ff14',
              padding: '14px',
              fontSize: '12px',
              letterSpacing: '4px',
              border: '2px solid rgba(57, 255, 20, 0.5)',
              textShadow: '0 0 10px #39ff14',
              boxShadow: '0 0 15px rgba(57, 255, 20, 0.3), inset 0 0 15px rgba(57, 255, 20, 0.1)',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'AUTHENTICATING...' : 'LOGIN'}
          </button>

          <div className="mt-4 flex flex-col items-center gap-2" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            <button
              onClick={onSwitchToReset}
              style={{ color: '#00f5ff', background: 'none', border: 'none', fontFamily: 'var(--font-mono)', cursor: 'pointer', textShadow: '0 0 8px #00f5ff' }}
            >
              Forgot Password?
            </button>
            <button
              onClick={onSwitchToRegister}
              style={{ color: '#00f5ff', background: 'none', border: 'none', fontFamily: 'var(--font-mono)', cursor: 'pointer', textShadow: '0 0 8px #00f5ff' }}
            >
              Create New Account
            </button>
          </div>

          {/* Press Start footer */}
          <div className="text-center mt-6 font-pixel" style={{ color: '#8a9aaa', fontSize: '11px', letterSpacing: '4px' }}>
            <span className="animate-blink">PRESS START</span>
          </div>
        </div>
      </div>
    </div>
  );
};
