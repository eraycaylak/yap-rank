// ════════════════════════════════════════════════════════════
// SUPABASE HELPERS
// ════════════════════════════════════════════════════════════
import { SB_URL, SB_KEY } from '../config.js';

const HEADERS = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json',
};

/** GET request to Supabase REST API */
export function sb(path) {
  return fetch(`${SB_URL}${path}`, { headers: HEADERS });
}

/** POST to Supabase RPC function */
export function sbRpc(fn, body = {}) {
  return fetch(`${SB_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body),
  });
}
