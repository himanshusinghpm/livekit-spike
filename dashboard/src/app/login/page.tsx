'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, ArrowRight, ShieldCheck, Activity } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // This tells Supabase where to send the user after they click the email link
        emailRedirectTo: `${window.location.origin}/agency`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSubmitted(true);
    }
    
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 text-slate-300 font-sans selection:bg-orange-500/30">
      <div className="max-w-md w-full">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-orange-500/10 mb-4 border border-orange-500/20">
            <Activity className="text-orange-500" size={24} />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mb-2">LiveKit <span className="text-orange-500">Workspace</span></h1>
          <p className="text-slate-500 text-sm">Secure, passwordless access for agencies and creators.</p>
        </div>

        <div className="bg-[#111111] p-8 rounded-xl border border-slate-800 shadow-2xl">
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm font-mono text-center">
              {error}
            </div>
          )}

          {!submitted ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">Work Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="email" 
                    required
                    placeholder="manager@agency.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black border border-slate-800 rounded-lg py-3 pl-10 pr-4 text-white font-mono placeholder:text-slate-700 focus:outline-none focus:border-orange-500/50 transition-colors"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading || !email}
                className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors font-mono text-sm disabled:opacity-50"
              >
                {loading ? 'REQUESTING ACCESS...' : 'SEND SECURE LINK'} <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <div className="text-center py-6">
              <ShieldCheck size={48} className="text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Check your inbox</h2>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                We sent a secure magic link to <span className="text-white font-mono">{email}</span>. Click it to instantly authenticate your workspace.
              </p>
              <button 
                onClick={() => setSubmitted(false)}
                className="text-xs font-mono text-slate-500 hover:text-orange-500 transition-colors"
              >
                Try a different email
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}