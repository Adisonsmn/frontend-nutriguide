import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { forgotPassword } from '../api/auth.api';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail || isLoading) return;

    setIsLoading(true);
    try {
      const response = await forgotPassword(email.trim());
      
      // Bug #1: OTP is no longer returned to the client — just show success
      toast.success(response.data.message || 'OTP has been sent to your email! Check your inbox.', { duration: 5000 });

      localStorage.setItem('resetEmail', email.trim());
      navigate('/reset-password');
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        toast.error('Email not found. Please check your email address.');
      } else {
        toast.error('Failed to process request. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center animate-fade-in">
      <div className="max-w-md w-full">
        <Link to="/login" className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 text-sm transition-colors">
          <ArrowLeft size={16} />
          Back to Login
        </Link>

        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <h1 className="text-2xl font-bold text-primary text-center mb-2">Forgot Password</h1>
          <p className="text-gray-500 text-sm text-center mb-6">
            Enter your email address and we'll send you an OTP to reset your password.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block font-semibold text-sm text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm transition-colors ${
                  email.length > 0
                    ? isValidEmail
                      ? 'border-green-500 focus:border-green-500'
                      : 'border-red-500 focus:border-red-500'
                    : 'border-gray-200 focus:border-primary'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={!isValidEmail || isLoading}
              className={`w-full py-3 rounded-full font-semibold text-white transition-all duration-300 ${
                isValidEmail
                  ? 'bg-blue-medium hover:bg-[hsl(220,55%,45%)] hover:shadow-lg cursor-pointer'
                  : 'bg-blue-medium/50 cursor-not-allowed'
              }`}
            >
              {isLoading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
