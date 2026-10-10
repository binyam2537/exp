import { CASE, positionOf } from './case.mjs';

// ---- state -------------------------------------------------------------
export function newGame() {
  const g = { discovered: new Set(Object.keys(CASE.facts).filter(f => CASE.facts[f].public)),
              presented: {}, broken: {}, ledger: {}, history: {}, turn: 0 };
  for (const s of Object.keys(CASE.suspects)) { g.presented[s] = new Set(); g.broken[s] = new Set(); g.ledger[s] = []; g.history[s] = []; }
  return g;
}

// What the suspect MUST say about a fact right now. Deterministic => no contradictions.
export function required(g, suspect, fact) {
  const p = positionOf(suspect, fact);
  if (p.stance === 'truth') return { says: 'true' };
  if (p.stance === 'unknown') return { says: 'unknown' };
  if (g.broken[suspect].has(fact)) return { says: 'true', confessed: true };
  return { says: 'false', line: p.lie };
}

// Evidence presentation. `breaks` lists are all-of: every listed fact must have been presented.
export function present(g, suspect, fact) {
  if (!g.discovered.has(fact)) return { ok: false, error: 'You have not established that fact yet.' };
  g.presented[suspect].add(fact);
  const flipped = [];
  for (const f of Object.keys(CASE.facts)) {
    const p = positionOf(suspect, f);
    if (p.stance === 'lie' && !g.broken[suspect].has(f) && p.breaks.length && p.breaks.every(b => g.presented[suspect].has(b))) {
      g.broken[suspect].add(f); flipped.push(f);
    }
  }
  return { ok: true, flipped };
}

// ---- validation --------------------------------------------------------
export function validate(g, suspect, reply) {
  const errs = [];
  if (!reply || typeof reply.speech !== 'string' || !reply.speech.trim()) errs.push('speech is empty');
  for (const c of reply?.claims ?? []) {
    if (!CASE.facts[c.fact]) { errs.push(`unknown fact id ${c.fact}`); continue; }
    const need = required(g, suspect, c.fact).says;
    if (c.says !== need) errs.push(`${c.fact}: you said "${c.says}" but ${CASE.suspects[suspect].name} must say "${need}"`);
  }
  return errs;
}

// Commit a validated reply: update ledger + notebook. Returns what changed for the UI.
export function commit(g, suspect, reply, flipped = []) {
  g.turn++;
  const out = { newFacts: [], statements: [], changedStory: [] };
  for (const f of flipped) out.changedStory.push({ fact: f, now: CASE.facts[f].text });
  for (const c of reply.claims ?? []) {
    const last = [...g.ledger[suspect]].reverse().find(l => l.fact === c.fact);
    if (last && last.says === c.says) continue;
    g.ledger[suspect].push({ fact: c.fact, says: c.says, turn: g.turn });
    if (c.says === 'true' && !g.discovered.has(c.fact)) { g.discovered.add(c.fact); out.newFacts.push(c.fact); }
    if (c.says !== 'unknown') out.statements.push({ fact: c.fact, says: c.says,
      text: c.says === 'true' ? CASE.facts[c.fact].text : positionOf(suspect, c.fact).lie });
  }
  return out;
}

// ---- LLM prompt --------------------------------------------------------
export function systemPrompt(g, suspect) {
  const s = CASE.suspects[suspect];
  const rows = Object.keys(CASE.facts).map(f => {
    const r = required(g, suspect, f);
    const base = `- ${f}: "${CASE.facts[f].text}"\n    REQUIRED claim: says="${r.says}"`;
    if (r.says === 'false') return `${base} — deny it using exactly this story: "${r.line}"`;
    if (r.confessed) return `${base} — you have been caught on this; admit it in character (${s.onBreak})`;
    if (r.says === 'unknown') return `${base} — you genuinely do not know; say so, never guess.`;
    return base;
  }).join('\n');
  return `You are ${s.name}, ${s.role}, a suspect being interrogated about the murder of Conrad Vale (${CASE.facts.F_DEATH.text}).
Persona: ${s.persona}
Private truth (never reveal unless a fact row below says to): ${s.secret}

You answer as ${s.name} in first person, 1-4 sentences, spoken dialogue only, no stage directions.
THE FACT SHEET BELOW IS ABSOLUTE. For every fact your reply touches, add a claim with the REQUIRED value. Never state, hint at, or confirm a fact you have not listed in claims.
Never contradict an earlier line in this conversation. If asked something not on the sheet (trivia, feelings), answer vaguely and consistently with earlier lines; do not invent new times, places, objects or people relevant to the crime.
If the detective's question touches nothing on the sheet, return claims: [].

FACT SHEET
${rows}`;
}

export const RESPOND_TOOL = {
  name: 'respond',
  description: 'Reply to the detective.',
  input_schema: { type: 'object', required: ['speech', 'claims'], properties: {
    speech: { type: 'string' },
    mood: { type: 'string', enum: ['calm', 'nervous', 'angry', 'sad', 'cold'] },
    claims: { type: 'array', items: { type: 'object', required: ['fact', 'says'], properties: {
      fact: { type: 'string', enum: Object.keys(CASE.facts) },
      says: { type: 'string', enum: ['true', 'false', 'unknown'] } } } } } },
};

async function callClaude(system, messages, extra = []) {
  const res = await fetch((process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com') + '/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: process.env.GRILLME_MODEL || 'claude-haiku-5-5', max_tokens: 600, temperature: 0.4,
      system, messages: [...messages, ...extra], tools: [RESPOND_TOOL], tool_choice: { type: 'tool', name: 'respond' } }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.content.find(b => b.type === 'tool_use')?.input;
}

// Ask the LLM; reject + retry on any ledger violation; fall back to scripted line if it keeps failing.
export async function ask(g, suspect, question, fallback, llm = callClaude) {
  const hist = g.history[suspect];
  const user = { role: 'user', content: question };
  let reply, errs = [], extra = [];
  if (process.env.ANTHROPIC_API_KEY || llm !== callClaude) {
    for (let i = 0; i < 3; i++) {
      try {
        reply = await llm(systemPrompt(g, suspect), [...hist, user], extra);
        errs = validate(g, suspect, reply);
        if (!errs.length) break;
        extra = [{ role: 'assistant', content: JSON.stringify(reply) }, { role: 'user', content: `REJECTED: ${errs.join('; ')}. Reply again obeying the fact sheet.` }];
      } catch (e) { errs = [e.message]; break; }
    }
  } else errs = ['no-key'];
  const usedFallback = errs.length > 0;
  if (usedFallback) reply = fallback(g, suspect, question);
  hist.push(user, { role: 'assistant', content: reply.speech });
  return { reply, usedFallback, reason: usedFallback ? errs[0] : null };
}
