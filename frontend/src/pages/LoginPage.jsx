import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const DEMO_ACCOUNTS = [
  { name: 'Ava Johnson', email: 'ava@shopsphere.com', password: 'password123' },
  { name: 'Liam Smith', email: 'liam@shopsphere.com', password: 'password123' },
  { name: 'Noah Patel', email: 'noah@shopsphere.com', password: 'password123' },
  { name: 'Mia Garcia', email: 'mia@shopsphere.com', password: 'password123' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const fillAccount = (account) => setForm({ email: account.email, password: account.password });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(user.role === 'admin' ? '/admin' : from, { replace: true });
    } catch (err) {
      toast.error(err.userMessage || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>Login</h1>
        <p className="muted">Welcome back to ShopSphere</p>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            autoComplete="current-password"
          />
        </label>
        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
        <p className="auth-alt">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>

      <div className="demo-accounts">
        <p className="demo-title">Demo accounts — click to fill</p>
        <ul>
          {DEMO_ACCOUNTS.map((account) => (
            <li key={account.email}>
              <button type="button" className="demo-account" onClick={() => fillAccount(account)}>
                <span className="demo-name">{account.name}</span>
                <span className="demo-cred">
                  {account.email} · {account.password}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
