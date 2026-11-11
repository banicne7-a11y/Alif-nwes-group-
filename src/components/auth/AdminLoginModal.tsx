import React, { useState } from 'react';
import { Lock, Shield, Eye, EyeOff, CheckCircle2, AlertCircle, X, Sparkles, Newspaper } from 'lucide-react';
import { authService } from '../../services/auth';
import { toast } from '../../services/toast';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('banicne7@gmail.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      const res = authService.login(email, password, rememberMe);
      setIsLoading(false);

      if (res.success) {
        toast.success(`Welcome back, ${res.user?.name || 'Administrator'}!`);
        onLoginSuccess();
      } else {
        setError(res.error || 'Invalid credentials. Please verify your email or password.');
      }
    }, 300);
  };

  const handleQuickDemoLogin = () => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      const res = authService.login('banicne7@gmail.com', 'admin123', true);
      setIsLoading(false);
      if (res.success) {
        toast.success('Signed in as Lead Administrator!');
        onLoginSuccess();
      }
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-white">ALIF NEWS 24</span>
                <span className="px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-extrabold uppercase rounded-sm">
                  CMS
                </span>
              </div>
              <p className="text-xs text-sky-200 font-medium">Editorial Staff & Admin Login</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
            নিউজ রুম ও অ্যাডমিন প্যানেলে প্রবেশের জন্য আপনার অথোরাইজড ক্রিডেনশিয়াল দিয়ে সাইন ইন করুন।
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick 1-Click Access for Admin */}
          <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-sky-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                Quick Admin Sign In
              </span>
              <span className="text-[10px] font-semibold text-sky-700 bg-sky-200/60 px-2 py-0.5 rounded-full">
                Lead Admin
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              ক্লিক করলেই সরাসরি মূল অ্যাডমিন হিসেবে ড্যাশবোর্ডে প্রবেশ করতে পারবেন:
            </p>
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              disabled={isLoading}
              className="w-full py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>⚡ One-Click Admin Sign In</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-slate-400 font-bold shrink-0">
              Or Sign In With Email
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Admin Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@alifnews24.com"
                className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-slate-50/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
                />
                <span>Remember this session</span>
              </label>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-500" />
                2FA Protected
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Log In to Admin Panel</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              ← Return to Alif News 24 Public Website
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
