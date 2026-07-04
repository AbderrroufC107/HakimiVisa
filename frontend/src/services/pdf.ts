import { getAccessToken } from './api';

const API_URL = import.meta.env.VITE_API_URL ?? '/api';

export const pdfService = {
  async printBordereau(visaCaseId: string) {
    const token = getAccessToken();
    const response = await fetch(`${API_URL}/pdf/bordereau/${visaCaseId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) throw new Error('Failed to generate PDF');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.print();
        } finally {
          window.URL.revokeObjectURL(url);
          setTimeout(() => document.body.removeChild(iframe), 1000);
        }
      }, 500);
    };

    iframe.src = url;
  },
};
