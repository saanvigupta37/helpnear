import type { HelpTypeId } from '@/lib/constants';

// ─── Keyword → Help Type Mapping ─────────────────────────────

const KEYWORD_MAP: Record<string, HelpTypeId> = {
    // carry / heavy
    carry: 'carry', carrying: 'carry', luggage: 'carry', bag: 'carry', box: 'carry',
    boxes: 'carry', groceries: 'carry', grocery: 'carry', heavy: 'carry', lift: 'carry',
    move: 'carry', moving: 'carry', floor: 'carry',
    // directions
    lost: 'directions', directions: 'directions', direction: 'directions',
    where: 'directions', route: 'directions', map: 'directions', navigate: 'directions',
    metro: 'directions', street: 'directions', exit: 'directions',
    // emergency
    emergency: 'emergency', accident: 'emergency', fallen: 'emergency',
    urgent: 'emergency', hurt: 'emergency', injured: 'emergency', danger: 'emergency',
    help: 'emergency', sos: 'emergency', stuck: 'emergency',
    // medical
    medical: 'medical', medicine: 'medical', medication: 'medical', sick: 'medical',
    doctor: 'medical', hospital: 'medical', pharmacy: 'medical', unwell: 'medical',
    pill: 'medical', ambulance: 'medical',
    // vehicle
    car: 'vehicle', bike: 'vehicle', vehicle: 'vehicle', tyre: 'vehicle',
    tire: 'vehicle', flat: 'vehicle', petrol: 'vehicle', fuel: 'vehicle',
    push: 'vehicle', breakdown: 'vehicle',
    // tech
    phone: 'tech', laptop: 'tech', computer: 'tech', wifi: 'tech', internet: 'tech',
    tech: 'tech', charger: 'tech', battery: 'tech', password: 'tech', app: 'tech',
    // companion
    alone: 'companion', company: 'companion', companion: 'companion',
    accompany: 'companion', walk: 'companion', escort: 'companion', safe: 'companion',
    // errand
    errand: 'errand', shop: 'errand', shopping: 'errand', buy: 'errand',
    fetch: 'errand', pickup: 'errand', deliver: 'errand', delivery: 'errand',
};

/**
 * Infer the most likely help type from a freeform note.
 * Returns null if no strong match found.
 */
export function inferHelpType(note: string): HelpTypeId | null {
    const words = note
        .toLowerCase()
        .replace(/[^a-z\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean);

    const scores: Partial<Record<HelpTypeId, number>> = {};

    for (const word of words) {
        const match = KEYWORD_MAP[word];
        if (match) scores[match] = (scores[match] ?? 0) + 1;
    }

    const best = Object.entries(scores).sort(([, a], [, b]) => b - a)[0];
    return best ? (best[0] as HelpTypeId) : null;
}

// ─── Spam Detection ──────────────────────────────────────────

const SPAM_KEYWORDS = [
    'test', 'testing', 'abc', 'xyz', 'asdfgh', 'qwerty',
    'spam', 'fake', 'dummy', 'lol', 'haha', 'random',
];

/**
 * Detect likely spam requests.
 * Flags short gibberish notes, repeated keywords, or high recent request frequency.
 */
export function detectSpam(note: string, recentRequestCount: number): boolean {
    const lower = note.toLowerCase().trim();

    // Too short to be meaningful
    if (lower.length > 0 && lower.length < 8) return true;

    // Contains spam keywords
    if (SPAM_KEYWORDS.some((kw) => lower.includes(kw))) return true;

    // Repeated same character (e.g. "aaaaaaa")
    if (/(.)\1{5,}/.test(lower)) return true;

    // Too many recent requests (more than 3 in a short window)
    if (recentRequestCount >= 3) return true;

    return false;
}
