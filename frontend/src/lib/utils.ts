import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, locale = 'en-US', options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, options).format(d);
}

export function formatNumber(num: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(num);
}

export function formatCurrency(amount: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function exportToCSV(data: any, filename = 'export.csv'): void {
  const csv = convertToCSV(data);
  downloadFile(csv, filename, 'text/csv');
}

export function exportToPDF(title: string, data: any, filename = 'export.pdf'): void {
  // Simple PDF generation using browser print
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  const html = generatePDFHTML(title, data);
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    setTimeout(() => printWindow.close(), 1000);
  }, 500);
}

function convertToCSV(data: any): string {
  if (Array.isArray(data)) {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
    return [headers.join(','), ...rows].join('\n');
  }
  
  // Handle nested objects
  const rows: string[] = [];
  const flatten = (obj: any, prefix = '') => {
    Object.entries(obj).forEach(([key, value]) => {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (Array.isArray(value)) {
        if (value.length > 0 && typeof value[0] === 'object') {
          value.forEach((v, i) => flatten(v, `${newKey}[${i}]`));
        } else {
          rows.push(`${newKey},${value.join(';')}`);
        }
      } else if (value && typeof value === 'object') {
        flatten(value, newKey);
      } else {
        rows.push(`${newKey},${JSON.stringify(value ?? '')}`);
      }
    });
  };
  
  flatten(data);
  return rows.join('\n');
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function generatePDFHTML(title: string, data: any): string {
  const formatValue = (val: any): string => {
    if (Array.isArray(val)) return val.map(formatValue).join(', ');
    if (val && typeof val === 'object') return JSON.stringify(val, null, 2);
    return String(val ?? '');
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
        h1 { color: #1e293b; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px; }
        h2 { color: #334155; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
        th { background: #f1f5f9; font-weight: 600; }
        pre { background: #f8fafc; padding: 10px; border-radius: 4px; overflow-x: auto; }
        .section { margin-bottom: 30px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
      ${Object.entries(data).map(([key, value]) => `
        <div class="section">
          <h2>${key.charAt(0).toUpperCase() + key.slice(1)}</h2>
          ${Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' ? `
            <table>
              <thead><tr>${Object.keys(value[0]).map(k => `<th>${k}</th>`).join('')}</tr></thead>
              <tbody>${value.map((v: any) => `<tr>${Object.values(v).map(val => `<td>${formatValue(val)}</td>`).join('')}</tr>`).join('')}</tbody>
            </table>
          ` : `<pre>${formatValue(value)}</pre>`}
        </div>
      `).join('')}
    </body>
    </html>
  `;
  return html;
}