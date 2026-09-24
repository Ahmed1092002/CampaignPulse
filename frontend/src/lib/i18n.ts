import { notFound } from 'next/navigation';
import { locales, defaultLocale } from './config';

export function getMessages(locale: string) {
  try {
    return require(`../messages/${locale}.json`);
  } catch {
    notFound();
  }
}

export function getLocaleFromPath(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return defaultLocale;
  
  const potentialLocale = segments[0];
  if (locales.includes(potentialLocale as any)) {
    return potentialLocale;
  }
  
  return defaultLocale;
}