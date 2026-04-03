import type { HelpTypeId, TimeOption, UrgencyLevel, RequestStatus } from './constants';

// ─── Database Models ──────────────────────────────────────────────────────────

export interface UserProfile {
    id: string;
    name: string;
    phone: string;
    verified: boolean;
    helps_completed: number;
    avatar_url?: string;
    created_at: string;
    // Production upgrade fields
    last_request_at?: string;
    avg_rating: number;
    trust_score: number;
    is_verified: boolean;
    points: number;
    badges: string[];
}

export interface HelpRequest {
    id: string;
    type: HelpTypeId;
    urgency: UrgencyLevel;
    time_needed: TimeOption;
    note?: string;
    status: RequestStatus;
    lat: number;
    lng: number;
    requested_by: string;
    accepted_by?: string;
    created_at: string;
    // Joined fields
    requester?: UserProfile;
    helper?: UserProfile;
    // Computed
    distance_meters?: number;
}

export interface Message {
    id: string;
    request_id: string;
    sender_id: string;
    message: string;
    created_at: string;
    read_at?: string;
    // Joined
    sender?: UserProfile;
}

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

// ─── Location ─────────────────────────────────────────────────────────────────

export interface Coordinates {
    latitude: number;
    longitude: number;
}

// ─── Navigation Params ────────────────────────────────────────────────────────

export interface RequestRouteParams {
    id: string;
}
