import React, { useState, useEffect } from 'react';
import { Shield, Key, Settings as SettingsIcon, Save, Info, AlertTriangle } from 'lucide-react';

export default function Settings() {
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [provider, setProvider] = useState('mock');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load from local storage
    setGeminiKey(localStorage.getItem('gemini_api_key') || '');
    setOpenaiKey(localStorage.getItem('openai_api_key') || '');
    setProvider(localStorage.getItem('llm_provider') || 'mock');
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('gemini_api_key', geminiKey.trim());
    localStorage.setItem('openai_api_key', openaiKey.trim());
    localStorage.setItem('llm_provider', provider);

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
      {/* Header */}
      <div className="mb-8 border-b dark:border-slate-800 pb-6">
        <h1 className="font-outfit text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-7 w-7 text-teal-600" /> App Settings
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage your AI models, configure API keys, and set default prompt models.
        </p>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* API credentials */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <h3 className="font-outfit font-bold text-lg flex items-center gap-2 border-b dark:border-slate-800 pb-3">
            <Key className="h-5 w-5 text-teal-600" /> AI Provider & API Credentials
          </h3>

          <div className="space-y-4">
            {/* Model Provider select */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">DEFAULT LLM PROVIDER</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-teal-500 font-medium"
              >
                <option value="gemini">Google Gemini API (Preferred)</option>
                <option value="openai">OpenAI GPT API (Alternative)</option>
                <option value="mock">Local Mock Mode (Keyless testing)</option>
              </select>
            </div>

            {/* Gemini Key */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">GEMINI API KEY</label>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-teal-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Your key will be securely saved only inside your local browser storage and sent in request headers.
              </p>
            </div>

            {/* OpenAI Key */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">OPENAI API KEY</label>
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Security Warning Callout */}
        <div className="bg-amber-50 border border-amber-200/50 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400 p-4 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-500" />
          <div className="text-xs">
            <h4 className="font-bold mb-0.5">Security & Privacy</h4>
            <p className="leading-relaxed">
              We never store your API keys on our servers. When executing optimizations, your browser attaches these keys to temporary request headers which FastAPI inspects to query Gemini or OpenAI directly. If no keys are specified, the app falls back to Local Mock Mode.
            </p>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="bg-slate-900 hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-semibold px-6 py-3 rounded-xl text-sm flex items-center gap-2 transition-all shadow-md"
            id="settings-save-btn"
          >
            <Save className="h-4.5 w-4.5" /> Save Changes
          </button>
          {saved && (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm animate-pulse">
              Settings updated successfully!
            </span>
          )}
        </div>

      </form>
    </div>
  );
}
