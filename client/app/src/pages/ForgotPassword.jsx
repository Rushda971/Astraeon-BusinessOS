import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '../api/client';

const steps = [
  { label: 'Email', index: 1 },
  { label: 'Verification', index: 2 },
  { label: 'New Password', index: 3 },
];

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const activeStepLabel = useMemo(() => steps.find((item) => item.index === step)?.label || 'Email', [step]);

  const sendOtp = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await apiRequest('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSuccess(response.message || 'If an account exists, an OTP has been sent.');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Unable to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const proceedToReset = (event) => {
    event.preventDefault();
    setError('');
    setSuccess('OTP accepted. Set your new password.');
    setStep(3);
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, otp, password }),
      });
      setSuccess(response.message || 'Password reset successful.');
      setTimeout(() => navigate('/login', { state: { flash: 'Password reset successful. Please sign in.' } }), 1200);
    } catch (err) {
      setError(err.message || 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-shell auth-page-shell--compact">
      <div className="auth-card-wrap auth-card-wrap--compact">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="auth-card__header auth-card__header--centered">
            <span className="eyebrow">Recovery</span>
            <h2>Forgot Password</h2>
            <p>Enter your registered email and we'll send you a verification OTP.</p>
          </div>

          <div className="stepper" aria-label="Forgot password progress">
            {steps.map((item) => (
              <div key={item.index} className={`step ${step === item.index ? 'step--active' : step > item.index ? 'step--done' : ''}`}>
                <span>{String(item.index).padStart(2, '0')}</span>
                <small>{item.label}</small>
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={step}
              className="auth-form"
              onSubmit={step === 1 ? sendOtp : step === 2 ? proceedToReset : resetPassword}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {step === 1 && (
                <label>
                  <span>Email</span>
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@astraeon.com" required />
                </label>
              )}

              {step === 2 && (
                <label>
                  <span>Verification OTP</span>
                  <input type="text" value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="Enter 6-digit OTP" maxLength={6} required />
                </label>
              )}

              {step === 3 && (
                <>
                  <label>
                    <span>New Password</span>
                    <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Create a strong password" required />
                  </label>

                  <label>
                    <span>Confirm New Password</span>
                    <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat password" required />
                  </label>
                </>
              )}

              {error && <div className="form-message form-message--error">{error}</div>}
              {success && <div className="form-message form-message--success">{success}</div>}

              <button className="primary-button" type="submit" disabled={loading}>
                {loading ? 'Please wait...' : step === 1 ? 'Send OTP' : step === 2 ? 'Continue' : 'Reset Password'}
              </button>
            </motion.form>
          </AnimatePresence>

          <div className="auth-footer-row auth-footer-row--space">
            <Link to="/login">Back to login</Link>
            <strong>{activeStepLabel}</strong>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
