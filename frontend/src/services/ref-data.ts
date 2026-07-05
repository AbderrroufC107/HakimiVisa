import { api } from './api';

export const refDataService = {
  async getCountries() {
    return api.get<string[]>('/ref-data/countries');
  },
  async addCountry(name: string) {
    return api.post<{ name: string }>('/ref-data/countries', { name });
  },
  async getVisaTypes() {
    return api.get<string[]>('/ref-data/visa-types');
  },
  async addVisaType(name: string) {
    return api.post<{ name: string }>('/ref-data/visa-types', { name });
  },
};
