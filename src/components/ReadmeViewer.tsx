'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Languages, Loader2 } from 'lucide-react';

interface ReadmeViewerProps {
  repoId: string;
  owner: string;
  name: string;
  readmeEn?: string | null;
  readmeHebrew?: string | null;
  autoTranslate?: boolean;
  isTranslating?: boolean;
  onTriggerTranslation: () => void;
}

/**
 * Resolves relative or GitHub blob image URLs into valid GitHub raw image URLs.
 */
function resolveImageUrl(src: string, owner: string, name: string, branch = 'main'): string {
  if (!src) return '';
  const cleanSrc = src.trim();

  if (cleanSrc.startsWith('data:')) {
    return cleanSrc;
  }

  if (cleanSrc.startsWith('http://') || cleanSrc.startsWith('https://')) {
    // If it's a GitHub blob URL (e.g. github.com/owner/repo/blob/main/img.png), convert to raw
    if (cleanSrc.includes('github.com') && cleanSrc.includes('/blob/')) {
      return cleanSrc.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    }
    return cleanSrc;
  }

  // Relative path (e.g., ./docs/banner.png or media/logo.svg)
  const normalizedPath = cleanSrc.replace(/^\.\//, '').replace(/^\//, '');
  return `https://raw.githubusercontent.com/${owner}/${name}/${branch}/${normalizedPath}`;
}

export const ReadmeViewer: React.FC<ReadmeViewerProps> = ({
  owner,
  name,
  readmeEn,
  readmeHebrew,
  autoTranslate,
  isTranslating,
  onTriggerTranslation,
}) => {
  const [showHebrew, setShowHebrew] = useState(Boolean(autoTranslate || readmeHebrew));

  React.useEffect(() => {
    if (autoTranslate || readmeHebrew) {
      setShowHebrew(true);
    }
  }, [autoTranslate, readmeHebrew]);

  const contentToDisplay = showHebrew && readmeHebrew ? readmeHebrew : readmeEn;

  return (
    <div className="bg-[#0d1117] rounded-xl border border-[#30363d] p-5">
      {/* Translation Toolbar */}
      <div className="flex items-center justify-between border-b border-[#30363d] pb-3 mb-5">
        <h3 className="text-sm font-semibold text-[#8b949e] flex items-center space-x-2">
          <span>README.md</span>
        </h3>

        <div className="flex items-center space-x-3">
          {readmeHebrew ? (
            <button
              onClick={() => setShowHebrew(!showHebrew)}
              className="flex items-center space-x-1.5 text-xs text-[#58a6ff] hover:underline font-medium bg-[#21262d] px-3 py-1.5 rounded-full border border-[#363b42]"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{showHebrew ? 'Original (EN)' : 'עברית (Hebrew)'}</span>
            </button>
          ) : isTranslating ? (
            <div className="flex items-center space-x-1.5 text-xs text-[#8b949e]">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#58a6ff]" />
              <span>Translating README to Hebrew...</span>
            </div>
          ) : (
            <button
              onClick={onTriggerTranslation}
              className="flex items-center space-x-1.5 text-xs text-[#f0f6fc] bg-[#21262d] hover:bg-[#30363d] px-3 py-1.5 rounded-full border border-[#363b42] transition-colors"
            >
              <Languages className="w-3.5 h-3.5 text-[#58a6ff]" />
              <span>Translate README to Hebrew</span>
            </button>
          )}
        </div>
      </div>

      {/* README Content Body */}
      {!contentToDisplay ? (
        <div className="text-center py-10 text-sm text-[#8b949e]">
          No README available for this repository.
        </div>
      ) : (
        <div
          className={`prose prose-invert max-w-none text-[#f0f6fc] text-sm leading-relaxed ${
            showHebrew && readmeHebrew ? 'dir-rtl text-right font-sans' : ''
          }`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-xl font-bold border-b border-[#30363d] pb-2 my-4 text-[#f0f6fc]">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-lg font-bold border-b border-[#30363d] pb-1 my-3 text-[#f0f6fc]">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-base font-semibold my-2 text-[#f0f6fc]">{children}</h3>
              ),
              p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#58a6ff] hover:underline"
                >
                  {children}
                </a>
              ),
              img: ({ src, alt, ...props }) => {
                if (!src) return null;
                const resolvedSrc = resolveImageUrl(src, owner, name, 'main');
                return (
                  <img
                    {...props}
                    src={resolvedSrc}
                    alt={alt || ''}
                    className="max-w-full h-auto rounded-lg my-3 border border-[#30363d] inline-block"
                    onError={(e) => {
                      // Fallback attempt with master branch if main branch fails
                      const img = e.currentTarget;
                      if (resolvedSrc.includes('/main/')) {
                        img.src = resolvedSrc.replace('/main/', '/master/');
                      }
                    }}
                  />
                );
              },
              code: ({ className, children }) => {
                const isBlock = Boolean(className);
                return isBlock ? (
                  <pre className="bg-[#161b22] border border-[#30363d] p-3 rounded-md overflow-x-auto text-xs my-3 font-mono">
                    <code>{children}</code>
                  </pre>
                ) : (
                  <code className="bg-[#161b22] border border-[#30363d] px-1.5 py-0.5 rounded text-xs font-mono text-[#f0f6fc]">
                    {children}
                  </code>
                );
              },
            }}
          >
            {contentToDisplay}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};
