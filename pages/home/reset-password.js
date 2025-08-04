// pages/reset-password.js - Clean Password Reset Page
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function ResetPassword() {
  const router = useRouter();
  const { oobCode, mode } = router.query;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validCode, setValidCode] = useState(false);

  useEffect(() => {
    if (oobCode && mode === 'resetPassword') {
      verifyResetCode();
    }
  }, [oobCode, mode]);

  const verifyResetCode = async () => {
    try {
      const email = await verifyPasswordResetCode(auth, oobCode);
      setEmail(email);
      setValidCode(true);
    } catch (error) {
      setError('This password reset link is invalid or has expired.');
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
    } catch (error) {
      setError('Failed to reset password. Please try again.');
    }
    
    setLoading(false);
  };

  if (!oobCode || mode !== 'resetPassword') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Invalid Reset Link</h2>
          <p>This password reset link is invalid or missing.</p>
          <button onClick={() => router.push('/sign-in')}>Back to Sign In</button>
        </div>
      </div>
    );
  }

  if (!validCode) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Verifying reset link...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Password Reset Successful!</h2>
          <p>You can now sign in with your new password.</p>
          <button onClick={() => router.push('/sign-in')}>Sign In Now</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Reset Password - Lux Libris</title>
      </Head>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ maxWidth: '400px', width: '100%', padding: '2rem', background: 'white', borderRadius: '1rem' }}>
          <h1>Reset Password</h1>
          <p>Enter a new password for {email}</p>
          
          <form onSubmit={handlePasswordReset}>
            <div style={{ marginBottom: '1rem' }}>
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                required
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                required
              />
            </div>

            {error && (
              <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" onClick={() => router.push('/sign-in')} disabled={loading}>
                Cancel
              </button>
              <button type="submit" disabled={loading || !newPassword || !confirmPassword}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}