import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { BrandLogo } from '../components/branding/BrandLogo';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identifier, password);
      navigate('/dashboard');
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) setError('Too many attempts. Please wait before trying again.');
      else if (status === 423) setError('Account locked. Try again later.');
      else setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 shadow-lg p-8">
        <div className="mb-6 flex justify-center">
          <BrandLogo size="lg" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Username or email"
            type="text"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            autoFocus
            required
          />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">Sign in</Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          No account? <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
