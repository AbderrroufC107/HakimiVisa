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
            const win = iframe.contentWindow;
            if (!win) {
              window.URL.revokeObjectURL(url);
              try { document.body.removeChild(iframe); } catch {}
              resolve();
              return;
            }

            const cleanup = () => {
              window.URL.revokeObjectURL(url);
              setTimeout(() => {
                try { document.body.removeChild(iframe); } catch {}
                resolve();
              }, 500);
            };

            win.addEventListener('afterprint', cleanup);
            win.print();
          }, 100);
        };
        iframe.src = url;
      });
    } finally {
      printing = false;
    }
  },
};
