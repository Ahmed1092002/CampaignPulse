import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock lucide-react - return simple string components
vi.mock('lucide-react', () => {
  const icons = {};
  const iconNames = [
    'Menu', 'X', 'ChevronDown', 'ChevronUp', 'ChevronLeft', 'ChevronRight',
    'Plus', 'Minus', 'Search', 'Filter', 'MoreHorizontal', 'Edit', 'Trash2',
    'Eye', 'ExternalLink', 'Copy', 'Download', 'Loader2', 'CheckCircle',
    'AlertCircle', 'AlertTriangle', 'Info', 'Mail', 'Lock', 'User', 'UserPlus',
    'Users', 'LogOut', 'Settings', 'Moon', 'Sun', 'Monitor', 'Globe', 'Bell',
    'Zap', 'Target', 'LayoutDashboard', 'BarChart2', 'Sparkles', 'MessageSquare',
    'MousePointerClick', 'UserPlus', 'Save', 'QrCode', 'Shield', 'Crown',
    'ArrowRight', 'Calendar', 'DollarSign', 'Hash', 'TrendingUp', 'ArrowUpRight', 'Star', 'Image'
  ];

  for (const name of iconNames) {
    icons[name] = ({ className, ...props }: any) => 
      `svg[data-testid="icon-${name.toLowerCase()}"]`;
  }
  return icons;
});

// Mock cookies-next
vi.mock('cookies-next', () => ({
  getCookie: vi.fn(),
  setCookie: vi.fn(),
  deleteCookie: vi.fn(),
}));

// Mock recharts
vi.mock('recharts', () => ({
  LineChart: ({ children, ...props }: any) => `div[data-testid="line-chart"]`,
  Line: ({ ...props }: any) => `div[data-testid="line"]`,
  AreaChart: ({ children, ...props }: any) => `div[data-testid="area-chart"]`,
  Area: ({ ...props }: any) => `div[data-testid="area"]`,
  BarChart: ({ children, ...props }: any) => `div[data-testid="bar-chart"]`,
  Bar: ({ ...props }: any) => `div[data-testid="bar"]`,
  PieChart: ({ children, ...props }: any) => `div[data-testid="pie-chart"]`,
  Pie: ({ ...props }: any) => `div[data-testid="pie"]`,
  Cell: ({ ...props }: any) => `div[data-testid="cell"]`,
  XAxis: ({ ...props }: any) => `div[data-testid="x-axis"]`,
  YAxis: ({ ...props }: any) => `div[data-testid="y-axis"]`,
  CartesianGrid: ({ ...props }: any) => `div[data-testid="cartesian-grid"]`,
  Tooltip: ({ ...props }: any) => `div[data-testid="tooltip"]`,
  ResponsiveContainer: ({ children, ...props }: any) => `div[data-testid="responsive-container"]`,
}));

Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
});

Object.defineProperty(global, 'ResizeObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
});