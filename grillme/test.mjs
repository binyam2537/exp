// Proves the core claim: no matter what the model says, a suspect can't contradict themselves.
import assert from 'node:assert/strict';
import { newGame, ask, commit, present, validate } from './engine.mjs';
import { fallback } from './fallback.mjs';

const g = newGame();
// 1. A misbehaving "LLM" that flips Ivy's story is rejected 3x, then replaced by the scripted line.
let calls = 0;
const bad = async () => { calls++; return { speech: 'I wore the cloak!', claims: [{ fact: 'F_CLOAK', says: 'true' }] }; };
let r = await ask(g, 'ivy', 'Did you see anyone in a green cloak?', fallback, bad);
assert.equal(calls, 3); assert.ok(r.usedFallback); assert.ok(r.reply.claims.some(c => c.fact === 'F_CLOAK' && c.says === 'false'));

// 2. A well-behaved reply is accepted and recorded; asking again can't change the ledger.
const good = async () => ({ speech: 'Nobody. The cloak just went missing.', claims: [{ fact: 'F_CLOAK', says: 'false' }] });
r = await ask(g, 'ivy', 'Cloak?', fallback, good); assert.ok(!r.usedFallback); commit(g, 'ivy', r.reply);
assert.deepEqual(validate(g, 'ivy', { speech: 'x', claims: [{ fact: 'F_CLOAK', says: 'true' }] }).length, 1);

// 3. Evidence breaks the lie only when ALL required evidence is presented.
r = await ask(g, 'felix', 'What did you see on the stairs? A cloak?', fallback); commit(g, 'felix', r.reply);
assert.ok(g.discovered.has('F_CLOAK'));
present(g, 'ivy', 'F_CLOAK'); assert.ok(!g.broken.ivy.has('F_CLOAK'));
const p = present(g, 'ivy', 'F_FIBER'); assert.deepEqual(p.flipped, ['F_CLOAK']);
r = await ask(g, 'ivy', 'So? the cloak?', fallback); assert.match(r.reply.speech, /killed him/);
const c = commit(g, 'ivy', r.reply); assert.equal(g.ledger.ivy.at(-1).says, 'true');
// 4. Can't present what you haven't found.
assert.equal(present(g, 'margot', 'F_AFFAIR').ok, false);
console.log('all tests passed');
