// The case file. Ground truth lives here, NOT in prompts: every claim a suspect makes
// is a structured (fact, stance) pair that the engine validates and stores.
//
// stance values:  truth  -> suspect states it honestly
//                 lie    -> suspect commits to the canonical `lie` text and never wavers
//                 unknown-> suspect genuinely doesn't know (must say so)
// `breaks`: evidence fact ids that, once presented, force the suspect off the lie.

export const CASE = {
  title: 'The Larkspur Affair',
  intro:
    'Conrad Vale, owner of the Gilded Larkspur Theatre, was found dead in his office at 10:40 pm after the closing-night show. ' +
    'Struck once with the brass Larkspur trophy. Four people were still in the building. One of them is lying about more than they should. ' +
    'Question them. Anything they say is recorded in your notebook — and so is every change of story.',
  solution: 'ivy',
  facts: {
    F_DEATH:   { text: 'Conrad was killed around 10:15 pm in his office, struck with the brass Larkspur trophy.', public: true },
    F_STAIRS:  { text: 'The office can be reached by the back stairs from the costume loft.', public: true },
    F_SKIM:    { text: 'Desmond had been skimming ticket money; Conrad\'s ledger exposed it.' },
    F_FLYS:    { text: 'Desmond ran the curtain call from the fly gallery until 10:25, with the whole crew watching.' },
    F_AFFAIR:  { text: 'Marguerite and Conrad were secret lovers; he ended it that night.' },
    F_MARGALONE:{ text: 'Marguerite was alone in her dressing room 10:00–10:30 and cannot prove it.' },
    F_CLOAK:   { text: 'Felix saw a figure in a green velvet cloak on the back stairs around 10:10.' },
    F_CLOAKOWN:{ text: 'The green velvet cloak belongs to the costume loft — Ivy\'s domain.' },
    F_DESIGNS: { text: 'Conrad secretly sold Ivy\'s season designs to a rival house; she found out that afternoon.' },
    F_FIBER:   { text: 'Green velvet fibres were found on the trophy (police lab).', public: true },
    F_TRASH:   { text: 'Felix left the bar at 10:20 to take the trash out to the alley.' },
  },
  suspects: {
    margot: {
      name: 'Marguerite Lowe', role: 'Leading actress', age: 34,
      look: { skin: 0xe8c4a0, hair: 0x3a1a12, coat: 0x7a1f3a },
      persona: 'Theatrical, wounded pride, deflects with charm, snaps when cornered about the affair.',
      secret: 'She loved Conrad. He broke it off an hour before he died. She is hiding this out of shame, not guilt.',
      positions: {
        F_DEATH: 'truth', F_STAIRS: 'truth',
        F_AFFAIR:   { stance: 'lie', lie: 'Conrad and I were only colleagues. He was my employer, nothing more.', breaks: ['F_AFFAIR'] },
        F_MARGALONE:{ stance: 'lie', lie: 'I was in my dressing room all night, resting my voice. Alone, yes — an actress needs quiet.', breaks: ['F_AFFAIR'] },
        F_SKIM: 'truth', F_FLYS: 'unknown', F_CLOAK: 'unknown', F_CLOAKOWN: 'truth', F_DESIGNS: 'unknown', F_FIBER: 'unknown', F_TRASH: 'unknown',
      },
      onBreak: 'If the affair is presented she crumbles: admits it, says he ended it at 9:30, that she cried alone and has no alibi — but she did not kill him.',
    },
    desmond: {
      name: 'Desmond Ash', role: 'Stage manager', age: 51,
      look: { skin: 0xc99a73, hair: 0x555555, coat: 0x23303a },
      persona: 'Gruff, defensive, speaks in short clipped sentences, nervous about money.',
      secret: 'He skimmed ticket money for two years. Conrad found out. He is terrified that is what makes him look guilty.',
      positions: {
        F_DEATH: 'truth', F_STAIRS: 'truth', F_FLYS: 'truth',
        F_SKIM: { stance: 'lie', lie: 'The books are clean. I run a tight house. Whatever the ledger says, it is a clerical mess.', breaks: ['F_SKIM'] },
        F_AFFAIR: 'truth', // he suspected; Marguerite was careless
        F_CLOAK: 'unknown', F_CLOAKOWN: 'truth', F_DESIGNS: 'unknown', F_FIBER: 'unknown', F_MARGALONE: 'unknown', F_TRASH: 'unknown',
      },
      onBreak: 'If skimming is presented he admits it flatly, insists the fly-gallery crew prove he could not have been in the office at 10:15.',
    },
    ivy: {
      name: 'Ivy Crane', role: 'Costume designer', age: 29,
      look: { skin: 0xf0d2b8, hair: 0x1a1a2a, coat: 0x2f5d3a },
      persona: 'Soft-spoken, precise, helpful to a fault. Never raises her voice. Over-explains small things.',
      secret: 'She killed Conrad. He sold her designs that afternoon; she took the green cloak up the back stairs and struck him in a rage.',
      positions: {
        F_DEATH: 'truth', F_STAIRS: 'truth',
        F_CLOAKOWN: 'truth',
        F_CLOAK:   { stance: 'lie', lie: 'I\'ve never seen anyone in a green cloak that night. The loft cloak went missing sometime after the show — someone must have taken it.', breaks: ['F_CLOAK', 'F_FIBER'] },
        F_DESIGNS: { stance: 'lie', lie: 'I had no idea anything like that. Conrad and I got along perfectly.', breaks: ['F_DESIGNS'] },
        F_FIBER: 'truth', F_SKIM: 'unknown', F_FLYS: 'truth', F_AFFAIR: 'unknown', F_MARGALONE: 'unknown', F_TRASH: 'unknown',
      },
      onBreak: 'Cornered by the designs she goes quiet, then cold: admits she was furious, still denies the killing until the cloak AND the fibres are both presented, then confesses calmly.',
    },
    felix: {
      name: 'Felix Okoro', role: 'Bartender & usher', age: 41,
      look: { skin: 0x8a5a3c, hair: 0x111111, coat: 0x5a4a20 },
      persona: 'Easygoing, gossipy, loses track of detail unless pinned, wants no trouble with police.',
      secret: 'He saw the cloaked figure but is scared to name the cloak\'s owner because he thinks it was a staff member he likes.',
      positions: {
        F_DEATH: 'truth', F_STAIRS: 'truth',
        F_TRASH: 'truth', F_CLOAK: 'truth', F_CLOAKOWN: 'truth',
        F_AFFAIR: 'truth', F_MARGALONE: 'truth',
        F_SKIM: 'unknown', F_FLYS: 'unknown', F_DESIGNS: 'truth', F_FIBER: 'unknown',
      },
      onBreak: '',
    },
  },
};

export function positionOf(suspectId, factId) {
  const p = CASE.suspects[suspectId].positions[factId];
  if (!p) return { stance: 'unknown' };
  return typeof p === 'string' ? { stance: p } : p;
}
