'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Save, Webhook, Loader2, CheckCircle2 } from 'lucide-react';

export default function ListSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const listId = params.id as string;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (listId) {
      fetchListSettings();
    }
  }, [listId]);

  const fetchListSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lists/${listId}`);
      const data = await res.json();
      if (res.ok && data.list) {
        setName(data.list.name);
        setDescription(data.list.description || '');
        setWebhookUrl(data.list.webhookUrl || '');
      }
    } catch (err) {
      console.error('Failed to load list settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/lists/${listId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          webhookUrl,
        }),
      });

      if (res.ok) {
        setSuccessMsg('List settings saved successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update settings');
      }
    } catch (err) {
      console.error('Error saving list settings:', err);
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
      <header className="flex items-center space-x-3 border-b border-[#30363d] pb-3 pt-safe pt-[env(safe-area-inset-top,1.5rem)]">
        <Link
          href="/lists"
          className="text-[#58a6ff] hover:text-[#2f81f7] text-sm flex items-center"
        >
          <ChevronLeft className="w-5 h-5 mr-0.5" />
          Lists
        </Link>
        <h1 className="text-lg font-semibold text-[#f0f6fc]">List Settings</h1>
      </header>

      <form onSubmit={handleSave} className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-5 shadow-sm">
        {successMsg && (
          <div className="bg-[#2ea043]/15 border border-[#2ea043] text-[#3fb950] px-4 py-2.5 rounded-lg text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#f0f6fc] block">List Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#f0f6fc] block">Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff]"
          />
        </div>

        {/* Webhook Configuration Section */}
        <div className="border-t border-[#30363d] pt-4 space-y-3">
          <div className="flex items-center space-x-2 text-sm font-semibold text-[#f0f6fc]">
            <Webhook className="w-4 h-4 text-[#58a6ff]" />
            <span>Webhook Notification URL</span>
          </div>

          <p className="text-xs text-[#8b949e] leading-relaxed">
            When a new repository is added to this list, an HTTP POST payload containing repository details will be dispatched to this Webhook URL.
          </p>

          <input
            type="url"
            placeholder="https://your-webhook-endpoint.com/api/notify"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-xs font-mono text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff]"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#2ea043] hover:bg-[#2c974b] text-white text-xs font-semibold px-5 py-2 rounded-md flex items-center space-x-1.5 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
