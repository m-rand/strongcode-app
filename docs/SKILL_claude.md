# SKILL: Strength Training Programming

> Comprehensive reference for programming strength exercises based on Soviet weightlifting methodology (Plan Strong / Chernyak) and StrongFirst programming principles. This document enables an agent to answer any question about strength programming — what works, what doesn't, what might work, and why.

---

## 1. Foundational Concepts

### 1.1 Adaptation Principles

**Stress-Adaptation Model**: The organism responds to training stress through adaptive reactions ranging from calm activation (optimal) through high activation to over-activation and finally stress (pathological). The goal is to stay in the zone of productive adaptation.

**Continuity**: Repetition is the main condition for adaptation. The nervous system forms "dynamic stereotypes" — stable motor patterns that become automatic through consistent practice. Breaks in training continuity disrupt these patterns.

**Accommodation**: The body stops responding to a stimulus it has adapted to. Overcome via:
- **Qualitative changes**: Different exercises, methods, tempos, execution styles
- **Quantitative changes**: Adjusting load parameters (volume, intensity, density, frequency)

**Reactivity and Resistance**: A novel stimulus produces high reactivity (strong response) and low resistance. Over time, resistance builds and reactivity drops. This inverse relationship is the fundamental rationale for periodization — you must systematically vary stimuli to maintain productive adaptation.

**Delayed Transformation**: Training results lag behind volume dynamics. Peak performance comes *after* volume has been reduced or stabilized, not during the highest volume phase. This is the basis for tapering and peaking strategies.

### 1.2 Key Metrics

**NBL / NL (Number of Barbell Lifts)**: The primary volume metric. Counts only working reps above a threshold:
- **Plan Strong 50**: Reps at >= 50% 1RM
- **Plan Strong 70**: Reps at >= 70% 1RM
- **StrongCode 60 (SC60)**: Project reference ranges; threshold is not explicitly specified in the source note.
- The threshold choice affects all volume targets; do not compare PS50, PS70, and SC60 ranges as if they were directly interchangeable.

**Tonnage**: Total weight lifted = sum of (weight x reps) across all sets.

**ARI (Average Relative Intensity)**: Measures the average "heaviness" of training relative to the athlete's maximum.
- Formula: `ARI = (Tonnage / NBL / 1RM) x 100`
- Expressed as a percentage of 1RM
- Target ranges: Annual WL ~75 +/- 2%, PL ~70 +/- 3%
- **Prep period**: ARI 71-74%
- **Comp period**: ARI 74-77%

**VC (Volume Coefficient)**: `VC = NBL x ARI`. Characterizes the "general load" — combines volume and intensity into a single number for comparing training blocks.

**ARE (Average Relative Effort)**: Measures how close each set is to the rep max at that weight. ARE = average of (reps_performed / RM_at_that_weight) across sets. Different from ARI — same ARI can have vastly different ARE values depending on set/rep structure.
- Proposed optimal ARE (Zonin): Power 30-50%, 1RM strength 40-60%, Strength+hypertrophy 50-70%, Bodybuilding >80%

**RPE (Rate of Perceived Exertion)**: Subjective 1-10 scale (Tuchscherer, modified by Zonin):
- RPE 10 = maximal effort, 0 reps in reserve (RIR)
- RPE 9 = 1 RIR
- RPE 8 = 2 RIR
- RPE 7 = 3 RIR
- Most training volume should be at RPE 6-8
- Only 5-10% at RPE 8-9
- RPE 9-10 reserved for testing/PRs (2-3x/year)

**Training Max**: The heaviest load that can be lifted without strong psychophysical excitation.
- In Soviet references, elite training max is often below competition max.
- Practical implication: many productive training plans peak performance without frequent all-out max attempts.

### 1.3 Intensity Zones

Five zones with central weights used for calculation:

| Zone | % 1RM Range | Central Weight | Character |
|------|-------------|---------------|-----------|
| 1 | 50-60% | 55% | Warm-up, technique, recovery |
| 2 | 61-70% | 65% | Light training, skill practice |
| 3 | 71-80% | 75% | Main training zone, "optimal weight" |
| 4 | 81-90% | 85% | Heavy training, neural emphasis |
| 5 | 91-100% | 92.5% (or 95%) | Near-maximal, competition prep |

**Zone boundaries for classification**: <=0.60 -> "55", <=0.70 -> "65", <=0.80 -> "75", <=0.90 -> "85", <=0.94 -> "90", >0.94 -> "95"

**Classic distribution** across zones (remarkably stable across 5 Olympic cycles): ~10/25/35/25/5 -> ARI ~74%

### 1.4 Ten Load Parameters (explicit model)

Strength programming is built on these interacting parameters:
1. Specificity
2. Novelty
3. Volume
4. Intensity
5. Reps and effort
6. Rest
7. Exercise dynamics
8. Preceding load
9. Following load
10. Load dynamics

---

## 2. Volume & Intensity Ranges by System

Three counting systems are used in the source materials. **They are not interchangeable** — each counts a different subset of reps, which shifts both volume totals and computed ARI.

| Property | Plan Strong 70 (PS70) | Plan Strong 50 (PS50) | StrongCode 60 (SC60) |
|----------|----------------------|----------------------|---------------------|
| **Counting threshold** | NL at >= 70% 1RM | NL at >= 50% 1RM | Project ranges (threshold not explicitly stated) |
| **SQ / DL — Prep month** | 150–250 NL | 200–400 NL | 150–350 NL |
| **SQ / DL — Comp month** | _(reduce prep by ~20-50%)_ | _(reduce prep by ~20-50%)_ | 150–250 NL |
| **Press / BP / Pull-up — Prep** | 200–300+ NL | 300–500+ NL | 250–400 NL |
| **Press / BP / Pull-up — Comp** | _(reduce prep by ~20-50%)_ | _(reduce prep by ~20-50%)_ | 200–350 NL |
| **Session NL (per lift) — Minimal** | 10–20 | 10–25 | 10–20 |
| **Session NL (per lift) — Optimal** | 20–30 | 25–50 | 20–40 |
| **Session NL (per lift) — Maximal** | 30–50 | 50–100 | 40–60 |
| **ARI — Annual WL** | _(HARI — see note)_ | 75 ± 2% (Medvedev, 1986) | — |
| **ARI — Annual PL** | _(HARI — see note)_ | 70 ± 3% (Sheyko, 2008) | — |
| **ARI — Hypertrophy** | _(HARI — see note)_ | 71–73% | 71–73% |
| **ARI — Strength** | _(HARI — see note)_ | 73–77% | 73–77% |
| **ARI — Prep period** | _(HARI — see note)_ | 71–74% | 71–74% |
| **ARI — Comp / Peak** | _(HARI — see note)_ | 74–77% | 74–77% |

**PS70 → HARI**: PS70 counts only reps at >= 70% 1RM. The seminar calls this "ARI in the high intensity zones" (HARI). Because the low-intensity zones (55%, 65%) that pull the average down are excluded, **HARI is mechanically higher** than PS50/SC60 ARI for the same program. Do not apply PS50/SC60 ARI targets directly to PS70-computed HARI — the values will read several percentage points higher by construction.

**Annual NL** (all lifts combined, PS50): Beginners ~10,000, Elite ~20,000+

**Competition month guidance**: For PS70 and PS50, reduce the last prep month NL by ~20–50% (typically ~30%), then taper within the month. SC60 uses fixed comp ranges from `strong-code-60.md`.

### 2.2 Session Volume

**Total session volume (all exercises)**:
- Small: <= 50 NL
- Medium: 51–100 NL
- Large: > 100 NL

**Practical rule**: If NL > 30 for one exercise or session > 30min, split into series separated by unrelated exercises or >= 30min rest.

### 2.3 Sets per Session

- Per exercise: 10-15 sets typical, max ~20 sets
- Per lift in a session: NBL typically 30-45

---

## 3. Intensity Guidelines

### 3.1 ARI Targets

See the combined table in **Section 2** for ARI targets by system (PS50, PS70/HARI, SC60).

### 3.2 Reps per Set by Intensity

**High endurance lifters** (RM at given % is higher):

| % 1RM | 70% | 75% | 80% | 85% | 90% | 95% |
|-------|-----|-----|-----|-----|-----|-----|
| RM >= | 12RM | 10RM | 8RM | 6RM | 4RM | >=2RM |
| Optimal | 6 | 5 | 4 | 3 | 2 | 1 |
| Range | 4-8 | 3-6 | 3-5 | 2-4 | 1-2 | 1 |
| Warm-up/comp week | 2-3 | 1-2 | | 1 | | |

**Low endurance lifters**:

| % 1RM | 70% | 75% | 80% | 85% | 90% | 95% |
|-------|-----|-----|-----|-----|-----|-----|
| RM | 10RM | 8RM | 6RM | 5RM | 3RM | 2RM |
| Optimal | 5 | 4 | 3 | 2 | 1-2 | 1 |
| Range | 3-6 | 3-5 | 2-4 | 2-3 | 1-2 | 1 |

**Key principle**: Optimal reps per set is approximately **half of the RM** at that percentage. This keeps sets well below failure, maximizes quality reps, and allows high frequency.

**Vary reps as much as possible** from set to set within the given range. E.g., at 70% NL 20, don't do 4x5 — do (4, 6, 4, 6) or (3, 5, 3, 5, 4).

### 3.3 Zone Distribution Bounds

| Zone | 65% | 75% | 85% | 92.5% | 95% |
|------|:---:|:---:|:---:|:-----:|:---:|
| Minimal | 25% | 25% | 10% | 0% | 0% |
| Maximal | 50% | 50% | 30% | 15% | 5% |

**Optimal for Hypertrophy**: 40/45/15/0/0 -> ARI 72.5%
**Optimal for Strength**: 30/40/25/5/0 -> ARI 75.375%

### 3.4 Heavy Zone (90-100%) Guidelines

- Monthly NL in 90-100% zone: 5-30 reps (all lifts combined)
- Prep-to-comp ratio: ~40:60 (fewer heavy reps in prep, more in comp)
- Don't exceed 90% 1RM for more than 3 weeks before a competition

### 3.5 Rest Periods

**Recovery timeline for strength exercises**:
- 5 sec: Lactic acid reduced 50%
- 30 sec: CP ~50% recovered
- 1 min: Steepest CP recovery
- 2 min: CNS excitability starts declining
- 3 min: Fast CP recovery phase complete
- 5-8 min: CP fully recovered
- 10 min: Full performance recovery after a set to RM
- 15-20 min: CP supercompensation peak after strength exercise to RM

**Heterochronicity principle**:
- Different systems recover at different rates (CP faster, CNS intermediate, pH/metabolic byproducts slower).
- Rest and session sequencing should reflect this mismatch.

**Intra-set rest insight**:
- Very short pauses between reps can substantially reduce glycolytic stress and shift work toward phosphagen contribution.
- Practical use: cluster and rest-pause structures can preserve rep quality at higher total volume.

**Practical guidelines**:
- Non-maximal work (<90%): 2-3 min (ordinary rest)
- 75% x 5: 4-5 min
- 90-95%: 5-7+ min
- Rest until ready to lift, then add one more minute (for <90%)
- >90%: 5+ min minimum

**1/2/3 rule**: ~2/3 of recovery happens in the first 1/3 of total recovery duration, ~30% in the second third, ~5% in the last third.

---

## 4. Volume Variability (Periodization)

### 4.1 The Cycling Principle

Volume must fluctuate — not increase linearly. The body adapts to constant stimuli (accommodation). **Sharp variability produces superior results**: Ermakov's experiments showed 61% greater strength gains with sharper volume dynamics vs. smooth progressive overload. Athletes in the experimental groups were also healthier and felt better.

### 4.2 Chernyak's 16 Volume Variants

Four structural constants distributed across 4 weeks: **15%, 22%, 28%, 35%** of monthly volume.

| Variant | Week 1 | Week 2 | Week 3 | Week 4 | Type |
|---------|--------|--------|--------|--------|------|
| 1 | 35 | 28 | 22 | 15 | Gradual decrease |
| 2a | 15 | 35 | 28 | 22 | Peak week 2 |
| 2b | 28 | 35 | 22 | 15 | Peak week 2 |
| 2c | 22 | 35 | 28 | 15 | Peak week 2 |
| 3a | 15 | 22 | 35 | 28 | Peak week 3 |
| 3b | 22 | 28 | 35 | 15 | Peak week 3 |
| 3c | 15 | 28 | 35 | 22 | Peak week 3 |
| 1-3a | 35 | 15 | 28 | 22 | Mixed |
| 1-3b | 35 | 22 | 28 | 15 | Mixed |
| 3-1a | 28 | 15 | 35 | 22 | Mixed |
| 3-1b | 28 | 22 | 35 | 15 | Mixed |
| 4 | 15 | 22 | 28 | 35 | Gradual increase |
| 2-4a | 15 | 35 | 22 | 28 | Mixed |
| 2-4b | 22 | 35 | 15 | 28 | Mixed |
| 4-2a | 22 | 28 | 15 | 35 | Mixed |
| 4-2b | 15 | 28 | 22 | 35 | Mixed |

**Selection guidelines** (Chernyak, 1978):
- **Comp period**: Variants best suited for the pre-competition month, deloading on last week, are: **1, 2b, 2c, 3b, 1-3b, 3-1b** — all have week 4 = 15% (the lowest load).
- **Prep period**: The remaining variants are not the only ones possible; "there are others, especially in preparatory months." Commonly start with 3b, 3c, or 4 in early exposure to the method; then rotate.
- **Gradual and combined** variants look like triangles — volume rises to a single peak and falls. In gradual variants one always changes to an adjacent value from the list (15→22→28→35). In combined variants you may jump as much as you want but still have only one peak.
- **Sharp** variants look like two triangles next to each other — volume goes up and down twice. The first digit marks the week with highest volume, the second digit marks the second highest peak.
- **Younger/lighter lifters**: Sharp variability preferred (bigger swings between weeks).
- **Older/heavier lifters**: Gradual variability preferred (smaller swings).
- ±1.5% variation from the structural constants is acceptable. Some athletes tolerate even greater variability (Chernyak, 1978).
- **Advanced/elite athletes**: Use advanced (33/28/22/17) or elite (32/27/22/19) pattern sets for reduced variability — defined in `constants.py`.

### 4.3 Monthly Volume Distribution for Longer Blocks

| Block Length | Possible Distributions |
|-------------|----------------------|
| 3 weeks | 24-48-28; 50-30-20 |
| 5 weeks | 15-27-13-30-15; 20-25-30-15-10; 15-20-30-10-25 |
| 6 weeks | 11-19-11-26-22-11; 10-22-17-29-13-9; 10-21-16-23-18-12 |

For 7 weeks use 4+3, for 9 weeks use 5+4, etc.

### 4.4 Weekly Load Distribution

| Volume Pattern | Intensity Pattern | Best For |
|---------------|-------------------|----------|
| L-M-H | L-H-M | Prep period (preferred) |
| H-L-M | M-L-H | Comp/peaking (simulates competition on Fri/Sat) |

### 4.5 Session Distribution Codes

How volume splits across sessions per week: `d25_33_42`, `d40_60`, etc. Defined in constants. Sessions are abstract units (`A`, `B`, `C`, `D`...) — **never** tied to specific day names.

---

## 5. The Big Cycle (Macrocycle)

### 5.1 Structure

The traditional Soviet macrocycle ("big cycle") consists of:

1. **Preparatory Period** (1-2 months)
   - Higher volume, lower intensity
   - ARI typically 71-74%
   - Builds the "foundation" — work capacity, muscle mass, technical proficiency
   - Volume gradually increases

2. **Competition Period** (1 month)
   - Lower volume, higher intensity
   - ARI typically 74-77%
   - Goal: reach highest athletic form and realize it
   - Volume tapers toward the competition

3. **Transition Period** (1 week to 1 month)
   - Recovery, light training
   - CNS needs at least 3 weeks to recover after maximal competition effort

### 5.2 Planning Algorithm (Plan Strong 70)

**Step I — Monthly Volume**: Determine total NL for the month per lift based on skill level, block type, and athlete history.

**Step II — Volume Dynamics**: Select a Chernyak variant (or custom distribution) to distribute the monthly volume across weeks.

**Step III — Weekly Planning**: Distribute weekly volume across sessions using session distribution patterns (2-5 sessions/week depending on level).

**Step IV — Intensity Assignment**: Assign weights to each session's sets based on the zone distribution and target ARI.

### 5.3 Competition Month Taper

- Volume drops from prep to comp
- Intensity shifts upward (more work in zones 4-5)
- Last 1-2 weeks before competition: sharp volume reduction
- Final heavy session: typically 3-5 days before competition
- Competition week: very light or rest, perhaps 1-2 easy sessions

**Key rule**: Don't exceed 90% 1RM for more than 3 weeks total before a competition.

---

## 6. Training vs. Peaking

**Training** (preparatory period): Develops long-term adaptations — morphological, neurological, biochemical.

**Peaking** (competition period): Mobilizes the organism for a short-term performance spike through:

1. **Increasing intensity >90% 1RM**: Pushes nerve cells from normal to "forced" mode, increasing CNS excitability/"tonus". Can spike CNS twice starting 14 days before competition.

2. **Sharply tapering volume** (by 1/2 or 2/3): Eliminates fatigue traces (fitness-fatigue model). With concentrated loading, allows delayed training effects to manifest.

3. **Optimizing timing of final sessions**: Soviet WL/PL rhythm — train every other day plus specific warm-up 24 hours before the meet to "lead" the organism to peak. US PL cycling — reduced frequency facilitates IIA-to-IIX myosin conversion.

**Critical insight**: If load goes up at the same RPE, you're making progress. If load goes up but takes greater effort, it means either: peaking (intentional), overreaching with a plan, not knowing what you're doing, or a bad day.

---

## 7. Exercise Selection and Dynamics

### 7.1 Exercise Categories

- **Category I (Competition exercises)**: Squat, bench press, deadlift — highest specificity
- **Category II (Specialized variety / SV)**: Close variations of competition lifts (pause squat, close-grip bench, deficit deadlift)
- **Category III (General / GPP)**: Assistance exercises for weak points

**Specificity ratios by level** (Cat I : Cat II : Cat III):
- Beginners: More general work allowed
- Advanced/Elite: Increasing proportion of specific work

### 7.2 Concentric Lifting Speed

- **"Fast"**: As fast as possible without jerking. Compensatory acceleration.
- **"Medium"**: Comfortable, confident speed. Like a first attempt in competition.
- **"Slow"**: Speed of a hard-fought PR single.

Between fast, medium, and slow — **medium speed is the most effective** (greater gains and slower accommodation). Varying speeds is most effective — within a microcycle or across mesocycles.

### 7.3 Eccentric and Transition Variants

Eccentric phase options:
- Controlled eccentric
- "Dive bomb" eccentric
- Mixed eccentric execution
- No negative (drop/reset style where appropriate and safe)

Eccentric-to-concentric transition options:
- Dead-start
- Touch-and-go
- Paused with tension
- Relaxed pause

Static-dynamic method (pauses embedded into dynamic reps) is a high-value option for strength-specific stimulus.

### 7.4 Exercise Order Within Session

- Start with the lift for which heavier weights are prescribed
- If same intensity, vary the order
- Neural/heavy work before metabolic/hypertrophy work
- Strength before endurance (avoid endurance 24-36h after hypertrophy)

### 7.5 Number of Exercises per Session

- Typically 2-4 exercises per session
- 1 main lift + 1-2 assistance exercises is common
- Avoid too many exercises — quality over quantity

### 7.6 Stop Signs (StrongFirst)

Terminate a set immediately if:
- Rep speed slows down
- Tempo drops (pauses between reps increase)
- Technique changes in any way

---

## 8. Sets and Reps Strategies

### 8.1 Ladders

Ladders are sets with ascending reps (e.g., 2, 3, 5). Advantages:
- More sets = more set-ups = more skill practice
- Lower RPE on most sets allows higher total volume with better technique
- Better fatigue management than constant-rep sets

**Standard Ladder** (1/3, 1/2, 2/3 of RM):

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

**Fibonacci Ladder** (third rung = sum of first two): Lower ARE values, better fatigue management.

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

Standard ladder ARE ~50%, skipping first rung ~60%. Fibonacci ladder ARE <=50%.

### 8.2 Training with a Buffer vs. Failure

**Sets to failure (TMI)** — Common in bodybuilding, harmful for strength:
- Example: 6RM = 100kg, sets to failure: 6, 4, 2, 1 = NL 13, high quality reps <50%
- Athlete sore for days, can't train the lift again soon

**Sets with a buffer** — The strength training approach:
- Same 6RM, sets at ~50% RM: 3, 3, 3, 3, 3... = NL 18+, 100% high quality reps
- Not sore, can train the same lift again within days

**Soviet approach**: Prescribe 1/3 to 2/3 of the RM at a given % 1RM.

### 8.3 Historical Set/Rep Schemes

Notable schemes from the literature:
- **Roman (1962)**: 3-6 sets of 1-3 reps at 90-100%
- **Vorobyev (1964)**: 6 sets of 2-3 reps for heavy work
- **Sheyko (2005, 2013)**: Complex multi-set schemes with varying percentages within sessions
- **5x5**: Simple and effective but constant reps = less variability

---

## 9. Frequency and Weekly Structure

### 9.1 Training Frequency Tradeoffs

| Lower frequency (1-2x/week) | Higher frequency (4-6x/week) |
|---|---|
| Time efficient | Time consuming |
| Less skill practice | More skill practice |
| Slower strength gains | Faster strength gains |
| Slow detraining | Rapid detraining |
| Simple planning | Precise planning needed |
| More soreness | Less soreness |

**Developmental (heavy) load frequency**: Once every 5-7 days per quality is safe.

### 9.2 Weekly Templates

**Modified York Barbell** (time-tested for one lift):
- 3 non-consecutive days: Mon-Wed-Fri
- Wednesday = heavy day (preceded by light days -> facilitation effect from 48h prior light load)
- Monday = light (60% of heavy day volume)
- Friday = medium (80% of heavy day volume)
- Intensity: light day reduce from heavy, medium day maintain intensity but lower volume

**Vorobyev template**: 4 days/week with 2 back-to-back (Mon, Tue, Thu, Fri).

### 9.3 Light Days

Four ways to organize:
1. **Same exercise, reduced volume & intensity** (reps and weight lowered 20-30%)
2. **Same exercise, reduced intensity, increased volume** — hypertrophy emphasis
3. **Assistance work only** — SV exercises, ~RPE 8
4. **"Stealth" light day** — heavy day for one lift is a light day for another (e.g., heavy SQ + light BP)

**Operational benchmark ("60% rule")**:
- A common baseline is to set light-day volume to ~60% of heavy-day volume.

**Light day guidelines**: Maintain loads from the higher-volume phase (don't track the heavy day downward as the cycle progresses). Alternatively, keep the same load across all light days.

### 9.4 Combining Lifts

- Combine a light day for one lift with a heavy day for another (e.g., SQ heavy + BP light assistance)
- This was standard Soviet powerlifting practice in the 1980s

### 9.5 Preceding and Following Load Effects

Preceding-load effects:
- Low-volume + medium/high-intensity work can facilitate next-day performance.
- A high-volume lower-body day can depress next-day upper-body performance.
- A high-volume lower-body day can still support hypertrophy-oriented upper-body work via systemic anabolic response.

Following-load effects:
- Deload sessions after very hard sessions are often most effective when exercise nature differs clearly.
- Low-volume/low-intensity follow-up after a large load can potentiate recovery and adaptation.
- Strength and endurance proximity matters: sequence and spacing change interference magnitude.

---

## 10. Mesocycle Design

### 10.1 Types of Mesocycles

- **Introductory**: Getting back into training, low stress
- **Loading**: Building work capacity, moderate stress
- **Stress**: High volume/intensity, pushing adaptation
- **Pre-competition**: Tapering, sharpening
- **Competition**: Peak performance, minimal volume
- **Restorative**: Active recovery

### 10.2 Adaptation Timelines

- **Fast adaptation phase**: Weeks 1-2 of a new stimulus
- **Stabilization phase**: Weeks 3-6 — necessary to lock in adaptations
- **Complete adaptation**: At least 6 weeks (Neumann/East German research)
- **Training residuals**: Maximal strength and hypertrophy adaptations maintained for ~30 +/- 5 days

**Key insight**: Don't change exercises/methods more than once a month — leads to transient adaptations only. However, quantitative parameters (load, volume) can change more frequently.

### 10.3 Session Classification by Load

- **Developmental (heavy)**: Enough to improve the targeted quality after supercompensation
- **Stabilization (medium)**: Same intensity as developmental, lower volume
- **Restorative (light)**: Lower than developmental in both volume and intensity

### 10.4 Rest Intervals Between Sessions (Matveev)

- **Ordinary**: Full recovery to the same work capacity level
- **Stiff**: Under-recovery, summation of effects for a stronger stimulus (used in concentrated/variable loading)
- **Supercompensatory**: Long enough to improve beyond baseline after a developmental session

---

## 11. Cycling Methods

### 11.1 Linear Cycling

Volume decreases while intensity increases linearly over 4-8 weeks. Classic US powerlifting from 1980s-90s.
- Simple to plan and execute
- Change one variable at a time, keep others constant (Morehouse)
- Progress in RPE from ~6-7 to ~8.5-9
- In distributed loading: load for 2 weeks, unload for 2

### 11.2 Wave Cycling

Both volume and intensity oscillate, with an overall upward trend in intensity. "The preferred dynamic is wavelike with a steep increase" (Matveev).
- Classic tactic: 6-week mesocycle = 2 ascending waves (2 steps forward, 1 step back)
- In Soviet programming: volume and intensity increased simultaneously at different rates
- E.g., Dyachkov: increase volume for 3-4 weeks, intensity for 1-2 weeks before cycling back

### 11.3 Step Cycling

Load stabilizes at a plateau for 1-3 microcycles, then jumps to a higher level.
- RPE reverses from linear: starts ~8, drops to ~6 as adaptation occurs at each step
- Preferable for beginners, returning from injury, and very gradual progression
- Sharp step increases -> longer stabilization phase needed
- Deloading days/microcycles allow much higher "steps"

### 11.4 Variable Loading (Plan Strong / Built Strong)

Volume and intensity both fluctuate from session to session and week to week, with quasi-random variation within defined bounds.
- **Ermakov's experiments**: 61% greater strength gains vs. smooth progressive overload
- Athletes in variable loading groups were healthier and felt better
- ARI stays relatively stable (~70-75%); volume swings sharply
- This is the core methodology behind Plan Strong and Built Strong

### 11.5 Concentrated Loading

Fatigue is purposefully accumulated through increased loads and decreased recovery (Verkhoshansky). Performance temporarily drops, then rebounds ("delayed training effect") after deloading.
- 3-4 stress microcycles followed by 2 recovery microcycles
- Monthly volume must be 23-25% of annual volume to qualify as "concentrated"
- Risky and advanced — not for beginners
- Dyachkov guidelines: large load week = 2 large load days, medium week = 1, light week = 0

### 11.6 Block Periodization

Alternate 2-4 week blocks of hypertrophy emphasis and strength emphasis.
- Takes advantage of training residuals (~30 days)
- Resensitizes the organism to each stimulus
- Keep revisiting the same exercises/methods — changing more than monthly leads to transient adaptations
- For off-season: alternating 4-week hypertrophy/strength blocks recommended for all levels

---

## 12. Training Beginners

### 12.1 Volume and Intensity

- Lower total volume but progress faster
- For beginners, progress is largely a **function of intensity** (weight on the bar)
- Less volume variability needed — simpler patterns work
- As one advances, progress increasingly depends on **volume and its proper distribution**

### 12.2 Multi-Year Development

- Minimize advanced methods early in the career — keep the athlete responsive to them later
- Avoid excessive exercise variety for beginners/intermediates (Valmeyer)
- Gradually increase loads over years — athletes who jump too fast reach high levels quickly but leave the sport quickly (Platonov)
- Older/more experienced athletes: improve slower, detrain slower, volume 20-25% lower than younger athletes

### 12.3 Important Principle

"The range of effective training means and methods narrows as the athlete advances." Save advanced tools for when they're needed.

---

## 13. Hypertrophy Training

### 13.1 Soviet Approach

- Allow muscle mass to grow organically — don't accelerate the process
- High volume disrupts metabolism and activates trophic processes
- Increase share of sets of 5-6 reps at 70-75% 1RM (Vorobyev)

### 13.2 Trainable Morphological Factors

| Adaptation | Methods | Notes |
|-----------|---------|-------|
| Myofibrillar hypertrophy | 70-80% 1RM, 1/2-2/3 RM reps, ~3min rest; interrupted sets (5 reps with 8RM, 20-30s rest, 2-3 series); back-off sets 50-65% 1RM 5-10 reps; sets of 8-10 reps RPE 8-8.5 | Many methods; these are StrongFirst top choices |
| Sarcoplasmic hypertrophy | Traditional bodybuilding | Increases strength only for heavyweights through tissue leverage; not recommended for relative strength or speed sports |
| IIA to IIX myosin conversion | Extremely low volume and frequency taper | Applicable for powerlifters and throwers |
| Connective tissue | Very high volume controlled full ROM, minimal resistance | Recommended early in career and off-season |

### 13.3 Timing

- Schedule hypertrophy sessions at the end of training and in the evening
- Avoid endurance training 24-36h after hypertrophy
- In conventional periodization: hypertrophy first in the cycle, neural strength closer to peak
- Hypertrophy cycles should be longer than neural cycles (muscles adapt slower than nerves)

---

## 14. Neurological Strength Factors

| Adaptation | Methods | Notes |
|-----------|---------|-------|
| Increased neural drive | Near-maximal/maximal/supramaximal dynamic efforts; lifts in 91-100% zone; 80-90% to RM; compensatory acceleration 60-80%; isometrics | Isometrics: rapid gains but rapid accommodation (6-8 weeks) |
| Synaptic potentiation | Same methods as increased neural drive | Perforated synapse |
| Synaptic facilitation, myelination | High volume specific practice at 70-85% 1RM (GTG, Plan Strong) | Can be done on light/medium days |
| Intermuscular coordination | Treating strength as a skill practice; specialized variety | |
| Disinhibition | Avoiding muscle failure; sports psychology; pretension; successive induction; supramaximal eccentrics; "dive bomb" full ROM | The synaptic weight turns negative when an attempted action is not completed |

**Critical**: Avoiding muscle failure is essential for neural adaptation. When a rep fails, the nervous system "learns" the failure pattern, making future attempts at that weight harder (negative synaptic weight).

---

## 15. E1RM Estimation (Zonin's Method)

When a direct 1RM test is inadvisable, prefer submaximal estimation procedures.

**Case 1 — RM tested at 80% 1RM (or 77.5-82.5%)**:
- Use the RM-at-80 test as the anchor.
- Estimate reps at other percentages using:
- `RM(P%) = 1 + ((n - 1) / 20) x (100 - P)`
- where `n` = max reps achieved at 80% 1RM, `P` = target percentage.

**Case 2 — RM tested outside 77.5-82.5%**:
- Use the adjusted formula:
- `RM(P%) = RM(Pt%) + ((RM(Pt%) - 1) / (100 - Pt)) x (Pt - P)`
- where `Pt` is the tested percentage and `RM(Pt%)` is reps achieved at that test load.

**Two-point E1RM interpolation**:
- Use two submaximal RM points (typically one in ~3-5RM zone and one in ~8-10RM zone) to linearly interpolate E1RM.
- Treat this as an estimate, then validate in training with execution quality and RPE/RIR.

**RM@80% 1RM lookup** (determines strength endurance level):
- 4-5 reps: Low endurance
- 6-8 reps: Average
- 9-12 reps: High endurance
- 13+: Very high endurance

---

## 16. Select Training Templates

### 16.1 Easy Strength Classic 2.0

For athletes who need strength but don't compete in strength sports:
- 2-3 global barbell exercises, 2-3x/week
- 80-95% 1RM, 1-6 reps, RPE 7-8
- NL 10-20 per session ("easy strength"), 20-30 for better results
- Change intensity every session, vary set/rep scheme
- 3-5min rest, ordinary intervals

### 16.2 Plan Strong Tactical

For military/first responders with unpredictable schedules:
1. Optimize daily load per Plan Strong 70 prep guidelines
2. Obey StrongFirst Stop Signs
3. Train almost daily when possible — "grease the groove"
4. Uncouple volume and intensity
5. Practice sharp load variability (Delta 20 principle)
6. Periodically use concentrated loading
7. Set opportunistic PRs

### 16.3 Algorithm 1118D

For intermediate lifters, 2 barbell lifts (press + squat or deadlift), ongoing use (not peaking):
- Load variability via die rolls for training days, intensity, volume, speed
- Die-based intensity: 1-2 = 70%, 3 = 75%, 4 = 80%, 5-6 = >=85%
- Frequency based on die: Press 2-4 days/week, SQ/DL 1-3 days/week
- Reps per set: 70% = 3-6, 75% = 3-5, 80% = 2-4, 85% = 2-3, >=90% = 1
- Safety rule: if >=90% was used in the previous 7 days and the die indicates >=85%, re-roll inside 70/75/80% options.
- >90% 1RM: Don't roll — work up to a comfortably heavy single; try a PR only if feeling exceptional

### 16.4 Power to the People! 3.0 (PTP 3.0)

Three-phase cycle: Phase I (6/3, NBL 18) -> Phase II (6, 4, 2, NBL 12) -> Phase III (4, 2 -> 2, NBL <=6). Add weight every 3 heavy days. Light days every other session (pendulum principle). Test 1RM 4 days after Phase III.

### 16.5 Stairway to Strength (S2S)

Follows PTP 3.0. Uses (1, 2, 3) x 3 ladders (NBL 18). Every 3rd heavy day (DL) or 2nd (others): take last set to RM. If >=5 reps, add weight. Light days constant at starting weight x 6/3.

### 16.6 Russian Countdown

Follows S2S. Fighter Pullup Program progression adapted for barbell: 4, 3, 2, 1, 1 -> build to 6, 5, 4, 3, 2. Add weight and restart. Stop when sets can't be completed at RPE 8 with perfect form.

### 16.7 Block Blast (Zonin)

15-week program: 4 blocks of 3 weeks + peaking phase. Three session types per week:
1. Maximal strength: 2-4 reps / 5 sets
2. Myofibrillar hypertrophy: 5 reps / 5 sets
3. Sarcoplasmic hypertrophy or Power: 6-10 reps / 5 sets (or VBT/4-6)

Load based on RM@80% 1RM test. Each block increases weight per look-up tables.

### 16.8 Progressive Swap (Zonin)

15-week wave cycle. Within each 4-week block, ARI increases as heavy sets replace light ones. When next block begins, load increases but ARI drops (more light sets). Creates true wave-like ARI progression. Weekly jump based on RM@80% (Reload 2.0 chart).

### 16.9 Triple Tier 2.0 (Zonin)

12 weeks, 3 blocks of 4 weeks. ARI stable at ~71%. Three sessions/week at 85% (H, 15%), 75% (M, 30%), 65% (L, 55%). Delta 20 principle for weekly volume (22-28-35-15%). RM fraction increases block to block (1/3 -> 1/2 -> 2/3). Reps per set increase per block.

### 16.10 Reload / Reload 2.0 (Zonin)

8-week linear cycle. Test 1RM, test RM@80%, determine weekly jump from chart. Weeks 1-5: 5/5 with increasing weight (1RM - 8Y to 1RM - 4Y). Weeks 6-7: 3/3 and 2/2. Week 8: test. Light day: 60% 1RM x 5/5 throughout. Reload 2.0 adds OTM singles at 85% in weeks 6-8 and more precise weight jump algorithm.

### 16.11 Barbell ROP-H (Zonin)

15-week wave cycle. 4 sessions/week rotating H/L/SV across 4 movement patterns (vertical press/pull, horizontal press/pull, squat, hip hinge). Heavy day uses (2, 3, 5) x 3 ladder with weight increasing every 4 weeks. Light day: 60% 1RM x 5/5 (weeks 1-12), peaking in weeks 13-15.

### 16.12 The Battleship (BtS-RND, Zonin)

Variable overload plan using two die rolls per week. Three training weights (85%, 75%, 65% 1RM) with corresponding ladders based on RM at each weight. Weekly templates for 3, 4, or 6 lifts/sessions.

---

## 17. Practical Wisdom and Experience

### 17.1 What Works

- **Variable loading** produces the best long-term strength gains — better than linear or even wave cycling alone
- **Training with a buffer** (well below failure) enables high frequency and volume with quality reps
- **Ladders** are a superior set/rep strategy for managing volume at given intensities
- **"Grease the groove"** — high-frequency, sub-maximal practice — is highly effective for neural strength gains
- **Sharp volume variability** (61% better gains in Ermakov's experiments)
- **Medium concentric speed** is the most effective single speed (but varying speeds is even better)
- **Light days** have numerous benefits: skill practice, anabolic stimulus, synaptic facilitation, CP store building, waviness compliance
- **Concentrated loading followed by deload** produces powerful delayed training effects

### 17.2 What Doesn't Work

- **Training to failure regularly** — destroys technique, accumulates excessive fatigue, teaches the nervous system to fail
- **Constant progressive overload without cycling** — leads to accommodation and plateau
- **Changing exercises more than once a month** — produces only transient adaptations
- **Too many short macrocycles** with frequent peaking — doesn't allow building the volume foundation (Roman)
- **Excessive variety for beginners** — overwhelms adaptive capacity (Valmeyer)
- **Artificial acceleration of recovery** (excessive use of non-specific recovery means) — disrupts natural adaptation (Verkhoshansky)
- **Ignoring stop signs** — training through technique breakdown or speed loss

### 17.3 What Might Work (Context-Dependent)

- **RPE-based programming** — great for beginners (finding weights) and during stressful life periods; gradually integrate with %1RM-based planning
- **Block periodization** (alternating hypertrophy/strength blocks every 2-4 weeks) — works if you revisit the same exercises/methods; takes advantage of 30-day training residuals
- **Isometrics and static-dynamic method** — rapid results but rapid accommodation (6-8 weeks); use periodically
- **Sarcoplasmic hypertrophy** — only beneficial for heavyweight powerlifters through improved tissue leverage; counterproductive for relative strength
- **Supramaximal methods** (forced reps, eccentrics) — for experienced athletes' peaking only; high risk
- **Double-day training** (summation of fatigue) — effective advanced tactic but risky; rarely used in progressive overload, common in variable loading

### 17.4 Key Quotes

> "For beginners, progress is largely a function of intensity / weight on the bar. As one becomes more advanced, progress increasingly depends on the volume and its proper distribution across sessions, weeks, months, and even years."

> "The load must be increased whenever it becomes habitual." (Rodionov)

> "Ideal training involves changing just one of many variables, until that variable reaches a constant. Then you change another, and then another until you reach your goal." (Morehouse)

> "The adaptations of the human organism follow a regular pattern. During the first 1 to 2 weeks of a new training cycle the body adapts quickly to the new stimulus. In the next few weeks, the power of this same stimulus to provoke an adaptation will progressively fade to end completely after 6 weeks." (Olbrecht)

> "When learning to cook a new dish from a recipe, an inexpert cook catches mostly the quantity of the ingredients; an expert cook — rather the way and the sequence of their addition." (Verkhoshansky)

---

## 18. StrongCode Application

### 18.1 How This Maps to the StrongCode System

StrongCode implements the Plan Strong methodology computationally:
- Programs are defined by `input` (client profile, 1RMs, block type), `calculated` (volume targets, zone distributions, weekly/session NL), and `sessions` (actual sets with weights and reps)
- Sessions are labeled `A`, `B`, `C`... — never day names
- Chernyak variants, session distributions, and volume distribution patterns are defined in `scripts/constants.py`
- Zone distribution, ARI calculation, and volume assignment are handled by `scripts/utilities.py` and `scripts/calculate_targets.py`

### 18.2 Program Generation Logic

1. Determine monthly NL per lift based on skill level and block type
2. Select Chernyak variant for weekly volume distribution
3. Distribute weekly volume across sessions using session distribution pattern
4. Assign intensity zones to each session's NL based on target ARI and zone distribution bounds
5. Convert zone assignments to actual weights (round to available increments)
6. Assign reps per set within each zone's guidelines, varying as much as possible
7. Validate: check ARI, NL totals, rep ranges, zone distribution percentages

### 18.3 Validation Rules

- ARI must fall within target range for the block type
- NL totals must match monthly/weekly targets within tolerance
- Rep ranges per set must comply with the zone-specific guidelines
- Zone distribution percentages must be within min/max bounds
- No day names in session labels
- Session count matches `sessions_per_week` configuration
