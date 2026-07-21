import { api } from './api';

export interface RefDataItem {
  id: string;
  name: string;
}

export const refDataService = {
  async getCountries() {
    const data = await api.get<RefDataItem[]>('/ref-data/countries');
    return data.map((c) => c.name);
  },
  async getCountriesFull() {
    return api.get<RefDataItem[]>('/ref-data/countries');
  },
  async addCountry(name: string) {
    return api.post<{ name: string }>('/ref-data/countries', { name });
  },
  async updateCountry(id: string, name: string) {
    return api.patch<RefDataItem>(`/ref-data/countries/${id}`, { name });
  },
  async removeCountry(id: string) {
    return api.delete<void>(`/ref-data/countries/${id}`);
  },
  async getVisaTypes() {
    const data = await api.get<RefDataItem[]>('/ref-data/visa-types');
    return data.map((v) => v.name);
  },
  async getVisaTypesFull() {
    return api.get<RefDataItem[]>('/ref-data/visa-types');
  },
  async addVisaType(name: string) {
    return api.post<{ name: string }>('/ref-data/visa-types', { name });
  },
  async updateVisaType(id: string, name: string) {
    return api.patch<RefDataItem>(`/ref-data/visa-types/${id}`, { name });
  },
  async removeVisaType(id: string) {
    return api.delete<void>(`/ref-data/visa-types/${id}`);
  },
};
