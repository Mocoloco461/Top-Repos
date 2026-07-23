'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Loader2 } from 'lucide-react';
import { RepoData } from './RepoCard';

interface ListData {
  id: string;
  name: string;
  description?: string | null;
  items: Array<{ repositoryId: string }>;
}

interface AddToListModalProps {
  repo: RepoData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AddToListModal: React.FC<AddToListModalProps> = ({
  repo,
  isOpen,
  onClose,
}) => {
  const [lists, setLists] = useState<ListData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [newListName, setNewListName] = useState('');
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && repo) {
      fetchLists();
    }
  }, [isOpen, repo]);

  const fetchLists = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/lists');
      const data = await res.json();
      if (res.ok && data.lists) {
        setLists(data.lists);
        // Determine which lists already contain this repo
        const activeIds = data.lists
          .filter((l: ListData) => l.items.some((i) => i.repositoryId === repo?.id))
          .map((l: ListData) => l.id);
        setSelectedListIds(activeIds);
      }
    } catch (err) {
      console.error('Error loading lists:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !repo) return null;

  const toggleList = (listId: string) => {
    if (selectedListIds.includes(listId)) {
      setSelectedListIds(selectedListIds.filter((id) => id !== listId));
    } else {
      setSelectedListIds([...selectedListIds, listId]);
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newListName.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.list) {
        setLists([...lists, data.list]);
        setSelectedListIds([...selectedListIds, data.list.id]);
        setNewListName('');
      } else {
        alert(data.error || 'Failed to create list');
      }
    } catch (err) {
      console.error('Error creating list:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleSaveAssignments = async () => {
    setSaving(true);
    try {
      // Compare initial vs final to add or remove
      for (const list of lists) {
        const inDb = list.items.some((i) => i.repositoryId === repo.id);
        const inSelected = selectedListIds.includes(list.id);

        if (inSelected && !inDb) {
          // Add to list (triggers webhook)
          await fetch(`/api/lists/${list.id}/repos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repositoryId: repo.id }),
          });
        } else if (!inSelected && inDb) {
          // Remove from list
          await fetch(`/api/lists/${list.id}/repos?repositoryId=${repo.id}`, {
            method: 'DELETE',
          });
        }
      }
      onClose();
    } catch (err) {
      console.error('Error updating list assignments:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl w-full max-w-md p-5 shadow-2xl space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#30363d] pb-3">
          <h2 className="text-base font-semibold text-[#f0f6fc]">
            Add to List
          </h2>
          <button
            onClick={onClose}
            className="text-[#8b949e] hover:text-[#f0f6fc] p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Repo Info */}
        <div className="text-xs text-[#8b949e]">
          Save <span className="font-semibold text-[#f0f6fc]">{repo.fullName}</span> to one or more custom lists.
        </div>

        {/* Create New List Inline */}
        <form onSubmit={handleCreateList} className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Create new list..."
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-xs text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff]"
          />
          <button
            type="submit"
            disabled={creating || !newListName.trim()}
            className="bg-[#21262d] hover:bg-[#30363d] border border-[#363b42] text-[#f0f6fc] text-xs px-3 py-1.5 rounded-md flex items-center space-x-1 disabled:opacity-50"
          >
            {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>Create</span>
          </button>
        </form>

        {/* List Choices */}
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-[#58a6ff]" />
          </div>
        ) : lists.length === 0 ? (
          <div className="text-center py-6 text-xs text-[#8b949e]">
            No lists created yet. Use the input above to create your first list.
          </div>
        ) : (
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {lists.map((list) => {
              const isSelected = selectedListIds.includes(list.id);
              return (
                <div
                  key={list.id}
                  onClick={() => toggleList(list.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#1f2937]/60 border-[#58a6ff]'
                      : 'bg-[#0d1117] border-[#30363d] hover:border-[#8b949e]'
                  }`}
                >
                  <div>
                    <div className="text-sm font-medium text-[#f0f6fc]">{list.name}</div>
                    {list.description && (
                      <div className="text-xs text-[#8b949e]">{list.description}</div>
                    )}
                  </div>
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center border ${
                      isSelected
                        ? 'bg-[#58a6ff] border-[#58a6ff] text-[#0d1117]'
                        : 'border-[#30363d] bg-transparent'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Save Action */}
        <div className="pt-2 border-t border-[#30363d] flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-[#8b949e] hover:text-[#f0f6fc]"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAssignments}
            disabled={saving || loading}
            className="bg-[#2ea043] hover:bg-[#2c974b] text-white text-xs font-semibold px-4 py-1.5 rounded-md flex items-center space-x-1 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>Save Lists</span>
          </button>
        </div>
      </div>
    </div>
  );
};
