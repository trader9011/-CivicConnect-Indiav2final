import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { toast } from "sonner";

import { useAuth } from "../components/AuthProvider";
import { PremiumInlineLoader } from '../components/ui/PremiumLoader';

export default function Login() {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  React.useEffect(() => {
    if (currentUser) {
      navigate(redirectUrl);
    }
  }, [currentUser, navigate, redirectUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Successfully logged in!");
      navigate(redirectUrl);
    } catch (error: any) {
      toast.error(error.message || "Failed to log in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Successfully logged in!");
      navigate(redirectUrl);
    } catch (error: any) {
      if (error.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        toast.error(`Unauthorized Domain! You MUST add this exact domain to Firebase: ${domain}`, { duration: 10000 });
        console.error("UNAUTHORIZED DOMAIN:", domain);
        console.error("Please add this to Firebase Authentication -> Settings -> Authorized Domains.");
      } else {
        toast.error(error.message || "Failed to log in with Google");
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 flex flex-col justify-center bg-gray-50 dark:bg-background relative overflow-hidden font-ui">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-brand-royal/5 blur-3xl" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-brand-saffron/5 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10 flex justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[440px]"
        >
          <div className="text-center mb-10">
            <Link to="/" className="inline-flex items-center justify-center p-3 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 mb-6 hover:scale-105 transition-transform">
              <ShieldCheck className="w-8 h-8 text-brand-royal" />
            </Link>
            <h1 className="text-3xl font-heading font-bold text-brand-navy dark:text-white mb-3">
              Welcome Back
            </h1>
            <p className="text-muted-foreground">
              Sign in to manage your complaints and track their resolution status.
            </p>
          </div>

          <div className="bg-white dark:bg-brand-navy p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800">
            
            <button 
              type="button" 
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-brand-navy dark:text-white font-semibold py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <div className="my-8 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-brand-navy text-muted-foreground font-medium">OR</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-brand-navy dark:text-gray-300">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand-royal transition-colors" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-brand-royal focus:border-transparent outline-none transition-all dark:text-white font-medium" 
                    placeholder="Enter your email" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-brand-navy dark:text-gray-300">Password</label>
                  <Link to="#" className="text-sm font-medium text-brand-royal hover:text-blue-700 transition-colors">Forgot password?</Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand-royal transition-colors" />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-brand-royal focus:border-transparent outline-none transition-all dark:text-white font-medium" 
                    placeholder="••••••••" 
                  />
                </div>
              </div>

              <div className="flex items-center pt-2">
                <input 
                  type="checkbox" 
                  id="remember" 
                  className="w-4 h-4 rounded border-gray-300 text-brand-royal focus:ring-brand-royal cursor-pointer" 
                />
                <label htmlFor="remember" className="ml-2 text-sm text-muted-foreground cursor-pointer">
                  Remember me for 30 days
                </label>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-brand-navy hover:bg-brand-royal text-white py-4 rounded-xl font-bold transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-4 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <>
                    <PremiumInlineLoader /> Verifying Secure Session...
                  </>
                ) : (
                  <>Sign In <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </div>

          <p className="text-center mt-8 text-muted-foreground text-sm">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-brand-royal hover:text-blue-700 transition-colors">
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
