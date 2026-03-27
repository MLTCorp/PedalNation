// PedalNation Design System - Color Constants

export const colors = {
  // Backgrounds
  background: '#0F0F0F',
  surface: '#1A1A1A',
  surfaceElevated: '#242424',
  border: '#2A2A2A',

  // Accent
  accent: '#FF6B35',
  accentHover: '#FF8555',
  accentMuted: 'rgba(255, 107, 53, 0.15)',

  // Text
  textPrimary: '#F5F5F5',
  textSecondary: '#A0A0A0',
  textMuted: '#606060',

  // Status
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Light mode overrides
  light: {
    background: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceElevated: '#F4F4F5',
    border: '#E4E4E7',
    textPrimary: '#09090B',
    textSecondary: '#71717A',
    textMuted: '#A1A1AA',
  }
} as const;

export const typography = {
  fontSans: '"Inter", system-ui, -apple-system, sans-serif',
  fontMono: '"JetBrains Mono", "Fira Code", monospace',
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
} as const;

export const radius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const;

export type Colors = typeof colors;
export type Typography = typeof typography;
