import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]     = useState({ username: '', email: '', password: '' });
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const set = key => e => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await register(form.username, form.email, form.password);
      if (res.data.status === 'unverified') {
        setSuccess('Check your email to verify your account before logging in.');
      } else {
        navigate('/login');
      }
    } catch (err) {
      const validationError = err.response?.data?.errors?.[0]?.msg;
      setError(validationError || err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 shadow-lg p-8">
        <h1 className="mb-6 text-2xl font-bold text-center text-gray-900 dark:text-white">Create Account</h1>
        {success ? (
          <p className="text-center text-green-600">{success}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              type="text"
              value={form.username}
              onChange={set('username')}
              hint="3-32 chars. Letters, numbers, dot, dash, underscore."
              autoFocus
              required
            />
            <Input label="Email" type="email" value={form.email} onChange={set('email')} required />
            <Input label="Password" type="password" value={form.password} onChange={set('password')} hint="Use at least 12 characters." required />
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <Button type="submit" loading={loading} className="w-full">Register</Button>
          </form>
        )}
        <p className="mt-4 text-center text-sm text-gray-500">
          Have an account? <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
