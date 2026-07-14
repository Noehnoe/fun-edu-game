/* ===================================================================
   Brainy Bunch — backend API  (Cloudflare Pages Functions + D1)
   Routes under /api/*  ->  register, login, me, sync, leaderboard, logout
   D1 binding name: DB   (configured in wrangler.toml / Pages dashboard)
   =================================================================== */

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };
const SESSION_DAYS = 60;                 // token lifetime
const MAX_SAVE_BYTES = 128 * 1024;       // 128 KB cap on a save blob
const MAX_COINS = 100_000_000_000;       // sane cap for leaderboard values
const PBKDF2_ITERS = 100_000;

/* ---------- small helpers ---------- */
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}
function bad(msg, status = 400) { return json({ error: msg }, status); }

function toHex(buf) {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function randomHex(bytes = 16) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return toHex(a.buffer);
}

/* constant-time-ish string compare */
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function pbkdf2(text, saltHex) {
  const enc = new TextEncoder();
  const salt = Uint8Array.from(saltHex.match(/.{2}/g).map(h => parseInt(h, 16)));
  const key = await crypto.subtle.importKey('raw', enc.encode(text), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERS, hash: 'SHA-256' },
    key, 256
  );
  return toHex(bits);
}
async function makeHash(text) {
  const salt = randomHex(16);
  const hash = await pbkdf2(text, salt);
  return { hash, salt };
}
async function checkHash(text, hash, salt) {
  if (!hash || !salt) return false;
  return safeEqual(await pbkdf2(text, salt), hash);
}

/* ---------- validation ---------- */
function normUser(u) { return String(u || '').trim().toLowerCase(); }
function validUsername(u) { return /^[a-z0-9_]{3,20}$/.test(u); }

function sanitiseCoins(n) {
  n = Math.floor(Number(n));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, MAX_COINS);
}

/* ---------- auth helpers ---------- */
async function newSession(db, userId) {
  const token = randomHex(32);
  const now = Date.now();
  const expires = now + SESSION_DAYS * 86400_000;
  await db.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?,?,?,?)')
    .bind(token, userId, now, expires).run();
  return token;
}
function bearer(request) {
  const h = request.headers.get('Authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}
async function userFromToken(db, token) {
  if (!token) return null;
  const row = await db.prepare(
    `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > ?`
  ).bind(token, Date.now()).first();
  return row || null;
}
function publicUser(u) {
  return {
    id: u.id, username: u.display_name, coins: u.coins, level: u.level,
    hasPhrase: !!u.phrase_hash
  };
}

/* ===================================================================
   Router
   =================================================================== */
export async function onRequest(context) {
  const { request, env, params } = context;
  const db = env.DB;
  const path = (Array.isArray(params.path) ? params.path.join('/') : params.path || '').toLowerCase();

  if (!db) return bad('Database not connected. Bind D1 as "DB" in the Pages settings.', 500);

  try {
    if (request.method === 'POST' && path === 'register')   return register(request, db);
    if (request.method === 'POST' && path === 'login')      return login(request, db);
    if (request.method === 'POST' && path === 'logout')     return logout(request, db);
    if (request.method === 'GET'  && path === 'me')         return me(request, db);
    if (request.method === 'POST' && path === 'sync')       return sync(request, db);
    if (request.method === 'GET'  && path === 'leaderboard')return leaderboard(request, db);
    return bad('Not found', 404);
  } catch (err) {
    return bad('Server error: ' + (err && err.message ? err.message : 'unknown'), 500);
  }
}

/* ---------- POST /api/register ---------- */
async function register(request, db) {
  const body = await request.json().catch(() => ({}));
  const username = normUser(body.username);
  const display = String(body.username || '').trim();
  const password = String(body.password || '');
  const phrase = body.phrase != null ? String(body.phrase) : '';

  if (!validUsername(username)) return bad('Username must be 3–20 letters, numbers or underscores.');
  if (password.length < 6) return bad('Password must be at least 6 characters.');
  if (phrase && phrase.length < 4) return bad('Security phrase must be at least 4 characters (or leave it blank).');

  const exists = await db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
  if (exists) return bad('That username is already taken.', 409);

  const p = await makeHash(password);
  const ph = phrase ? await makeHash(phrase) : { hash: null, salt: null };

  // Optional: carry over guest progress sent from the client
  let save = null, coins = 0, level = 1;
  if (body.save && typeof body.save === 'object') {
    const str = JSON.stringify(body.save);
    if (str.length <= MAX_SAVE_BYTES) {
      save = str;
      coins = sanitiseCoins(body.coins);
      level = Math.max(1, Math.floor(Number(body.level) || 1));
    }
  }

  const now = Date.now();
  const res = await db.prepare(
    `INSERT INTO users (username, display_name, pass_hash, pass_salt, phrase_hash, phrase_salt,
                        save_data, coins, level, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(username, display, p.hash, p.salt, ph.hash, ph.salt, save, coins, level, now, now).run();

  const userId = res.meta.last_row_id;
  const token = await newSession(db, userId);
  const user = { id: userId, display_name: display, coins, level, phrase_hash: ph.hash };
  return json({ token, user: publicUser(user), save: save ? JSON.parse(save) : null });
}

/* ---------- POST /api/login ---------- */
async function login(request, db) {
  const body = await request.json().catch(() => ({}));
  const username = normUser(body.username);
  const password = String(body.password || '');
  const phrase = body.phrase != null ? String(body.phrase) : '';

  const u = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();

  // Same generic error whether the user exists or not (no account enumeration).
  const okPass = u ? await checkHash(password, u.pass_hash, u.pass_salt) : false;
  if (!u || !okPass) return bad('Wrong username or password.', 401);

  // If this account has a security phrase, it must be provided and correct.
  if (u.phrase_hash) {
    if (!phrase) return bad('This account is protected by a security phrase. Please enter it.', 401);
    const okPhrase = await checkHash(phrase, u.phrase_hash, u.phrase_salt);
    if (!okPhrase) return bad('Wrong security phrase.', 401);
  }

  const token = await newSession(db, u.id);
  return json({ token, user: publicUser(u), save: u.save_data ? JSON.parse(u.save_data) : null });
}

/* ---------- POST /api/logout ---------- */
async function logout(request, db) {
  const token = bearer(request);
  if (token) await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
  return json({ ok: true });
}

/* ---------- GET /api/me ---------- */
async function me(request, db) {
  const u = await userFromToken(db, bearer(request));
  if (!u) return bad('Not signed in.', 401);
  return json({ user: publicUser(u), save: u.save_data ? JSON.parse(u.save_data) : null });
}

/* ---------- POST /api/sync ---------- */
async function sync(request, db) {
  const u = await userFromToken(db, bearer(request));
  if (!u) return bad('Not signed in.', 401);

  const body = await request.json().catch(() => ({}));
  if (!body.save || typeof body.save !== 'object') return bad('Missing save data.');

  const str = JSON.stringify(body.save);
  if (str.length > MAX_SAVE_BYTES) return bad('Save data too large.', 413);

  const coins = sanitiseCoins(body.coins != null ? body.coins : body.save.coins);
  const level = Math.max(1, Math.floor(Number(body.level) || 1));

  await db.prepare(
    'UPDATE users SET save_data = ?, coins = ?, level = ?, updated_at = ? WHERE id = ?'
  ).bind(str, coins, level, Date.now(), u.id).run();

  return json({ ok: true, coins, level });
}

/* ---------- GET /api/leaderboard ---------- */
async function leaderboard(request, db) {
  const url = new URL(request.url);
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));
  const { results } = await db.prepare(
    `SELECT display_name AS name, coins, level FROM users
     ORDER BY coins DESC, level DESC, updated_at ASC LIMIT ?`
  ).bind(limit).all();

  // Include the caller's own rank if signed in
  let meRow = null;
  const u = await userFromToken(db, bearer(request));
  if (u) {
    const rank = await db.prepare('SELECT COUNT(*) + 1 AS r FROM users WHERE coins > ?')
      .bind(u.coins).first();
    meRow = { name: u.display_name, coins: u.coins, level: u.level, rank: rank.r };
  }
  return json({ top: results || [], me: meRow });
}
