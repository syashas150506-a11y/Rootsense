export const Colors = {
  // Primary Palette
  warmIvory: '#FDF2E9',      // App Background (55%)
  softCream: '#FCEEDC',      // Card Background
  palePeach: '#FDE7CA',      // Accent Highlights (10%)
  goldenWheat: '#D6BA8C',    // Warning Indicators / Golden Accent
  oliveGreen: '#647A13',     // Primary Buttons / Success (15%)
  deepOlive: '#3E5208',      // Dark Olive accents

  // Secondary Palette
  sageGreen: '#8B9363',      // Charts & Indicators
  lightSage: '#DCE6C6',      // Subtle badge backgrounds
  sandBeige: '#ECE0C2',      // Borders & Dividers
  charcoal: '#25251F',       // Primary Text
  mutedGrey: '#77756E',      // Secondary Text
  pureWhite: '#FFFFFF',      // Button text, Secondary surfaces (15%)

  // Semantic mappings
  background: '#FDF2E9',
  card: '#FCEEDC',
  cardSecondary: '#FFFFFF',
  textPrimary: '#25251F',
  textSecondary: '#77756E',
  textMuted: '#96948D',
  primaryButton: '#647A13',
  primaryButtonHover: '#536510',
  buttonText: '#FFFFFF',
  border: '#ECE0C2',
  borderFocus: '#647A13',
  accent: '#FDE7CA',
  success: '#647A13',
  warning: '#D6BA8C',
  error: '#C65A42',

  // Overlays
  overlayDark: 'rgba(37, 37, 31, 0.45)',
  overlayGradientTop: 'rgba(37, 37, 31, 0.2)',
  overlayGradientBottom: 'rgba(37, 37, 31, 0.85)',
};

export const Typography = {
  fontFamilies: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    display: 32,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const Shadows = {
  soft: {
    shadowColor: '#3E5208',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    shadowColor: '#25251F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  elevated: {
    shadowColor: '#25251F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};
