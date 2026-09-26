'use client';

import { useState } from 'react';
import { Copy, CheckCircle, ShieldAlert } from 'lucide-react';

export default function CreatorDashboard() {
  const [copied, setCopied] = useState(false);
  
  // In production, this is fetched from the Supabase user profile
  const syncCode = "LIVEKIT-SEC-9F8A7B"; 

  const handleCopy = () => {
    navigator.clipboard.writeText(syncCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-[#0a0f1c] p-8">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10 border-b border-slate-800/80 pb-6">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">Creator Portal</h1>
          <p className="text-teal-500/70 font-mono text-sm tracking-wider uppercase">Telemetry Management</p>
        </header>

        <div className="bg-slate-900/60 p-8 rounded-2xl border border-slate-700/50 shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert className="text-teal-400" size={24} />
            <h2 className="text-xl font-bold text-white">Your Secret Sync Code</h2>
          </div>
          <p className="text-slate-400 mb-6 font-mono text-sm">
            Paste this code into your LiveKit Chrome Extension. Keep it secret. This cryptographic key binds your live viewership data to your account.
          </p>
          
          <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800">
            <code className="flex-1 text-2xl font-mono text-teal-400 tracking-widest">{syncCode}</code>
            <button 
              onClick={handleCopy}
              className="flex items-center gap-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 px-4 py-2 rounded-md transition-colors border border-teal-500/30"
            >
              {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
