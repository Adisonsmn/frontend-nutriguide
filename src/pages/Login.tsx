import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { loginUser } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';

export const Login = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  // Form values
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleBlur = (field: string) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  // Validation Logic
  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isValidPhone = (value: string) => /^(\+62|62|0)[0-9]{8,13}$/.test(value);
  const isEmailOrPhoneValid = isValidEmail(emailOrPhone) || isValidPhone(emailOrPhone);

  const isFormValid = isEmailOrPhoneValid && password.length > 0;

  const getBorderClass = (fieldName: string, isValid: boolean, value: string) => {
    if (!touchedFields[fieldName] || value.length === 0) return 'border-gray-200';
    return isValid ? 'border-green-500' : 'border-red-500';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isLoading) return;

    setIsLoading(true);

    try {
      const result = await loginUser(emailOrPhone.trim(), password);

      // Bug #8: Access token goes directly into Zustand memory (no localStorage/sessionStorage).
      // The refresh token is set as an HTTP-only cookie by the server automatically.
      setAuth(result.data.user, result.data.accessToken);

      // Bug #23: If "Remember me" is unchecked, remove the persisted Zustand state
      // so the session doesn't survive a browser restart.
      if (!rememberMe) {
        localStorage.removeItem('auth-storage');
      }

      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401) {
          toast.error('Login Failed, check email or phone number and password');
        } else {
          toast.error('An error occurred. Please try again.');
        }
      } else {
        toast.error('Cannot connect to the server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 opacity-0 animate-fade-in">
      <div className="max-w-lg mx-auto">
        <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 text-sm transition-colors">
          <ArrowLeft size={16} />
          Back to Welcome
        </Link>

        <div className="bg-white rounded-2xl p-8 md:p-10 border border-gray-100 shadow-sm">
          <h1 className="text-3xl font-bold text-primary text-center mb-2">Welcome Back</h1>
          <p className="text-gray-400 text-center mb-8">Log in to continue your nutrition journey</p>

          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block font-semibold text-sm text-foreground mb-2">Email or Phone Number</label>
              <input
                type="text"
                placeholder="Enter your email or phone number"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                onBlur={() => handleBlur('emailOrPhone')}
                className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm placeholder-gray-400 transition-colors ${getBorderClass(
                  'emailOrPhone',
                  isEmailOrPhoneValid,
                  emailOrPhone
                )}`}
              />
              {touchedFields.emailOrPhone && emailOrPhone.length > 0 && !isEmailOrPhoneValid && (
                <p className="text-red-500 text-xs mt-1">Email atau nomor HP tidak valid</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block font-semibold text-sm text-foreground mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-12 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm placeholder-gray-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mb-8">
              <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300" 
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-sm text-primary font-semibold hover:underline">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className={`w-full py-3 rounded-full font-semibold text-white text-lg transition-all duration-300 ${
                isFormValid
                  ? 'bg-blue-medium hover:bg-[hsl(220,55%,45%)] hover:shadow-lg cursor-pointer opacity-100'
                  : 'bg-blue-medium/50 cursor-not-allowed opacity-60'
              }`}
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>
          </form>



          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
