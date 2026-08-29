import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import BrandPanel from '../components/BrandPanel';
import { apiRequest } from '../api/client';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpRequired, setOtpRequired] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
        }),
      });

      setSuccess(response.message || 'Check your email for your verification OTP.');
      setOtpRequired(true);
    } catch (err) {
      setError(err.message || 'Unable to create account.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiRequest('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email: form.email, otp }),
      });
      navigate('/login', { state: { flash: 'Email verified successfully. Please sign in.' } });
    } catch (err) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-shell">
      <BrandPanel
        eyebrow="ASTRAEON"
        title="One intelligent workspace for your entire business."
        description="From reservations to inventory, teams, and performance — everything moves with the same premium rhythm."
      />

      <motion.section
        className="auth-card-wrap"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <div className="auth-card auth-card--wide">
          <div className="auth-card__header">
            <span className="eyebrow">Create account</span>
            <h2>Create your account</h2>
          </div>

          {!otpRequired ? (
            <form className="auth-form" onSubmit={handleRegister}>
              <label>
                <span>Full Name</span>
                <input name="fullName" type="text" value={form.fullName} onChange={handleChange} placeholder="Rushda Ali" required />
              </label>

              <label>
                <span>Email</span>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@astraeon.com" required />
              </label>

              <label>
                <span>Password</span>
                <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="At least 8 characters" required />
              </label>

              <label>
                <span>Confirm Password</span>
                <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="Repeat your password" required />
              </label>

              {error && <div className="form-message form-message--error">{error}</div>}
              {success && <div className="form-message form-message--success">{success}</div>}

              <button className="primary-button" type="submit" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleVerifyOtp}>
              <div className="form-message form-message--success">
                Check your email for your verification OTP.
              </div>

              <label>
                <span>Verification OTP</span>
                <input type="text" value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="Enter 6-digit OTP" maxLength={6} required />
              </label>

              {error && <div className="form-message form-message--error">{error}</div>}

              <button className="primary-button" type="submit" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify email'}
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() => apiRequest('/api/auth/resend-otp', { method: 'POST', body: JSON.stringify({ email: form.email }) }).then(() => setSuccess('A fresh OTP has been sent.')).catch((err) => setError(err.message || 'Unable to resend OTP.'))}
              >
                Resend OTP
              </button>
            </form>
          )}

          <p className="auth-switcher">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </motion.section>
    </div>
  );
}
