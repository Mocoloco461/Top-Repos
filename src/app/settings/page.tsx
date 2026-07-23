'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Key, Cpu, Sparkles, Save, CheckCircle2, Loader2, Lock } from 'lucide-react';

const MODELS = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash (Recommended)' },
  { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite (Fast)' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
];

export default function AppSettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [maskedKey, setMaskedKey] = useState('');
  const [isKeyConfigured, setIsKeyConfigured] = useState(false);
  const [model, setModel] = useState('google/gemini-2.5-flash');
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (res.ok) {
        setIsKeyConfigured(data.isKeyConfigured);
        setMaskedKey(data.maskedKey || '');
        if (data.maskedKey) setApiKey(data.maskedKey);
        setModel(data.openRouterModel || 'google/gemini-2.5-flash');
        setAutoTranslate(Boolean(data.autoTranslate));
      }
    } catch (err) {
      console.error('Failed to load app settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openRouterApiKey: apiKey.includes('••••') ? '' : apiKey,
          openRouterModel: model,
          autoTranslate,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('App settings saved securely (API Key encrypted with AES-256-GCM)!');
        setIsKeyConfigured(data.isKeyConfigured);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        alert(data.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#58a6ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] p-4 space-y-6 pb-20">
      <header className="border-b border-[#30363d] pb-3 pt-safe pt-[env(safe-area-inset-top,1.5rem)]">
        <h1 className="text-xl font-bold text-[#f0f6fc] flex items-center space-x-2">
          <Settings className="w-5 h-5 text-[#58a6ff]" />
          <span>App & AI Settings</span>
        </h1>
      </header>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {successMsg && (
          <div className="bg-[#2ea043]/15 border border-[#2ea043] text-[#3fb950] px-4 py-3 rounded-xl text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Security & OpenRouter API Key */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm font-semibold text-[#f0f6fc]">
              <Key className="w-4 h-4 text-[#58a6ff]" />
              <span>OpenRouter API Key</span>
            </div>

            <div className="flex items-center space-x-1 text-xs text-[#3fb950] bg-[#2ea043]/10 px-2.5 py-1 rounded-full border border-[#2ea043]/30">
              <Lock className="w-3 h-3" />
              <span>AES-256-GCM Encrypted</span>
            </div>
          </div>

          <p className="text-xs text-[#8b949e] leading-relaxed">
            Your key is encrypted at the application level using Node.js AES-256-GCM and stored securely in PostgreSQL.
          </p>

          <input
            type="password"
            placeholder="sk-or-v1-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-xs font-mono text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff]"
          />
        </div>

        {/* Model Selection */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 text-sm font-semibold text-[#f0f6fc]">
            <Cpu className="w-4 h-4 text-[#58a6ff]" />
            <span>AI Translation Model</span>
          </div>

          <p className="text-xs text-[#8b949e] leading-relaxed">
            Select which OpenRouter model will handle Hebrew translations for repository descriptions and README files.
          </p>

          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2.5 text-xs text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff] cursor-pointer"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Auto-Translate Toggle */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#58a6ff]" />
              <div>
                <h3 className="text-sm font-semibold text-[#f0f6fc]">Auto-Translate Everything</h3>
                <p className="text-xs text-[#8b949e]">
                  Automatically queue Hebrew translations for all newly scraped trending repositories in the background.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setAutoTranslate(!autoTranslate)}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${
                autoTranslate ? 'bg-[#2ea043]' : 'bg-[#21262d] border border-[#363b42]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  autoTranslate ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#2ea043] hover:bg-[#2c974b] text-white text-xs font-semibold px-6 py-2.5 rounded-md flex items-center space-x-2 disabled:opacity-50 transition-colors shadow-lg"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}
