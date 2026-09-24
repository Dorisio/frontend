/**
 * Message Search Store
 * Handles searching and filtering tip messages on the dashboard
 */

import { create } from 'zustand';

interface MessageSearchStore {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  getFilteredMessages: (
    messages: Array<{ id: string; content: string; senderName: string }>
  ) => Array<{ id: string; content: string; senderName: string }>;
}

export const useMessageSearchStore = create<MessageSearchStore>((set, get) => ({
  searchQuery: '',
  setSearchQuery: (query: string) => set({ searchQuery: query.toLowerCase() }),
  clearSearch: () => set({ searchQuery: '' }),
  getFilteredMessages: (messages) => {
    const query = get().searchQuery;
    if (!query) return messages;

    return messages.filter(
      (msg) =>
        msg.content.toLowerCase().includes(query) ||
        msg.senderName.toLowerCase().includes(query)
    );
  },
}));
