import React from 'react';
import { Zap, LogIn, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'motion/react';

export default function Login() {
  const { signIn } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] p-4">
      <div className="w-full max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-xl shadow-neutral-200/50"
        >
          <div className="mb-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <Zap size={32} fill="currentColor" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">flowchat</h1>
            <p className="mt-2 text-neutral-500">The ultimate social automation engine.</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={signIn}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-neutral-900 px-6 py-4 font-bold text-white transition-all hover:bg-neutral-800 hover:shadow-lg active:scale-[0.98]"
            >
              <LogIn size={20} />
              Continue with Google
            </button>
            <p className="text-center text-xs text-neutral-400">
              By continuing, you agree to our Terms of Service.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 border-t border-neutral-100 pt-8">
            <div className="flex items-center gap-2 text-neutral-500">
              <ShieldCheck size={18} className="text-emerald-500" />
              <span className="text-xs font-medium">Secure Auth</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-500">
              <Sparkles size={18} className="text-amber-500" />
              <span className="text-xs font-medium">AI Powered</span>
            </div>
          </div>
        </motion.div>

        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-400">
            Trusted by 10,000+ businesses worldwide.
          </p>
        </div>
      </div>
    </div>
  );
}
