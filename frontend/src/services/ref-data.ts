import { api } from './api';

export const refDataService = {
  async getCountries() {
    const data = await api.get<{ id: string; name: string }[]>('/ref-data/countries');
    return data.map((c) => c.name);
  },
  async addCountry(name: string) {
    return api.post<{ name: string }>('/ref-data/countries', { name });
  },
  async getVisaTypes() {
    const data = await api.get<{ id: string; name: string }[]>('/ref-data/visa-types');
    return data.map((v) => v.name);
  },
  async addVisaType(name: string) {
    return api.post<{ name: string }>('/ref-data/visa-types', { name });
  },
};
