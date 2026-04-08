// ─── Imports ────────────────────────────────────────────────────────────────

import type { HelpTypeId, TimeOption, UrgencyLevel, RequestStatus } from './constants';

// ─── Database Models ─────────────────────────────────────────────────────────

// ✅ User profile
export interface UserProfile {
    id: string;
    name: string;
    phone: string;
    verified: boolean;
    helps_completed: number;
    avatar_url?: string;
    created_at: string;

    // Extended fields
    last_request_at?: string;
    avg_rating: number;
    trust_score: number;
    is_verified: boolean;
    points: number;
    badges: string[];
}

// ✅ Help request
export interface HelpRequest {
    id: string;
    type: HelpTypeId;
    urgency: UrgencyLevel;
    time_needed: TimeOption;
    note?: string;
    status: RequestStatus;

    lat: number;
    lng: number;

    // 🔥 MUST match DB column name exactly
    requested_by: string;

    // Optional fields
    accepted_by?: string;
    created_at: string;

    // Joined relations (from Supabase select)
    requester?: UserProfile;
    helper?: UserProfile;

    // Computed field (from RPC)
    distance_meters?: number;
}

// ✅ Chat message
export interface Message {
    id: string;
    request_id: string;
    sender_id: string;
    message: string;
    created_at: string;
    read_at?: string;

    // Joined sender
    sender?: UserProfile;
}

// ✅ Active session
export interface ActiveSession {
    id: string;
    request_id: string;

    live_location_enabled: boolean;
    panic_triggered: boolean;

    requester_lat?: number;
    requester_lng?: number;
    helper_lat?: number;
    helper_lng?: number;

    created_at: string;
}

// ─── Location ────────────────────────────────────────────────────────────────

export interface Coordinates {
    latitude: number;
    longitude: number;
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export interface RequestRouteParams {
    id: string;
}