# SKILL_codex

Strength programming knowledge and reasoning playbook for barbell, kettlebell, and weighted bodyweight lifts.

## 1. Scope and source priority

Use this document to answer questions about:
- Strength programming design
- Volume and intensity planning
- Block and weekly structure
- Fatigue management, peaking, and deloading
- What works, what fails, and why

Source priority:
1. `docs/references/plan-strong-seminar-manual-en.pdf` (primary)
2. `docs/references/StrongFirst-programming-demystified-seminar-manual-en.pdf` (secondary)
3. `docs/references/strong-code-60.md` (quick operational ranges)

If sources conflict, default to Plan Strong guidance unless the question explicitly asks for another model.

## 2. Core philosophy

High-level training truth:
- Beginners improve mostly from load on the bar.
- Advanced lifters improve mostly from volume and how volume is distributed across sessions, weeks, and months.

Programming principle:
- Keep many constants, vary a limited number of variables.
- Too much simultaneous change destroys signal quality.
- Good programming is not random variation; it is constrained variation.

Adaptation model:
- Reactivity (responsiveness) and resistance (tolerance) are inverse.
- New load -> high reactivity, low resistance.
- Repeated load -> lower reactivity, higher resistance.
- Periodization resets sensitivity while preserving adaptations.

## 3. Terminology and definitions

- `1RM`: one-repetition maximum.
- `RM`: maximum reps possible with a given load.
- `nRM`: a specific RM target (for example 5RM).
- `NL` or `NBL`: number of lifts (volume count).
- `ARI`: average relative intensity across the selected training unit.
- `HARI`: ARI in high zones (typically >=70%).
- `RE`: relative effort at one intensity (average reps per set divided by RM at that intensity).
- `ARE`: average of RE values across all intensities used in a session.
- `RPE`: perceived exertion scale.
- `RIR`: reps in reserve.
- `Top zone`: 91-100% (in practice, 90-100% may be treated equivalently when needed).
- `Training max`: heaviest load that can be lifted without excessive psychophysical arousal; useful for repeated quality exposures. In elite weightlifters it is often around 85-90% of competition max (heavier lifters near the lower end, lighter lifters near the upper end).

## 4. Load parameters (full model)

Strength training load is governed by 10 interacting parameters:
1. Specificity
2. Novelty
3. Volume
4. Intensity
5. Reps and effort
6. Rest
7. Exercise dynamics (speed, pauses, etc.)
8. Preceding load
9. Following load
10. Load dynamics over time

Key warning:
- Never isolate one parameter and expect stable outcomes.
- Programming succeeds by coordinated parameter design.

## 5. Intensity zones and practical boundaries

Weightlifting-style zone model:
- 50-60%
- 61-70%
- 71-80%
- 81-90%
- 91-100%

Plan Strong 70 model:
- Uses mostly >=70% work (high zones only).

Plan Strong 50 model:
- Uses all five zones and lower ARI targets.
- Better when hypertrophy emphasis is high.

Rep guidance by zone (operational):
- 70% zone: generally 3-6 (or 4-8 for higher endurance profiles)
- 75% zone: generally 3-6
- 80% zone: generally 2-5
- 85% zone: generally 2-4
- 90%+ zone: mostly singles and limited doubles

Rule:
- In 70-90% zones, most strength work should stay around 1/3 to 2/3 of RM, not to failure.

ARI targets by system (keep labels explicit):
- Plan Strong 50 style (counting >=50%): ARI commonly 67-77% overall; prep usually below 70%; comp usually above 70%.
- StrongCode 60 operational ranges (project standard, often used for PS70-style high-zone blocks): prep 71-74%, comp/peak 74-77%.
- Do not annotate ranges with `<` or `>` symbols inside the range itself. Use explicit intervals.

## 6. Volume and intensity: what they do

Volume primary role:
- Build stable long-term adaptations (morphological and neurological).
- Build tolerance, connective tissue robustness, and work capacity.

Intensity primary role:
- Raise performance ceiling.
- Peak performance when timed correctly.

Top-zone role:
- Powerful neural/psychophysical stimulus.
- High risk if overdosed.
- Must be individualized by lift and athlete.

Session NL guidance by system (per class of exercise):
- Plan Strong / Programming Demystified (counting >=70%): minimal 10-20, optimal 20-30, maximal 30-50.
- Plan Strong 50 (counting >=50%): minimal 10-25, optimal 25-50, maximal 50-100.
- StrongCode 60 quick ranges (counting >=60%): minimal 10-20, optimal 20-40, maximal 40-60.
- These are not directly interchangeable because the counting thresholds differ.

Monthly NL ranges by system (do not mix without adjusting counting basis):

| System | Counting basis | Prep month NL | Comp month NL |
|---|---|---|---|
| Plan Strong 70 | `>=70%` | SQ/DL 150-250; Press/PU 200-300+ | Usually last prep month minus ~20-50% (often ~30%), then taper |
| Plan Strong 50 | `>=50%` | SQ/DL 200-400; Press/PU 300-500+ | Usually last prep month minus ~20-50%, then taper |
| StrongCode 60 | `>=60%` | SQ/DL 150-350; Press/Bench/PU 250-400 | SQ/DL 150-250; Press/Bench/PU 200-350 |

## 7. Effort control: RPE/RIR and ARE

Use `%1RM` for structure and objective loading.
Use `RPE/RIR` to adapt load to daily state.

Combined use is preferred:
- `%1RM` anchors plan precision.
- `RPE/RIR` adjusts execution to reality.

ARE guidance:
- Power focus: 30-50%
- Max strength focus: 40-60%
- Strength + hypertrophy focus: 50-70%
- Bodybuilding bias: >80%

Critical insight:
- Same volume and same ARI can have very different ARE, and therefore very different fatigue and adaptation outcomes.

Zonin estimation tools (use exact case selection, not a single shortcut):
- Two-point E1RM estimate (near-linear zone method):
- `E1RM = RM1 + (n1 - 1) * (RM1 - RM2) / (n2 - n1)`
- Use with `RM1` from ~3-5RM and `RM2` from ~8-10RM.
- This E1RM method and the RM-at-percentage methods below solve different problems; do not substitute one for the other.
- RM-at-percentage, Case 1 (test at 80% or 77.5-82.5%):
- `RM(P%) = 1 + ((n - 1) / 20) * (100 - P)`
- RM-at-percentage, Case 2 (test outside 77.5-82.5%):
- `RM(P%) = RM(Pt%) + ((RM(Pt%) - 1) / (100 - Pt)) * (Pt - P)`
- Round estimated reps down to whole reps for execution.

## 8. Macro-structure choices

### 8.1 Progressive overload

Best when environment is predictable and compliance is high.
Typical use:
- Linear, wave, or step mesocycles
- Controlled load increases
- Strong bookkeeping

Risk:
- Faster accommodation if no strategic variation.

### 8.2 Variable overload (Plan Strong/Built Strong style)

Best when environment is dynamic or athlete needs high variability and robustness.
Typical use:
- Uncoupled volume and intensity in prep
- Controlled high variability with hard boundaries (Delta-20 logic)
- Session-to-session and week-to-week variation

Risk:
- Too chaotic for beginners if constraints are weak.

## 9. Plan Strong operating rules

### 9.1 Big cycle frame

- Preparatory period: usually 1-2 months
- Competition period: usually 1 month
- Transition period: typically 1 week to 1 month

Prep:
- Higher volume, lower average intensity than comp (as rule of thumb).

Comp:
- Lower volume, higher specificity and top-zone exposure, with taper.

### 9.2 Delta-20 rule

Minimum change between adjacent units (days/weeks/months):
- About 20% increase or decrease.

Purpose:
- Ensure meaningful variation signal.
- Avoid noisy micro-changes that fail to drive adaptation.

### 9.3 Monthly volume dynamics variants

Canonical 4-week constants:
- 15, 22, 28, 35 in 16 named combinations (1, 2a, 2b, 2c, 3a, 3b, 3c, 1-3a, 1-3b, 3-1a, 3-1b, 4, 2-4a, 2-4b, 4-2a, 4-2b).

Interpretation:
- Variant name describes rank order dynamics, not mandatory exact percentages.

### 9.4 Session distribution inside a week

Common templates:
- 2 sessions: 40/60, 35/65, 30/70, 25/75, 20/80
- 3 sessions: 25/33/42, 20/35/45, 22/28/50, 20/30/50, 15/35/50, 15/30/55
- 4 sessions: 15/22/28/35 or 10/20/30/40
- 5 sessions: 10/15/20/25/30

For 3-session ordering:
- L-M-H often useful in prep.
- H-L-M and related patterns useful for peaking simulation.

### 9.5 Intensity dynamics

Prep:
- Intensity and volume can be independent.
- Avoid automatically placing all heavy lifts in low-volume weeks.

Comp:
- In most cases, direction of volume and intensity taper aligns.
- Keep enough high intensity for readiness, but reduce fatigue.

## 10. Session construction rules

Inside-session guidance:
- Use pyramids or half-pyramids.
- Use rep and weight ladders to wave effort.
- Vary reps within allowed ranges; avoid static same-rep monotony.
- Maintain technical quality; if quality drops, stop or reduce.

Ladders:
- Usually superior to fixed-rep schemes for managing fatigue while sustaining volume.
- Preserve skill quality by reducing repeated high-fatigue sets.
- More sets equal more set-ups and more skill practice.
- Same intensity, lower RPE in most sets allows managing higher volumes with better technique.

How to set up a ladder (Plan Strong guidelines):
1. Test your RM at the given weight.
2. Calculate 1/3 of the RM and round to the nearest whole number.
3. Calculate 1/2 of the RM and round to the nearest whole number.
4. Calculate 2/3 of the RM and round to the nearest whole number.
The three numbers, from smallest to largest, are the rungs of the ladder.

Standard ladder reference (1/3, 1/2, 2/3 RM):

| RM | Ladder |
|----|--------|
| 4 | 1, 2, 3 |
| 5 | 2, 3, 3 |
| 6 | 2, 3, 4 |
| 7 | 2, 4, 5 |
| 8 | 3, 4, 5 |
| 9 | 3, 5, 6 |
| 10 | 3, 5, 7 |
| 11 | 4, 6, 7 |
| 12 | 4, 6, 8 |
| 13 | 4, 7, 9 |
| 14 | 5, 7, 9 |
| 15 | 5, 8, 10 |

Fibonacci-style ladder reference:

| RM | Ladder |
|----|--------|
| 4 | 1, 2, 3 |
| 5 | 1, 2, 3 |
| 6 | 1, 3, 4 |
| 7 | 2, 3, 5 |
| 8 | 2, 3, 5 |
| 9 | 2, 4, 6 |
| 10 | 3, 4, 7 |
| 11 | 3, 4, 7 |
| 12 | 3, 5, 8 |
| 13 | 4, 5, 9 |
| 14 | 4, 5, 9 |
| 15 | 4, 6, 10 |

Ladders and ARE (skipping the first rung raises effort):

| RM | Standard Ladder | Skipped 1st | Fibonacci Ladder | Skipped 1st |
|----|----------------|-------------|-----------------|-------------|
| 4 | 1, 2, 3 | 2, 3 | 1, 2, 3 | 2, 3 |
| 5 | 2, 3, 3 | 3, 3 | 1, 2, 3 | 2, 3 |
| 6 | 2, 3, 4 | 3, 4 | 1, 3, 4 | 3, 4 |
| 7 | 2, 4, 5 | 4, 5 | 2, 3, 5 | 3, 5 |
| 8 | 3, 4, 5 | 4, 5 | 2, 3, 5 | 3, 5 |
| 9 | 3, 5, 6 | 5, 6 | 2, 4, 6 | 4, 6 |
| 10 | 3, 5, 7 | 5, 7 | 3, 4, 7 | 4, 7 |
| 11 | 4, 6, 7 | 6, 7 | 3, 4, 7 | 4, 7 |
| 12 | 4, 6, 8 | 6, 8 | 3, 5, 8 | 5, 8 |
| 13 | 4, 7, 9 | 7, 9 | 4, 5, 9 | 5, 9 |
| 14 | 5, 7, 9 | 7, 9 | 4, 5, 9 | 5, 9 |
| 15 | 5, 8, 10 | 8, 10 | 4, 6, 10 | 6, 10 |
| ARE | ~50% | ~60% | <=50% | ~50% |

Use full ladders for lower ARE targets (power, max strength). Skip the first rung for higher ARE targets (strength-hypertrophy).

When unable to hit plan:
- Prep: lower intensity, preserve planned volume.
- Comp: lower volume, preserve specific intensity.

Eccentric and transition options:
- Controlled eccentric
- "Dive bomb" eccentric
- Mixed eccentric patterns
- Drop/reset (no meaningful eccentric under load) where exercise/safety allows
- Dead-start transitions
- Touch-and-go transitions
- Paused transitions (with tension or relaxed pause)
- Static-dynamic insertions (intentional pauses inside otherwise dynamic work)

## 11. Assistance and lift interaction

Assistance priority:
- Multi-joint first.
- Prefer specialized variety (SV) over random accessories.

Main/SV ratio by level:
- Beginner: mostly main lift
- Intermediate: around 70-80% main lift
- Advanced: may approach 50% main lift if technique is stable

Competition month:
- Reduce assistance volume and share, especially in final 2 weeks.

Lift interaction notes:
- Alternate hard and easier exercises when possible.
- Upper/lower sequencing across days matters for facilitation or interference.
- High-volume lower body can suppress next-day upper-body performance unless the upper session is hypertrophy-oriented and managed accordingly.

Preceding/following load specifics:
- Low-volume + medium/high-intensity session can facilitate next-day output.
- High-volume lower-body day can reduce next-day upper-body performance when upper day is also neural-heavy.
- Deload session after very hard loading is often most effective when exercise character differs from the stressor.
- For mixed strength-endurance athletes, sequencing and spacing strongly modulate interference.

Light-day operational benchmark:
- A common baseline is ~60% of heavy-day volume (then individualize).

Rest and recovery mechanics:
- Heterochronicity matters: phosphagen recovers fastest, CNS in the middle, metabolic/byproduct recovery slower.
- Intra-set micro-pauses can reduce glycolytic stress and support rep quality at higher total volume (cluster/rest-pause logic). Example from the seminar manual: a 5sec rest between reps in a 10-rep set can reduce lactic acid concentration by about 50% versus consecutive reps and shift metabolism toward CP.
- Use rest duration based on intent: quality neural work demands longer full-readiness rest.

## 12. What tends to work

Patterns repeatedly supported across these sources:
- Medium intensity work done frequently builds sustainable strength.
- Limited but consistent top-zone exposure improves peak readiness.
- Ladders and variable reps outperform rigid fixed reps for fatigue control.
- Conservative effort (buffer/RIR) supports quality volume and faster repeatability.
- Structured variability outperforms randomness.
- Periodic deloading and tapering unlock delayed training effects.

## 13. What tends to fail

High-risk patterns:
- Chronic failure training in strength-focused phases.
- Excessive >90% exposure without individualized tolerance.
- Too many variables changed at once.
- Constant maximal psych arousal in training.
- Frequent peaking attempts across the year with no base-building.
- Big weekly load jumps without recovery strategy.

## 14. Decision framework for answering any programming question

When asked "what works / what does not / what might work and why", answer in this sequence:

1. Define context
- Athlete level
- Primary goal (max strength, hypertrophy, power, peak)
- Time horizon
- Constraints (days/week, equipment, recovery, sport)

2. Choose model family
- Stable schedule + precise progression -> progressive overload
- Unstable schedule or advanced variability need -> variable overload (Plan Strong style)

3. Set core targets
- Monthly NL by lift class
- Zone distribution
- ARI/HARI target
- Top-zone cap

4. Build dynamics
- Month variant
- Weekly session distribution
- Session ordering and heavy-day placement

5. Set effort policy
- Rep ranges by zone
- RPE/RIR boundaries
- ARE target by goal

6. Add execution safeguards
- Stop signs: rep speed drop, tempo disruption, technique drift
- Fallback rules for bad days
- Deload/taper checkpoints
- Algorithm 1118D safety gate: if >=90% was lifted within the last 7 days and the random draw prescribes >=85%, re-roll under the constrained branch (allowed outcomes: 70%, 75%, 80%).
- If high-intensity exposure has been dense recently, cap or downgrade planned intensity for the next exposure window.

7. Explain causality
- Why this should work mechanistically
- What could break it
- How to adjust if response is too weak/too strong

## 15. Minimal quality checks before approving a plan

- Volume and intensity are both intentional, not accidental.
- Adjacent week changes are meaningful (Delta-20 aware where relevant).
- Top-zone dose is individualized and lift-specific.
- Rep prescriptions match zone and fatigue goals.
- Weekly structure is recoverable with athlete real life constraints.
- Competition week includes taper and specific rehearsal.
- Plan includes adjustment rule for bad and unexpectedly good days.

## 16. "Experience bank" for practical answers

Use these practical insights when giving recommendations:
- If athlete feels "fried" but numbers are flat, first reduce psychophysical load, not all load.
- If athlete handles high volume but stalls near max, increase specificity and top-zone timing, not random intensity spikes.
- If athlete misses planned reps early in cycle, plan is too aggressive or recovery assumptions are wrong.
- If athlete hits PR in prep unexpectedly, recalculate percentages or the intended average intensity collapses.
- If schedule is chaotic, algorithmic variable loading is usually safer than pretending a strict linear plan will be followed.
- If technical quality erodes under fatigue, reduce per-set reps before reducing total practice volume.

## 17. Boundaries and safety

- This is performance programming guidance, not medical advice.
- If injury risk or pain symptoms are central, reduce load ambition and refer to clinical decision-making.
- Do not prescribe maximal loading where spotting/safety setup is inadequate.

## 18. Output style guidance for future answers

When answering user questions:
- State recommendation clearly.
- State why (mechanism + evidence from this framework).
- State tradeoffs and failure modes.
- Give at least one adjustment path if assumptions are wrong.
- Prefer concrete numbers, ranges, and examples over generic advice.
