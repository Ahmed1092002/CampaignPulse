import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale } from './config';

export default getRequestConfig(async ({ locale }) => {
  const validatedLocale = locales.includes(locale as any) ? locale : defaultLocale;
  
  return {
    locale: validatedLocale,
    messages: (await import(`../messages/${validatedLocale}.json`)).default,
  };
});