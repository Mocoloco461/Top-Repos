'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { RepoCard, RepoData } from '@/components/RepoCard';
import { AddToListModal } from '@/components/AddToListModal';
import { Loader2, RefreshCw } from 'lucide-react';

export default function TrendingPage() {
  const [since, setSince] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [language, setLanguage] = useState('');
  const [repos, setRepos] = useState<RepoData[]>([]);
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRepoForModal, setSelectedRepoForModal] = useState<RepoData | null>(null);

  const fetchTrendingRepos = useCallback(async (isRefresh = false, silent = false) => {
    if (isRefresh) setRefreshing(true);
    else if (!silent) setLoading(true);

    try {
      const query = new URLSearchParams();
      query.set('since', since);
      if (language) query.set('language', language);
      if (isRefresh) query.set('refresh', 'true');

      const res = await fetch(`/api/trending?${query.toString()}`);
      const data = await res.json();

      if (res.ok && data.repos) {
        setRepos(data.repos);
        setAutoTranslate(Boolean(data.autoTranslate));
      }
    } catch (err) {
      console.error('Failed to fetch trending repositories:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [since, language]);

  useEffect(() => {
    fetchTrendingRepos();
  }, [fetchTrendingRepos]);

  // Polling mechanism when autoTranslate is enabled or any repo is translating
  useEffect(() => {
    const hasTranslatingRepos = repos.some((r) => r.isTranslating || (autoTranslate && !r.hebrewDescription));
    if (!hasTranslatingRepos) return;

    const interval = setInterval(() => {
      fetchTrendingRepos(false, true);
    }, 2000);

    return () => clearInterval(interval);
  }, [repos, autoTranslate, fetchTrendingRepos]);

  const handleTriggerTranslation = async (repoId: string) => {
    // Update local optimistic state
    setRepos((prev) =>
      prev.map((r) => (r.id === repoId ? { ...r, isTranslating: true } : r))
    );

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoId, type: 'description' }),
      });
      const data = await res.json();
      if (data.translatedText) {
        setRepos((prev) =>
          prev.map((r) =>
            r.id === repoId
              ? { ...r, hebrewDescription: data.translatedText, isTranslating: false }
              : r
          )
        );
      } else {
        // Poll status after 2 seconds if queued
        setTimeout(async () => {
          await fetchTrendingRepos(false, true);
        }, 2000);
      }
    } catch (err) {
      console.error('Error triggering translation:', err);
      setRepos((prev) =>
        prev.map((r) => (r.id === repoId ? { ...r, isTranslating: false } : r))
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* GitHub iOS Header */}
      <Header
        since={since}
        onSinceChange={(newSince) => setSince(newSince)}
        selectedLanguage={language}
        onLanguageChange={(newLang) => setLanguage(newLang)}
      />

      {/* Action Sub-bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#010409]/60 border-b border-[#30363d] text-xs text-[#8b949e]">
        <span>
          Showing <strong className="text-[#f0f6fc]">{repos.length}</strong> trending repositories
        </span>

        <button
          onClick={() => fetchTrendingRepos(true)}
          disabled={refreshing}
          className="flex items-center space-x-1 hover:text-[#58a6ff] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#58a6ff]' : ''}`} />
          <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Repositories List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#58a6ff]" />
          <span className="text-xs text-[#8b949e]">Scraping GitHub Trending...</span>
        </div>
      ) : repos.length === 0 ? (
        <div className="text-center py-20 text-sm text-[#8b949e]">
          No trending repositories found for the selected filters.
        </div>
      ) : (
        <div className="divide-y divide-[#30363d]">
          {repos.map((repo) => (
            <RepoCard
              key={repo.id}
              repo={repo}
              autoTranslate={autoTranslate}
              onAddToList={(selected) => setSelectedRepoForModal(selected)}
              onTriggerTranslation={handleTriggerTranslation}
            />
          ))}
        </div>
      )}

      {/* Add To List Modal */}
      <AddToListModal
        repo={selectedRepoForModal}
        isOpen={Boolean(selectedRepoForModal)}
        onClose={() => setSelectedRepoForModal(null)}
      />
    </div>
  );
}

