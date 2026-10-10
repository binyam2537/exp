// Offline interrogator: keyword -> fact, then the same deterministic stance rules as the LLM path.
import { CASE, positionOf } from './case.mjs';
import { required } from './engine.mjs';

const KW = {
  F_DEATH: ['kill', 'murder', 'dead', 'death', 'trophy', 'weapon', 'conrad', 'happened'],
  F_STAIRS: ['stairs', 'loft', 'back way', 'office'],
  F_SKIM: ['money', 'skim', 'ledger', 'steal', 'books', 'embezzl', 'ticket'],
  F_FLYS: ['fly', 'gallery', 'curtain', 'crew', 'alibi', 'where were you', 'where was he'],
  F_AFFAIR: ['affair', 'lover', 'romance', 'relationship', 'love', 'secret', 'together'],
  F_MARGALONE: ['alone', 'dressing', 'alibi', 'where were you', 'witness'],
  F_CLOAK: ['cloak', 'figure', 'green', 'saw', 'velvet', 'someone'],
  F_CLOAKOWN: ['cloak', 'velvet', 'costume', 'loft', 'belong'],
  F_DESIGNS: ['design', 'sold', 'rival', 'angry', 'fight', 'argue', 'motive', 'hate'],
  F_FIBER: ['fibre', 'fiber', 'thread', 'trophy', 'evidence'],
  F_TRASH: ['trash', 'alley', 'bar', 'outside', 'where were you'],
};
const TELL = {
  F_DEATH: 'It happened in his office, around a quarter past ten. The trophy, they say. Awful.',
  F_STAIRS: 'You can get to his office from the costume loft by the back stairs, yes. Everyone knows that.',
  F_SKIM: 'Fine. Yes. I took ticket money. Two years of it. Conrad found the ledger.',
  F_FLYS: 'I was up in the fly gallery running the curtain call until twenty-five past. Ask the crew.',
  F_AFFAIR: 'Conrad and I were lovers. He ended it that night. I will not pretend otherwise any more.',
  F_MARGALONE: 'I was in my dressing room, alone, from ten to half past. I cannot prove a thing.',
  F_CLOAK: 'Around ten past ten I saw someone in a green velvet cloak on the back stairs. I did not see a face.',
  F_CLOAKOWN: 'That cloak lives in the costume loft. Ivy keeps the loft.',
  F_DESIGNS: 'He sold my season designs to a rival house. I found out that afternoon. I was furious. That is all.',
  F_FIBER: 'Green velvet fibres. Half the loft is green velvet. That proves nothing about me.',
  F_TRASH: 'I left the bar at twenty past ten to take the trash to the alley.',
};

const CONFESS = {
  ivy: { F_CLOAK: 'Yes. The cloak was mine to carry. I wore it up the back stairs at ten. I only meant to talk to him. ...I killed him.' },
};

export function fallback(g, suspect, question, forced) {
  const q = question.toLowerCase();
  const hits = forced ?? Object.keys(KW).filter(f => KW[f].some(k => q.includes(k)));
  const claims = []; const lines = [];
  for (const f of hits.slice(0, 2)) {
    const r = required(g, suspect, f);
    claims.push({ fact: f, says: r.says });
    if (r.says === 'unknown') lines.push('I really wouldn\'t know anything about that.');
    else if (r.says === 'false') lines.push(positionOf(suspect, f).lie);
    else if (r.confessed && CONFESS[suspect]?.[f]) lines.push(CONFESS[suspect][f]);
    else lines.push(TELL[f]);
  }
  if (!lines.length) lines.push(['Ask me something I can actually answer, detective.', 'I\'ve told you what I know.', 'Is there a point to this?'][g.turn % 3]);
  return { speech: lines.join(' '), claims, mood: 'calm' };
}
