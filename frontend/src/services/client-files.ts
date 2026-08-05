import { api, getAccessToken } from './api';

const API_URL = import.meta.env.VITE_API_URL ?? '/api';

export interface ClientFile {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  /** Null for documents held against the client rather than one application. */
  visaCaseId?: string | null;
}

export interface StorageUsage {
  totalSize: number;
  fileCount: number;
}

export const filesService = {
  async getFiles(clientId: string): Promise<ClientFile[]> {
    return api.get(`/clients/${clientId}/files`);
  },

  async uploadFile(clientId: string, file: File): Promise<ClientFile> {
    const formData = new FormData();
    formData.append('file', file);
    const token = getAccessToken();
    const response = await fetch(`${API_URL}/clients/${clientId}/files`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) throw new Error('Upload failed');
    return response.json();
  },

  async deleteFile(clientId: string, fileId: string): Promise<void> {
    return api.delete(`/clients/${clientId}/files/${fileId}`);
  },

  async getUsage(clientId: string): Promise<StorageUsage> {
    return api.get(`/clients/${clientId}/files/usage`);
  },

  getDownloadUrl(clientId: string, fileId: string): string {
    return `${API_URL}/clients/${clientId}/files/${fileId}/download`;
  },
};

/** Documents attached to a single visa case. */
export const visaCaseFilesService = {
  async getFiles(visaCaseId: string): Promise<ClientFile[]> {
    return api.get(`/visa-cases/${visaCaseId}/files`);
  },

  async uploadFile(visaCaseId: string, file: File): Promise<ClientFile> {
    const formData = new FormData();
    formData.append('file', file);
    const token = getAccessToken();
    const response = await fetch(`${API_URL}/visa-cases/${visaCaseId}/files`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.message ?? 'Upload failed');
    }
    return response.json();
  },

  async deleteFile(visaCaseId: string, fileId: string): Promise<void> {
    return api.delete(`/visa-cases/${visaCaseId}/files/${fileId}`);
  },

  getDownloadUrl(visaCaseId: string, fileId: string): string {
    return `${API_URL}/visa-cases/${visaCaseId}/files/${fileId}/download`;
  },
};
