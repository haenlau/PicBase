import { getDatabase } from '../databaseAdapter.js';

const RATE_LIMIT_PREFIX = 'manage@loginRate@';
const WINDOW_SECONDS = 15 * 60;
const LOCK_SECONDS = 15 * 60;
const MAX_FAILURES = 10;

export async function checkLoginRateLimit(env, request, scope, identifier = '') {
    const record = await readRecord(env, request, scope, identifier);
    if (!record || !record.lockedUntil) {
        return { limited: false };
    }

    const now = Date.now();
    if (now >= record.lockedUntil) {
        await clearLoginFailures(env, request, scope, identifier);
        return { limited: false };
    }

    return {
        limited: true,
        retryAfter: Math.max(1, Math.ceil((record.lockedUntil - now) / 1000)),
    };
}

export async function recordLoginFailure(env, request, scope, identifier = '') {
    const db = getDatabase(env);
    const key = await buildRateLimitKey(request, scope, identifier);
    const now = Date.now();
    const record = await readRecordByKey(db, key);
    const firstFailureAt = record?.firstFailureAt && now - record.firstFailureAt < WINDOW_SECONDS * 1000
        ? record.firstFailureAt
        : now;
    const failures = firstFailureAt === record?.firstFailureAt ? (record.failures || 0) + 1 : 1;
    const lockedUntil = failures >= MAX_FAILURES ? now + LOCK_SECONDS * 1000 : 0;

    await db.put(key, JSON.stringify({ failures, firstFailureAt, lockedUntil }), {
        expirationTtl: lockedUntil ? LOCK_SECONDS : WINDOW_SECONDS,
    });

    return {
        limited: lockedUntil > now,
        retryAfter: lockedUntil ? LOCK_SECONDS : 0,
    };
}

export async function clearLoginFailures(env, request, scope, identifier = '') {
    const db = getDatabase(env);
    await db.delete(await buildRateLimitKey(request, scope, identifier));
}

function getClientIp(request) {
    const headerNames = [
        'cf-connecting-ip',
        'true-client-ip',
        'x-real-ip',
        'x-forwarded-for',
    ];

    for (const name of headerNames) {
        const value = request.headers.get(name);
        if (value) {
            return value.split(',')[0].trim();
        }
    }

    return 'unknown';
}

async function buildRateLimitKey(request, scope, identifier) {
    const raw = `${scope}:${getClientIp(request)}:${identifier || ''}`;
    const hash = await sha256Hex(raw);
    return `${RATE_LIMIT_PREFIX}${scope}@${hash}`;
}

async function readRecord(env, request, scope, identifier) {
    const db = getDatabase(env);
    return readRecordByKey(db, await buildRateLimitKey(request, scope, identifier));
}

async function readRecordByKey(db, key) {
    const value = await db.get(key);
    if (!value) return null;

    try {
        return JSON.parse(value);
    } catch {
        await db.delete(key);
        return null;
    }
}

async function sha256Hex(value) {
    const bytes = new TextEncoder().encode(value);
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
