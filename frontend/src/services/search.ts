import { api } from './api';

export interface SearchResult {
  id: string;
  label: string;
  sublabel: string;
  href: string;
  type: 'client' | 'visa-case' | 'appointment';
}

export interface SearchResults {
  clients: SearchResult[];
  visaCases: SearchResult[];
  appointments: SearchResult[];
}

export const searchService = {
  search(q: string) {
    return api.get<SearchResults>('/search', { q });
  },
};
