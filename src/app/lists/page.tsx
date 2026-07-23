'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Folder, Settings, Trash2, ExternalLink, Loader2, Plus, Bookmark } from 'lucide-react';

interface RepoInList {
  id: string;
  repository: {
    id: string;
    owner: string;
    name: string;
    fullName: string;
    description?: string | null;
    hebrewDescription?: string | null;
    language?: string | null;
    languageColor?: string | null;
    url: string;
  };
}

interface ListData {
  id: string;
  name: string;
  description?: string | null;
  webhookUrl?: string | null;
  items: RepoInList[];
}

export default function ListsPage() {
  const [lists, setLists] = useState<ListData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/lists');
      const data = await res.json();
      if (res.ok && data.lists) {
        setLists(data.lists);
      }
    } catch (err) {
      console.error('Failed to load lists:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteList = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete list "${name}"?`)) return;
    try {
      await fetch(`/api/lists/${id}`, { method: 'DELETE' });
      setLists(lists.filter((l) => l.id !== id));
    } catch (err) {
      console.error('Failed to delete list:', err);
    }
  };

  const handleRemoveRepoFromList = async (listId: string, repoId: string) => {
    try {
      await fetch(`/api/lists/${listId}/repos?repositoryId=${repoId}`, { method: 'DELETE' });
      setLists(
        lists.map((l) => {
          if (l.id === listId) {
            return {
              ...l,
              items: l.items.filter((i) => i.repository.id !== repoId),
            };
          }
          return l;
        })
      );
    } catch (err) {
      console.error('Failed to remove repo from list:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] p-4 space-y-5 pb-20">
      <header className="flex items-center justify-between border-b border-[#30363d] pb-3 pt-safe pt-[env(safe-area-inset-top,1.5rem)]">
        <h1 className="text-xl font-bold text-[#f0f6fc] flex items-center space-x-2">
          <Bookmark className="w-5 h-5 text-[#58a6ff]" />
          <span>My Custom Lists</span>
        </h1>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#58a6ff]" />
        </div>
      ) : lists.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[#30363d] rounded-xl p-8 space-y-3">
          <Folder className="w-12 h-12 text-[#8b949e] mx-auto opacity-50" />
          <h3 className="text-base font-semibold text-[#f0f6fc]">No Custom Lists Yet</h3>
          <p className="text-xs text-[#8b949e]">
            Save repositories from the Trending tab by clicking &quot;Add to List&quot;.
          </p>
          <Link
            href="/"
            className="inline-block bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] text-xs font-semibold px-4 py-2 rounded-md border border-[#363b42] transition-colors"
          >
            Explore Trending Repos
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {lists.map((list) => (
            <div
              key={list.id}
              className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-sm space-y-3"
            >
              {/* List Card Header */}
              <div className="flex items-center justify-between border-b border-[#30363d] pb-3">
                <div className="flex items-center space-x-2">
                  <Folder className="w-5 h-5 text-[#58a6ff]" />
                  <div>
                    <h2 className="text-base font-semibold text-[#f0f6fc]">{list.name}</h2>
                    {list.description && (
                      <p className="text-xs text-[#8b949e]">{list.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Settings / Webhook Button */}
                  <Link
                    href={`/lists/${list.id}/settings`}
                    className="p-1.5 text-[#8b949e] hover:text-[#58a6ff] transition-colors"
                    title="List Settings & Webhook"
                  >
                    <Settings className="w-4 h-4" />
                  </Link>

                  {/* Delete List Button */}
                  <button
                    onClick={() => handleDeleteList(list.id, list.name)}
                    className="p-1.5 text-[#8b949e] hover:text-red-400 transition-colors"
                    title="Delete List"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Saved Repositories */}
              {list.items.length === 0 ? (
                <p className="text-xs text-[#8b949e] italic py-2">
                  No repositories saved in this list yet.
                </p>
              ) : (
                <div className="divide-y divide-[#30363d]">
                  {list.items.map((item) => (
                    <div
                      key={item.id}
                      className="py-2.5 flex items-center justify-between space-x-3"
                    >
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/repo/${item.repository.owner}/${item.repository.name}`}
                          className="text-sm font-semibold text-[#f0f6fc] hover:text-[#58a6ff] truncate block"
                        >
                          {item.repository.fullName}
                        </Link>
                        {(item.repository.hebrewDescription || item.repository.description) && (
                          <p
                            className={`text-xs text-[#8b949e] truncate ${
                              item.repository.hebrewDescription ? 'dir-rtl text-right' : ''
                            }`}
                          >
                            {item.repository.hebrewDescription || item.repository.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <a
                          href={item.repository.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#8b949e] hover:text-[#f0f6fc] p-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleRemoveRepoFromList(list.id, item.repository.id)}
                          className="text-[#8b949e] hover:text-red-400 p-1 text-xs"
                          title="Remove from list"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
