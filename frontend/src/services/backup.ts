import { api, getAccessToken } from './api';

const API_URL = import.meta.env.VITE_API_URL ?? '/api';

export interface Backup {
  id: string;
  filename: string;
  size: number;
  status: string;
  type: string;
  createdById: string;
  createdBy: { id: string; firstName: string; lastName: string };
  createdAt: string;
}

export interface BackupSettings {
  enabled: boolean;
  frequency: string;
  time: string;
  retentionDays: number;
  maxBackups: number;
}

export const backupService = {
  async create(): Promise<Backup> {
    return api.post<Backup>('/backups');
  },

  async findAll(): Promise<Backup[]> {
    return api.get<Backup[]>('/backups');
  },

  async getSettings(): Promise<BackupSettings> {
    return api.get<BackupSettings>('/backups/settings');
  },

  async updateSettings(data: Partial<BackupSettings>): Promise<BackupSettings> {
    return api.post<BackupSettings>('/backups/settings', data);
  },

  async download(id: string): Promise<Blob> {
    const token = getAccessToken();
    const res = await fetch(`${API_URL}/backups/${id}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Download failed');
    return res.blob();
  },

  async remove(id: string): Promise<void> {
    return api.delete(`/backups/${id}`);
  },
};
