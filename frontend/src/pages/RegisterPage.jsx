import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setErrors({});
    setLoading(true);

    const result = await register(
      formData.username,
      formData.email,
      formData.password,
      formData.firstName,
      formData.lastName
    );

    if (result.success) {
      navigate('/chat');
    } else {
      setServerError(result.message);
      if (result.details) {
        setErrors(result.details);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-apple-bg px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white border border-apple-border rounded-lg shadow-lg p-8 slide-up">
          <h1 className="text-h2 text-apple-text mb-2 text-center">Create Account</h1>
          <p className="text-apple-secondary text-center mb-8">Join us today</p>

          {serverError && (
            <div className="bg-apple-danger/10 border border-apple-danger/30 text-apple-danger px-4 py-3 rounded-md mb-6">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-apple-text mb-1">First Name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full input text-sm ${errors.firstName ? 'border-apple-danger' : ''}`}
                  placeholder="First"
                />
                {errors.firstName && <p className="text-apple-danger text-xs mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-apple-text mb-1">Last Name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full input text-sm ${errors.lastName ? 'border-apple-danger' : ''}`}
                  placeholder="Last"
                />
                {errors.lastName && <p className="text-apple-danger text-xs mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-apple-text mb-1">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full input text-sm ${errors.email ? 'border-apple-danger' : ''}`}
                placeholder="name@example.com"
              />
              {errors.email && <p className="text-apple-danger text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-apple-text mb-1">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                className={`w-full input text-sm ${errors.username ? 'border-apple-danger' : ''}`}
                placeholder="username"
              />
              {errors.username && <p className="text-apple-danger text-xs mt-1">{errors.username}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-apple-text mb-1">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full input text-sm ${errors.password ? 'border-apple-danger' : ''}`}
                placeholder="••••••••"
              />
              {errors.password && <p className="text-apple-danger text-xs mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-3 font-semibold mt-4"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-apple-secondary">Already have an account?{' '}
              <Link to="/login" className="text-apple-accent hover:font-semibold transition-all">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}