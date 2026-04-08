// ─── App-wide Constants ──────────────────────────────────────────────────────

export const HELP_RADIUS_METERS = 500;

export const HELP_TYPES = [
    { id: 'carry', label: 'Carrying', icon: '📦' },
    { id: 'directions', label: 'Directions', icon: '🗺️' },
    { id: 'emergency', label: 'Emergency', icon: '🚨' },
    { id: 'medical', label: 'Medical', icon: '💊' },
    { id: 'vehicle', label: 'Vehicle', icon: '🚗' },
    { id: 'tech', label: 'Tech Help', icon: '💻' },
    { id: 'companion', label: 'Companion', icon: '🤝' },
    { id: 'errand', label: 'Errand', icon: '🛍️' },
] as const;

export type HelpTypeId = (typeof HELP_TYPES)[number]['id'];

export const TIME_OPTIONS = [10, 20, 30] as const;
export type TimeOption = (typeof TIME_OPTIONS)[number];

// ✅ Must match DB exactly
export const URGENCY_LEVELS = ['Normal', 'Urgent'] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

// ✅ Must match DB exactly (CRITICAL FIX)
export const REQUEST_STATUSES = ['Open', 'Accepted', 'Done', 'Cancelled'] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

// ✅ Optional helper (makes UI + debugging easier)
export const STATUS_LABELS: Record<RequestStatus, string> = {
    Open: 'Open',
    Accepted: 'Accepted',
    Done: 'Completed',
    Cancelled: 'Cancelled',
};

// ─── Colors ───────────────────────────────────────────────────────────────────

export const Colors = {
    background: '#0A0E1A',
    surface: '#141928',
    surfaceElevated: '#1E2538',
    primary: '#3B82F6',
    primaryDark: '#2563EB',
    primaryLight: '#60A5FA',
    danger: '#EF4444',
    dangerDark: '#DC2626',
    warning: '#F59E0B',
    success: '#10B981',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#475569',
    border: '#1E2D3D',
    borderLight: '#2D3E52',
    white: '#FFFFFF',
    overlay: 'rgba(10, 14, 26, 0.85)',
} as const;

// ─── Typography ──────────────────────────────────────────────────────────────

export const FontSizes = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    '2xl': 26,
    '3xl': 32,
} as const;

// ─── Emergency ───────────────────────────────────────────────────────────────

// ✅ India universal emergency number
export const EMERGENCY_NUMBER = '112';