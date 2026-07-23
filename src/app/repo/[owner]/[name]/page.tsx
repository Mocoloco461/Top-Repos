'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft, ExternalLink, BookmarkPlus, Star, Loader2 } from 'lucide-react';
import { ReadmeViewer } from '@/components/ReadmeViewer';
import { AddToListModal } from '@/components/AddToListModal';
import { RepoData } from '@/components/RepoCard';

export default function RepoDetailPage() {
  const params = useParams();
  const owner = params.owner as string;
  const name = params.name as string;

  const [repo, setRepo] = useState<RepoData | null>(null);
  const [readmeContent, setReadmeContent] = useState<string | null>(null);
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (owner && name) {
      fetchRepoData();
    }
  }, [owner, name]);

  const fetchRepoData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/repo?owner=${owner}&name=${name}`);
      const data = await res.json();
      if (res.ok && data.repo) {
        setRepo(data.repo);
        setReadmeContent(data.readme || data.repo.readmeContent || null);
        setAutoTranslate(Boolean(data.autoTranslate));
      }
    } catch (err) {
      console.error('Failed to load repository detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerReadmeTranslation = async () => {
    if (!repo) return;
    setRepo({ ...repo, isTranslating: true });

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoId: repo.id, type: 'readme' }),
      });
      const data = await res.json();
      if (data.translatedText) {
        setRepo({ ...repo, hebrewReadme: data.translatedText, isTranslating: false });
      } else {
        setTimeout(async () => {
          await fetchRepoData();
        }, 3000);
      }
    } catch (err) {
      console.error('Failed to translate README:', err);
      setRepo({ ...repo, isTranslating: false });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#58a6ff]" />
        <span className="text-xs text-[#8b949e]">Loading repository & README...</span>
      </div>
    );
  }

  if (!repo) {
    return (
      <div className="min-h-screen bg-[#0d1117] p-4 text-center">
        <p className="text-sm text-[#8b949e] py-10">Repository not found.</p>
        <Link href="/" className="text-xs text-[#58a6ff] hover:underline">
          Return to Trending
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] pb-10">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-[#0d1117] border-b border-[#30363d] px-4 py-3 pt-safe pt-[env(safe-area-inset-top,1.5rem)] flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center text-[#58a6ff] hover:text-[#2f81f7] text-sm font-medium transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-0.5" />
          Trending
        </Link>
        <h1 className="text-sm font-semibold text-[#f0f6fc] truncate max-w-[200px]">
          {repo.fullName}
        </h1>
        <a
          href={repo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
          title="Open on GitHub"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </header>

      {/* Repo Title & Info Card */}
      <div className="p-4 bg-[#161b22] border-b border-[#30363d] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-[#8b949e]">{repo.owner}</span>
            <h2 className="text-xl font-bold text-[#f0f6fc]">{repo.name}</h2>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center space-x-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] text-xs font-medium px-3 py-1.5 rounded-md border border-[#363b42] transition-colors"
          >
            <BookmarkPlus className="w-4 h-4 text-[#8b949e]" />
            <span>Add to List</span>
          </button>
        </div>

        {repo.description && (
          <p className="text-sm text-[#f0f6fc] leading-relaxed">{repo.description}</p>
        )}

        <div className="flex items-center space-x-4 text-xs text-[#8b949e]">
          <div className="flex items-center space-x-1">
            <Star className="w-3.5 h-3.5 text-[#8b949e]" />
            <span>{repo.stars.toLocaleString()} stars</span>
          </div>
          {repo.language && (
            <div className="flex items-center space-x-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: repo.languageColor || '#8b949e' }}
              />
              <span>{repo.language}</span>
            </div>
          )}
        </div>
      </div>

      {/* README Viewer */}
      <div className="p-4">
        <ReadmeViewer
          repoId={repo.id}
          owner={owner}
          name={name}
          readmeEn={readmeContent}
          readmeHebrew={repo.hebrewReadme}
          autoTranslate={autoTranslate}
          isTranslating={repo.isTranslating}
          onTriggerTranslation={handleTriggerReadmeTranslation}
        />
      </div>

      {/* Add To List Modal */}
      <AddToListModal
        repo={repo}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
