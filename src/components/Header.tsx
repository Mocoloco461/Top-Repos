'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronLeft } from 'lucide-react';

interface HeaderProps {
  since: 'daily' | 'weekly' | 'monthly';
  onSinceChange: (since: 'daily' | 'weekly' | 'monthly') => void;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
}

const LANGUAGES = [
  'All Languages',
  'TypeScript',
  'JavaScript',
  'Python',
  'Go',
  'Rust',
  'C++',
  'Java',
  'PHP',
  'Ruby',
  'Swift',
];

export const Header: React.FC<HeaderProps> = ({
  since,
  onSinceChange,
  selectedLanguage,
  onLanguageChange,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#0d1117] border-b border-[#30363d] pt-safe pt-[env(safe-area-inset-top,1.5rem)]">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="flex items-center text-[#58a6ff] hover:text-[#2f81f7] text-sm font-medium transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-0.5" />
          Explore
        </Link>
        <h1 className="text-base font-semibold text-[#f0f6fc]">Trending</h1>
        <div className="w-16" /> {/* Spacer for symmetry */}
      </div>

      {/* Filter Dropdowns Bar */}
      <div className="flex items-center space-x-2 px-4 pb-3 overflow-x-auto no-scrollbar">
        {/* Date Filter Dropdown */}
        <div className="relative inline-block">
          <select
            value={since}
            onChange={(e) => onSinceChange(e.target.value as 'daily' | 'weekly' | 'monthly')}
            className="appearance-none bg-[#21262d] text-[#f0f6fc] text-xs font-medium px-3 py-1.5 pr-7 rounded-full border border-[#363b42] focus:outline-none focus:border-[#58a6ff] cursor-pointer"
          >
            <option value="daily">Today</option>
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[#8b949e] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Language Filter Dropdown */}
        <div className="relative inline-block">
          <select
            value={selectedLanguage}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="appearance-none bg-[#21262d] text-[#f0f6fc] text-xs font-medium px-3 py-1.5 pr-7 rounded-full border border-[#363b42] focus:outline-none focus:border-[#58a6ff] cursor-pointer"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang === 'All Languages' ? '' : lang}>
                {lang === 'All Languages' ? 'Language' : lang}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[#8b949e] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Spoken Language Dropdown */}
        <div className="relative inline-block">
          <select
            disabled
            className="appearance-none bg-[#21262d] text-[#8b949e] text-xs font-medium px-3 py-1.5 pr-7 rounded-full border border-[#363b42] cursor-not-allowed opacity-80"
          >
            <option>Spoken Language</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[#8b949e] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
    </header>
  );
};
