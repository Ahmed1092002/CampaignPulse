import 'next-intl';
import type { messages } from './en';

declare module 'next-intl' {
  interface AppConfig {
    Messages: typeof messages;
  }
}