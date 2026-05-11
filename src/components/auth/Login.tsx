import React, { useState } from 'react';
import { Zap, LogIn, ShieldCheck, Sparkles, UserPlus, Mail, Lock, User, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export default function Login() {
  const { signIn, signInEmail, signUpEmail, accounts, removeAccount } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showAccountSelector, setShowAccountSelector] = useState(accounts.length > 0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        await signUpEmail(email, password, name);
      } else {
        await signInEmail(email, password);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] p-4 font-sans">
      <div className="w-full max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2.5rem] border border-neutral-200 bg-white p-6 sm:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)]"
        >
          <div className="mb-8 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-2xl shadow-blue-200">
              <Zap size={32} fill="currentColor" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-neutral-900 uppercase">flowchat</h1>
            <p className="mt-2 text-neutral-500 font-medium text-sm">The ultimate social automation engine.</p>
          </div>

          <AnimatePresence mode="wait">
            {showAccountSelector ? (
              <motion.div
                key="accounts"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 text-center mb-6">Choose an account</p>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {accounts.map(acc => (
                    <button
                      key={acc.uid}
                      onClick={() => {
                        setEmail(acc.email);
                        setShowAccountSelector(false);
                      }}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl border border-neutral-100 bg-neutral-50/50 hover:bg-white hover:border-blue-200 transition-all text-left relative group"
                    >
                      <div className="h-10 w-10 rounded-xl bg-white border border-neutral-100 overflow-hidden shrink-0">
                        {acc.photoURL ? (
                          <img src={acc.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-400">
                            <User size={20} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-neutral-900 truncate">{acc.displayName || 'User'}</p>
                        <p className="text-[11px] text-neutral-500 truncate">{acc.email}</p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAccount(acc.uid);
                          if (accounts.length <= 1) setShowAccountSelector(false);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg text-neutral-300 transition-all"
                      >
                        <X size={14} />
                      </button>
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setShowAccountSelector(false)}
                  className="w-full flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                >
                  <UserPlus size={16} />
                  Use another account
                </button>
              </motion.div>
            ) : (
              <motion.form 
                key={isSignUp ? 'signup' : 'signin'}
              initial={{ opacity: 0, x: isSignUp ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isSignUp ? -20 : 20 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {isSignUp && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Wood"
                      className="w-full rounded-2xl border-neutral-100 bg-neutral-50 py-4 pl-12 pr-4 text-sm font-bold focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full rounded-2xl border-neutral-100 bg-neutral-50 py-4 pl-12 pr-4 text-sm font-bold focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border-neutral-100 bg-neutral-50 py-4 pl-12 pr-4 text-sm font-bold focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                  />
                </div>
              </div>

              <button
                disabled={loading}
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-neutral-900 px-6 py-4 font-black uppercase tracking-widest text-white text-xs transition-all hover:bg-neutral-800 hover:shadow-2xl active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Processing...' : isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />}
                {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In Now'}
              </button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-100"></div></div>
                <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="bg-white px-4 text-neutral-300">Or continue with</span></div>
              </div>

              <button
                type="button"
                onClick={signIn}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-neutral-200 bg-white px-6 py-4 font-black uppercase tracking-widest text-xs text-neutral-600 transition-all hover:bg-neutral-50 hover:border-neutral-300 active:scale-[0.98]"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>

              <div className="pt-4 text-center">
                <button 
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-xs font-bold text-blue-600 hover:underline px-4 py-2"
                >
                  {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </button>
              </div>
              {accounts.length > 0 && !isSignUp && (
                <div className="pt-2 text-center border-t border-neutral-50 mt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAccountSelector(true)}
                    className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-blue-600 transition-all"
                  >
                    Switch saved account
                  </button>
                </div>
              )}
            </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="mt-8 text-center space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
            Trusted by 10,000+ businesses worldwide.
          </p>
          <div className="flex items-center justify-center gap-6 opacity-40 grayscale">
            <ShieldCheck size={20} />
            <Sparkles size={20} />
            <ShieldCheck size={20} />
          </div>
        </div>
      </div>
    </div>
  );
}
