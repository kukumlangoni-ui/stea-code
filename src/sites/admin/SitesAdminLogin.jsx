import React, { useState } from 'react';

export default function SitesAdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      const { getFirebaseAuth, signInWithPopup, GoogleAuthProvider } = await import('../../firebase.js');
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError('Failed to sign in with Google.');
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    if (!showPassword) {
      setShowPassword(true);
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      const { getFirebaseAuth, signInWithEmailAndPassword } = await import('../../firebase.js');
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError('Invalid email or password.');
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email to reset password.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const { getFirebaseAuth, sendPasswordResetEmail } = await import('../../firebase.js');
      const auth = getFirebaseAuth();
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent.');
      setLoading(false);
    } catch (err) {
      setError('Failed to send reset email.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#05070a',
      backgroundImage: 'radial-gradient(circle at 50% -20%, rgba(245,166,35,0.15), transparent 60%)',
      fontFamily: 'system-ui, sans-serif',
      padding: 20
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        backgroundColor: 'rgba(10,14,23,.97)',
        borderRadius: 20,
        border: '1px solid rgba(255,255,255,.08)',
        padding: 32,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        textAlign: 'center'
      }}>
        <img src="/sites-icons/pwa-192x192.png" alt="STEA" style={{ width: 64, height: 64, borderRadius: 14, marginBottom: 24 }} />
        <h1 style={{ color: '#F0F2F5', fontSize: 24, margin: '0 0 8px 0', fontWeight: 600 }}>Admin Console</h1>
        <p style={{ color: 'rgba(255,255,255,.62)', fontSize: 14, margin: '0 0 32px 0' }}>Sign in to manage STEA</p>

        {error && <div style={{ backgroundColor: 'rgba(255,60,60,.1)', color: '#FF6B6B', padding: 12, borderRadius: 10, fontSize: 14, marginBottom: 24 }}>{error}</div>}
        {message && <div style={{ backgroundColor: 'rgba(245,166,35,.1)', color: '#F5A623', padding: 12, borderRadius: 10, fontSize: 14, marginBottom: 24 }}>{message}</div>}

        <button 
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: '100%', padding: '12px', borderRadius: 14, backgroundColor: '#F0F2F5', color: '#080B14',
            border: 'none', fontWeight: 600, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', color: 'rgba(255,255,255,.38)', fontSize: 13 }}>
          <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,.08)' }}></div>
          <span style={{ margin: '0 12px' }}>or</span>
          <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,.08)' }}></div>
        </div>

        <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 14, backgroundColor: 'rgba(255,255,255,.05)',
              border: '1px solid rgba(255,255,255,.08)', color: '#F0F2F5', outline: 'none', boxSizing: 'border-box'
            }}
          />
          {showPassword && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 14, backgroundColor: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.08)', color: '#F0F2F5', outline: 'none', boxSizing: 'border-box'
              }}
            />
          )}
          <button 
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px', borderRadius: 14, backgroundColor: '#F5A623', color: '#080B14',
              border: 'none', fontWeight: 600, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Please wait...' : (showPassword ? 'Sign In' : 'Continue with Email')}
          </button>
        </form>

        {showPassword && (
          <button 
            onClick={handleResetPassword}
            style={{
              background: 'none', border: 'none', color: '#F5A623', fontSize: 13, marginTop: 24, cursor: 'pointer', padding: 0
            }}
          >
            Forgot password?
          </button>
        )}
      </div>
    </div>
  );
}
