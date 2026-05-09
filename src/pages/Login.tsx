import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, ArrowRight, Loader2, UserPlus, LogIn } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

interface LoginProps {
  onLogin: (role: 'admin' | 'user') => void;
}

export default function Login({ onLogin }: LoginProps) {
  const { t } = useLanguage();
  const { user, login, logout, loading: authLoading } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Django Admin Login (Special Case)
    if (isLoginMode && email === 'admin') {
      try {
        const response = await axios.post('http://localhost:8000/api/token/', {
          username: email,
          password: password
        });
        // Pass both access AND refresh tokens so expired sessions auto-renew
        login(response.data.access, email, response.data.refresh);
        toast.success('Admin logged in successfully!');
        onLogin('admin');
      } catch (err: any) {
        setError('Invalid Admin credentials.');
        toast.error('Authentication failed');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Firebase Auth for Regular Users
    try {
      if (isLoginMode) {
        // Firebase Login
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Logged in successfully!');
        onLogin('user');
      } else {
        // Firebase Sign Up
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('Account created successfully!');
        onLogin('user');
      }
    } catch (err: any) {
      console.error("Firebase Auth error:", err);
      const errorCode = err.code;
      
      if (errorCode === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else if (errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found' || errorCode === 'auth/invalid-credential') {
        setError('Invalid email or password. Please check your credentials.');
      } else if (errorCode === 'auth/weak-password') {
        setError('Password is too weak. It should be at least 6 characters.');
      } else if (errorCode === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError('Authentication failed. Please try again or contact support.');
      }
      toast.error('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (user && !authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-beige">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=2000" 
            alt="Botanical background" 
            className="w-full h-full object-cover blur-sm"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-beige/80 via-transparent to-secondary/20 pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 z-10 mx-4 text-center"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserPlus className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-serif text-primary mb-4">You're already here!</h1>
          <p className="text-secondary mb-8">
            You are currently logged in as <span className="font-bold text-primary">{user.email || user.username}</span>.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => onLogin(user.username === 'admin' ? 'admin' : 'user')}
              className="w-full py-4 bg-primary text-beige rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => logout()}
              className="w-full py-4 bg-white text-red-500 border border-red-100 rounded-2xl font-medium hover:bg-red-50 transition-all"
            >
              Sign Out
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-beige">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=2000" 
          alt="Botanical background" 
          className="w-full h-full object-cover blur-sm"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-beige/80 via-transparent to-secondary/20 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md p-8 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 z-10 mx-4"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif text-primary mb-2">
            {isLoginMode ? t.login.welcome : 'Create Account'}
          </h1>
          <p className="text-secondary font-light">
            {isLoginMode ? t.login.subtitle : 'Join Ayurveda Editions'}
          </p>
        </div>

        {/* Toggle Login/Signup */}
        <div className="flex bg-beige/50 rounded-2xl p-1 mb-8">
          <button
            onClick={() => { setIsLoginMode(true); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${isLoginMode ? 'bg-white text-primary shadow-sm' : 'text-secondary hover:text-primary'}`}
          >
            <LogIn className="w-4 h-4" /> Sign In
          </button>
          <button
            onClick={() => { setIsLoginMode(false); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${!isLoginMode ? 'bg-white text-primary shadow-sm' : 'text-secondary hover:text-primary'}`}
          >
            <UserPlus className="w-4 h-4" /> Sign Up
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary/70 ml-1">Username / Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
              <input 
                type="text" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isLoginMode ? "email@example.com (or 'admin')" : "email@example.com"}
                className="w-full pl-10 pr-4 py-3 bg-white/50 border border-beige-dark rounded-2xl focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all placeholder:text-secondary/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-primary/70 ml-1">{t.login.password}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-white/50 border border-beige-dark rounded-2xl focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all placeholder:text-secondary/50"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-beige rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                {isLoginMode ? t.login.signIn : 'Create Account'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
