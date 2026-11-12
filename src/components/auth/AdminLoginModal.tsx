import React, { useState } from 'react';
import { Shield, AlertCircle, X, Newspaper, Globe, Sparkles } from 'lucide-react';
import { authService } from '../../services/auth';
import { signInWithGoogle } from '../../services/firebase';
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
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Google Official Gmail Authentication ONLY
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signInWithGoogle();
      if (result.success && result.user) {
        const authRes = authService.loginWithGoogle(result.user);
        if (authRes.success) {
          toast.success(`Welcome back, ${authRes.user?.name || 'Administrator'}!`);
          onLoginSuccess();
        } else {
          setError(authRes.error || 'Authentication succeeded but user permissions could not be loaded.');
        }
      } else {
        setError(result.error || 'Google Sign-In was cancelled or failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Google authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 text-white p-6 relative">
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
              <p className="text-xs text-sky-200 font-medium">Official Editorial Staff & Admin Portal</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
            এই অ্যাডমিন প্যানেলে শুধুমাত্র গুগলের অফিসিয়াল Gmail অ্যাকাউন্ট দিয়ে সরাসরি লগইন করা যাবে।
          </p>
          <div className="mt-2.5 flex items-center gap-2 text-[10px] text-sky-300 bg-sky-950/70 border border-sky-800/60 px-2.5 py-1 rounded-lg">
            <Globe className="w-3 h-3 text-sky-400 shrink-0" />
            <span className="font-mono truncate">Firebase: alif-nwes-24.firebaseapp.com</span>
          </div>
        </div>

        {/* Content Body - Pure Google Sign-In ONLY */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs space-y-1.5">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <span className="font-semibold">{error}</span>
              </div>
              {error.includes('authorized') && (
                <p className="text-[11px] text-red-600 pl-6 leading-relaxed">
                  💡 <strong>ডোমেইন অনুমতি টিপ:</strong> Firebase Console -&gt; <strong>Authentication</strong> -&gt; <strong>Settings</strong> -&gt; <strong>Authorized domains</strong>-এ গিয়ে আপনার বর্তমান ডোমেইন বা প্রিভিউ লিংকটি যুক্ত করুন।
                </p>
              )}
            </div>
          )}

          {/* Primary Action: Official Google Sign-In Button */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-bold text-sm rounded-xl border-2 border-slate-200 hover:border-slate-400 shadow-sm flex items-center justify-center gap-3 transition-all hover:shadow-md cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin shrink-0" />
              ) : (
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              )}
              <span>
                {isLoading ? 'Connecting to Google...' : 'Sign in with Google (Gmail)'}
              </span>
            </button>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Google Verified Single Sign-On (SSO)</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                আপনার অফিসিয়াল জিমেইল দিয়ে সাইন ইন করলে স্বয়ংক্রিয়ভাবে আপনার নাম, ছবি ও অথোরাইজড অ্যাডমিন রোল লোড হয়ে যাবে।
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-3">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-sky-500" />
              Firebase OAuth 2.0 Security
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              ← Back to Website
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
