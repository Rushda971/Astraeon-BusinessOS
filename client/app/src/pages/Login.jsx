import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { apiRequest, setToken } from '../api/client';
import BrandPanel from '../components/BrandPanel';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(res.data.token);
      setUser(res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-shell">
      <BrandPanel
        eyebrow="ASTRAEON"
        title="A better way to run every service."
        description="Bring your team, menu, and daily operations together in one clear workspace."
      />

      <motion.section
        className="auth-card-wrap"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <div className="auth-card">
          <div className="auth-card__header">
            <span className="eyebrow">Welcome back</span>
            <h2>Welcome back</h2>
          </div>

          {location.state?.flash && <div className="form-message form-message--success">{location.state.flash}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              <span>Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@astraeon.com" required />
            </label>

            <label>
              <span>Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
            </label>

            <div className="auth-form__row">
              <label className="checkbox-row">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            {error && <div className="form-message form-message--error">{error}</div>}

            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="auth-switcher">
            Don't have an account? <Link to="/signup">Create account</Link>
          </p>
        </div>
      </motion.section>
    </div>
  );
}
