# NEECON TL;DR: Learning When to Transfer

## The story (say this)
New solar plants have no power history. Borrowing a model from another plant fails badly when the two plants' power is on different scales (R² = −269.8). We fix it with three pieces:

- **Per-unit scaling:** divide power by capacity.
- **Clear-Sky Index:** remove the predictable daily sun curve.
- **CDAN:** align the two plants' features without any target power labels.

Within India this gives R² ≈ 0.77–0.83. Across the equator (India to Melbourne) alignment backfires (R² < 0), while a plain Transformer stays positive (0.54 and 0.43). **The lesson: know when to transfer.**

## Numbers to know
| | India to India | P1 to Melbourne | P2 to Melbourne |
|---|---|---|---|
| Source-only LSTM | 0.53 | 0.45 | 0.29 |
| CDAN + LSTM | 0.77 | −0.25 | −0.23 |
| Transformer, no adaptation | 0.55 | 0.54 | **0.43** |
| DANN + LSTM | 0.53 | **0.56** | −0.16 |
| Full method (CDAN + LSTM + CSI) | **0.83** | −0.22 | −0.19 |

**Ablation (India):** −269.8 → 0.58 (scaling) → 0.69 (CDAN) → 0.80 (hour encoding) → 0.83 (CSI). Scaling is the biggest step.

## Why things worked or failed
- **CDAN helps in India:** it aligns features per output regime, not just on average. DANN, which only matches the overall distribution, barely helped (0.53).
- **CDAN fails in Melbourne:** the source is 34 hot days of Indian data (15 May to 17 June 2020); the target is a full Melbourne year. Most of the target lies outside what the source saw. In the real output plot, CDAN collapses to a flat, constant prediction all day, which gives negative R².
- **Why the Transformer survives:** it has no alignment term pulling features the wrong way. It overshoots, but its daily shape is right.

## Admit, don't defend
1. **The plants are not 14 MW and 1.4 MW.** Both India plants have 22 inverters and about 26–29 MW AC. The 10× gap is Plant 1's DC being recorded at about 10× its AC (a dataset quirk). Say: *"For us the gap is a 10× scale mismatch in the recorded signal; the scaling lesson holds for any scale mismatch."*
2. **0.8325 comes from an earlier run (exp_07).** The A1–A6 rows come from the later run (exp_10). Everything is single-run. Say: *"Top Task 1 models are within run-to-run noise; the solid gain is about 0.53 → 0.77+ from conditional alignment."*
3. **Fig. 2 is illustrative, not a raw output trace.** Plant 2 actually peaks near 26 MW.
4. **The model sees the weather at the step it predicts.** Say: *"Weather-to-power. In operation the weather comes from a forecast; we tested with measured weather."*
5. **"India winter vs Australia summer" is a hypothesis.** The India data has no winter. Say *"out-of-range climate"* instead.
6. **DANN beat the Transformer on Melbourne Task 2.** But DANN goes negative on Task 3, so the Transformer is the *consistent* choice.
7. **Smaller gaps:**
   - Melbourne module temperature is estimated, not measured.
   - Code uses MSE where the paper says Huber.
   - There is no validation split; models train a fixed 60 epochs.

## Quick answers
- **Night gating cheating?** No. There is no power without light, and the gate is applied to all six models.
- **Why not fine-tune?** Day one has no labels. Fine-tuning is our future work.
- **CDAN for regression?** A 4-way softmax "regime" head plus a linear read-out. The discriminator sees features ⊗ softmax.
- **Hardest part?** The GRL bug: R² dropped from 0.83 to 0.63 when the gradient reversal layer sat on the outer product instead of the features.
- **MAE 1,284 kW is huge?** Plant 2 peaks near 26 MW, so that is about 5% of peak. Compare R² across tasks, not MAE.
- **Practical takeaway?** Always normalize by capacity. Only align similar climates. Otherwise use a plain model until local data arrives.

## Don't say
- "14 MW and 1.4 MW plants"
- "attention learns universal physics"
- "proven seasonal mechanism"
- "Fig. 2 is our model output"
