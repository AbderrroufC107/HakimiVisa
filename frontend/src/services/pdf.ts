import { getAccessToken } from './api';

const API_URL = import.meta.env.VITE_API_URL ?? '/api';

let printing = false;

export const pdfService = {
  isPrinting: () => printing,

  async printBordereau(visaCaseId: string) {
    if (printing) return;
    printing = true;

    try {
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

      return new Promise<void>((resolve) => {
        iframe.onload = () => {
          setTimeout(() => {
            try {
              iframe.contentWindow?.print();
            } finally {
              window.URL.revokeObjectURL(url);
              setTimeout(() => {
                document.body.removeChild(iframe);
                resolve();
              }, 300);
            }
          }, 50);
        };
        iframe.src = url;
      });
    } finally {
      printing = false;
    }
  },
};
