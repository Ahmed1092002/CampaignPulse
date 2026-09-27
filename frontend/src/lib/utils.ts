import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, subDays } from 'date-fns';

export { format, subDays } from 'date-fns';

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

export function formatPercent(num: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(num / 100);
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

export function convertToCSV(data: any): string {
  const summary = data.summary || {};
  const rows = [['Metric', 'Value'], ...Object.entries(summary).map(([k, v]) => [k, v])];
  return rows.map(r => r.join(',')).join('\n');
}

export function downloadFile(content: string, filename: string, mimeType: string) {
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

export async function exportToPDF(title: string, data: any, filename: string) {
  try {
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    // Title
    pdf.setFontSize(24);
    pdf.setTextColor(30, 58, 138); // blue-700
    pdf.text(title, margin, yPos);
    yPos += 10;

    // Date range
    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139); // slate-500
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, margin, yPos);
    yPos += 10;

    // Summary
    if (data.summary) {
      pdf.setFontSize(14);
      pdf.setTextColor(15, 23, 42); // slate-900
      pdf.text('Summary', margin, yPos);
      yPos += 8;

      pdf.setFontSize(10);
      Object.entries(data.summary).forEach(([key, value]) => {
        if (yPos > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
        }
        pdf.setFont(undefined, 'bold');
        pdf.text(`${key}:`, margin, yPos);
        pdf.setFont(undefined, 'normal');
        pdf.text(String(value), margin + 60, yPos);
        yPos += 6;
      });
      yPos += 5;
    }

    // Daily Trends Table
    if (data.dailyTrends?.length) {
      if (yPos > pageHeight - 60) {
        pdf.addPage();
        yPos = margin;
      }
      pdf.setFontSize(14);
      pdf.setTextColor(15, 23, 42);
      pdf.text('Daily Trends', margin, yPos);
      yPos += 8;

      // Table header
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'bold');
      const colWidths = [40, 30, 30, 30, 30];
      const headers = ['Date', 'Visits', 'Leads', 'Conv. Rate', 'CTR'];
      let xPos = margin;
      headers.forEach((header, i) => {
        pdf.text(header, xPos, yPos);
        xPos += colWidths[i];
      });
      yPos += 6;

      // Table rows
      pdf.setFont(undefined, 'normal');
      data.dailyTrends.slice(0, 30).forEach((row: any) => {
        if (yPos > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
        }
        xPos = margin;
        pdf.text(formatDate(row.date, undefined, { month: 'short', day: 'numeric' }), xPos, yPos);
        xPos += colWidths[0];
        pdf.text(formatNumber(row.visits), xPos, yPos);
        xPos += colWidths[1];
        pdf.text(formatNumber(row.leads), xPos, yPos);
        xPos += colWidths[2];
        pdf.text(`${row.conversionRate?.toFixed(1) || 0}%`, xPos, yPos);
        xPos += colWidths[3];
        pdf.text(`${row.ctr?.toFixed(1) || 0}%`, xPos, yPos);
        yPos += 5;
      });
      yPos += 5;
    }

    // Funnel
    if (data.funnel) {
      if (yPos > pageHeight - 50) {
        pdf.addPage();
        yPos = margin;
      }
      pdf.setFontSize(14);
      pdf.setTextColor(15, 23, 42);
      pdf.text('Conversion Funnel', margin, yPos);
      yPos += 8;

      pdf.setFontSize(10);
      const funnelSteps = [
        { label: 'Visits', value: data.funnel.visits || data.summary?.['Total Visits'] || 0 },
        { label: 'CTA Clicks', value: data.funnel.ctaClicks || 0 },
        { label: 'Form Starts', value: data.funnel.formStarts || 0 },
        { label: 'Form Submits', value: data.funnel.formSubmits || data.summary?.['Total Leads'] || 0 },
      ];

      funnelSteps.forEach((step, i) => {
        const percentage = i === 0 ? 100 : ((step.value / funnelSteps[0].value) * 100).toFixed(1);
        pdf.setFont(undefined, 'bold');
        pdf.text(`${step.label}:`, margin, yPos);
        pdf.setFont(undefined, 'normal');
        pdf.text(`${formatNumber(step.value)} (${percentage}%)`, margin + 60, yPos);
        yPos += 6;
      });
      yPos += 5;
    }

    // Leads by Source
    if (data.leadsBySource?.length) {
      if (yPos > pageHeight - 40) {
        pdf.addPage();
        yPos = margin;
      }
      pdf.setFontSize(14);
      pdf.setTextColor(15, 23, 42);
      pdf.text('Leads by Source', margin, yPos);
      yPos += 8;

      pdf.setFontSize(10);
      data.leadsBySource.slice(0, 10).forEach((source: any) => {
        if (yPos > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
        }
        pdf.setFont(undefined, 'bold');
        pdf.text(source.source, margin, yPos);
        pdf.setFont(undefined, 'normal');
        pdf.text(`${formatNumber(source.count)} (${source.percentage?.toFixed(1) || 0}%)`, margin + 60, yPos);
        yPos += 6;
      });
      yPos += 5;
    }

    // Devices
    if (data.devices?.length) {
      if (yPos > pageHeight - 30) {
        pdf.addPage();
        yPos = margin;
      }
      pdf.setFontSize(14);
      pdf.setTextColor(15, 23, 42);
      pdf.text('Device Breakdown', margin, yPos);
      yPos += 8;

      pdf.setFontSize(10);
      data.devices.forEach((device: any) => {
        pdf.setFont(undefined, 'bold');
        pdf.text(device.device, margin, yPos);
        pdf.setFont(undefined, 'normal');
        pdf.text(`${formatNumber(device.count)} (${device.percentage?.toFixed(1) || 0}%)`, margin + 60, yPos);
        yPos += 6;
      });
      yPos += 5;
    }

    // Geo
    if (data.geo?.length) {
      if (yPos > pageHeight - 40) {
        pdf.addPage();
        yPos = margin;
      }
      pdf.setFontSize(14);
      pdf.setTextColor(15, 23, 42);
      pdf.text('Top Countries', margin, yPos);
      yPos += 8;

      pdf.setFontSize(9);
      data.geo.slice(0, 15).forEach((country: any) => {
        if (yPos > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
        }
        pdf.setFont(undefined, 'bold');
        pdf.text(`${country.flag || ''} ${country.country}`, margin, yPos);
        pdf.setFont(undefined, 'normal');
        pdf.text(`${formatNumber(country.visits)} visits, ${formatNumber(country.leads)} leads (${country.conversionRate?.toFixed(1) || 0}%)`, margin + 60, yPos);
        yPos += 5;
      });
    }

    pdf.save(filename);
  } catch (error) {
    console.error('PDF export failed, falling back to CSV:', error);
    const csv = convertToCSV(data);
    downloadFile(csv, filename.replace('.pdf', '.csv'), 'text/csv');
  }
}