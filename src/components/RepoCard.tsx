'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Star, ExternalLink, Languages, Loader2, BookmarkPlus } from 'lucide-react';

export interface RepoData {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  description?: string | null;
  language?: string | null;
  languageColor?: string | null;
  stars: number;
  starsToday: number;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  url: string;
  hebrewDescription?: string | null;
  hebrewReadme?: string | null;
  isTranslating?: boolean;
}

interface RepoCardProps {
  repo: RepoData;
  autoTranslate?: boolean;
  onAddToList: (repo: RepoData) => void;
  onTriggerTranslation: (repoId: string) => void;
}

export const RepoCard: React.FC<RepoCardProps> = ({
  repo,
  autoTranslate,
  onAddToList,
  onTriggerTranslation,
}) => {
  const router = useRouter();
  const [showHebrew, setShowHebrew] = useState(true);
  const [imgError, setImgError] = useState(false);

  React.useEffect(() => {
    if (repo.hebrewDescription || autoTranslate) {
      setShowHebrew(true);
    }
  }, [repo.hebrewDescription, autoTranslate]);

  const langColor = repo.languageColor || '#8b949e';
  const displayDescription =
    showHebrew && repo.hebrewDescription ? repo.hebrewDescription : repo.description;

  const handleCardClick = () => {
    router.push(`/repo/${repo.owner}/${repo.name}`);
  };

  return (
    <article
      onClick={handleCardClick}
      className="bg-[#0d1117] border-b border-[#30363d] pb-4 transition-colors hover:bg-[#161b22]/70 cursor-pointer group overflow-hidden"
    >
      {/* Concrete Product Screenshot / Banner Image (ONLY when repo.bannerUrl exists) */}
      {repo.bannerUrl && !imgError && (
        <div className="w-full bg-[#161b22] border-b border-[#30363d] overflow-hidden flex items-center justify-center">
          <img
            src={repo.bannerUrl}
            alt={repo.name}
            className="w-full h-auto max-h-64 object-cover"
            onError={() => setImgError(true)}
          />
        </div>
      )}

      <div className="p-4 pt-3">
        {/* Header Row: Owner avatar, owner handle & repo title */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative w-8 h-8 rounded-md overflow-hidden bg-[#21262d] border border-[#30363d] flex-shrink-0">
              {repo.avatarUrl ? (
                <Image
                  src={repo.avatarUrl}
                  alt={repo.owner}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[#8b949e]">
                  {repo.owner.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <span className="text-xs text-[#8b949e] font-normal leading-tight">
                {repo.owner}
              </span>
              <span className="text-base font-bold text-[#f0f6fc] group-hover:text-[#58a6ff] leading-snug transition-colors">
                {repo.name}
              </span>
            </div>
          </div>

          {/* External GitHub link button */}
          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
            title="Open on GitHub"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Repository Description */}
        <div className="mt-2.5">
          <p
            className={`text-sm text-[#f0f6fc] leading-relaxed ${
              showHebrew && repo.hebrewDescription ? 'dir-rtl text-right font-sans' : ''
            }`}
          >
            {displayDescription || 'No description provided.'}
          </p>
        </div>

        {/* Hebrew Translation Controls */}
        <div className="mt-2 flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
          {repo.hebrewDescription ? (
            <button
              onClick={() => setShowHebrew(!showHebrew)}
              className="flex items-center space-x-1.5 text-xs text-[#58a6ff] hover:underline font-medium"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{showHebrew ? 'Show Original (EN)' : 'עברית (Hebrew)'}</span>
            </button>
          ) : repo.isTranslating ? (
            <div className="flex items-center space-x-1.5 text-xs text-[#8b949e]">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#58a6ff]" />
              <span>Translating to Hebrew...</span>
            </div>
          ) : (
            <button
              onClick={() => onTriggerTranslation(repo.id)}
              className="flex items-center space-x-1.5 text-xs text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>Translate to Hebrew</span>
            </button>
          )}
        </div>

        {/* Stats Row: Stars Today & Programming Language (CONTRIBUTORS COUNT IS HIDDEN) */}
        <div className="mt-3 flex items-center space-x-4 text-xs text-[#8b949e]">
          {/* Stars earned today / this period */}
          <div className="flex items-center space-x-1">
            <Star className="w-3.5 h-3.5 text-[#8b949e]" />
            <span>{repo.starsToday.toLocaleString()} today</span>
          </div>

          {/* Language indicator */}
          {repo.language && (
            <div className="flex items-center space-x-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: langColor }}
              />
              <span>{repo.language}</span>
            </div>
          )}
        </div>

        {/* Add to List Button (Replaces Star Button) */}
        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onAddToList(repo)}
            className="w-full flex items-center justify-center space-x-2 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] border border-[#363b42] rounded-md py-2 text-sm font-medium transition-colors"
          >
            <BookmarkPlus className="w-4 h-4 text-[#8b949e]" />
            <span>Add to List</span>
          </button>
        </div>
      </div>
    </article>
  );
};
