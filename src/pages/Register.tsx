import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { registerUser, loginUser } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';

export const Register = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  // Form values
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleBlur = (field: string) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  // Validation Logic
  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isValidPhone = (value: string) => /^(\+62|62|0)[0-9]{8,13}$/.test(value);
  const isEmailOrPhoneValid = isValidEmail(emailOrPhone) || isValidPhone(emailOrPhone);

  const passwordChecks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const isConfirmPasswordValid = confirmPassword === password && confirmPassword.length > 0;

  const isFormValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    isEmailOrPhoneValid &&
    isPasswordValid &&
    isConfirmPasswordValid;

  const getBorderClass = (fieldName: string, isValid: boolean, value: string) => {
    if (!touchedFields[fieldName] || value.length === 0) return 'border-gray-200';
    return isValid ? 'border-green-500' : 'border-red-500';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isLoading) return;

    setIsLoading(true);

    try {
      const name = `${firstName.trim()} ${lastName.trim()}`;
      await registerUser(name, emailOrPhone.trim(), password);

      // Bug #14: Auto-login after registration — no need to redirect to /login
      const loginResult = await loginUser(emailOrPhone.trim(), password);
      setAuth(loginResult.data.user, loginResult.data.accessToken);

      toast.success('Registration successful! Let\'s set up your profile.');
      navigate('/profile');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;
        if (error.response?.status === 409) {
          toast.error('Email/Phone Number already registered');
        } else if (message) {
          toast.error(message);
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
          <h1 className="text-3xl font-bold text-primary text-center mb-2">Create Account</h1>
          <p className="text-gray-400 text-center mb-8">Join Nutri Guide to start your health journey</p>

          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block font-semibold text-sm text-foreground mb-2">First Name</label>
              <input
                type="text"
                placeholder="Enter your first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm placeholder-gray-400 transition-colors"
              />
            </div>

            <div className="mb-5">
              <label className="block font-semibold text-sm text-foreground mb-2">Last Name</label>
              <input
                type="text"
                placeholder="Enter your last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm placeholder-gray-400 transition-colors"
              />
            </div>

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

            <div className="mb-5">
              <label className="block font-semibold text-sm text-foreground mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur('password')}
                  className={`w-full pr-12 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm placeholder-gray-400 transition-colors ${getBorderClass(
                    'password',
                    isPasswordValid,
                    password
                  )}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {touchedFields.password && password.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs">
                  <li className={passwordChecks.minLength ? 'text-green-500' : 'text-red-500'}>
                    {passwordChecks.minLength ? '✓' : '✗'} Minimal 8 karakter
                  </li>
                  <li className={passwordChecks.hasUppercase ? 'text-green-500' : 'text-red-500'}>
                    {passwordChecks.hasUppercase ? '✓' : '✗'} Mengandung huruf besar
                  </li>
                  <li className={passwordChecks.hasLowercase ? 'text-green-500' : 'text-red-500'}>
                    {passwordChecks.hasLowercase ? '✓' : '✗'} Mengandung huruf kecil
                  </li>
                  <li className={passwordChecks.hasNumber ? 'text-green-500' : 'text-red-500'}>
                    {passwordChecks.hasNumber ? '✓' : '✗'} Mengandung angka
                  </li>
                </ul>
              )}
            </div>

            <div className="mb-8">
              <label className="block font-semibold text-sm text-foreground mb-2">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  className={`w-full pr-12 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm placeholder-gray-400 transition-colors ${getBorderClass(
                    'confirmPassword',
                    isConfirmPasswordValid,
                    confirmPassword
                  )}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {touchedFields.confirmPassword && confirmPassword.length > 0 && !isConfirmPasswordValid && (
                <p className="text-red-500 text-xs mt-1">Password tidak sama</p>
              )}
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
              {isLoading ? 'Signing up...' : 'Sign Up'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
