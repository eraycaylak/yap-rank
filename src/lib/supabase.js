// ════════════════════════════════════════════════════════════
// SUPABASE HELPERS — with timeout protection
// ════════════════════════════════════════════════════════════
import { SB_URL, SB_KEY } from '../config.js';

const HEADERS = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json',
};

const TIMEOUT = 8000; // 8 second timeout

function fetchWithTimeout(url, opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  return fetch(url, { ...opts, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

/** GET request to Supabase REST API */
export function sb(path) {
  return fetchWithTimeout(`${SB_URL}${path}`, { headers: HEADERS });
}

/** POST to Supabase RPC function */
export function sbRpc(fn, body = {}) {
  return fetchWithTimeout(`${SB_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body),
  });
}
