# The Muster PointZ
## Game Design Document
**Version: F12.13 — Pre-Release**

---

## Contents
- [1. Game Overview](#1-game-overview)
- [2. Controls](#2-controls)
- [3. Core Game Loop](#3-core-game-loop)
- [4. Character Mechanics](#4-character-mechanics)
- [5. Resources](#5-resources)
- [6. Damage Calculation](#6-damage-calculation)
- [7. Character Unlock](#7-character-unlock)
- [8. Character Journal](#8-character-journal)
- [9. Character Stats](#9-character-stats)
- [10. Character Upgrade Tree](#10-character-upgrade-tree)
- [11. Building](#11-building)
- [12. Crafting](#12-crafting)
- [13. Inventory & Storage](#13-inventory--storage)
- [14. Zombies](#14-zombies)
- [15. Level Structure](#15-level-structure)
- [16. Random Events](#16-random-events)
- [17. Character Rarity](#17-character-rarity)
- [18. Status Effects](#18-status-effects)
- [19. Map](#19-map)
- [20. Recipes & Drops](#20-recipes--drops)
- [21. Character Roster](#21-character-roster)
- [22. Zombie Roster](#22-zombie-roster)
- [23. UI/UX](#23-uiux)
- [24. Audio](#24-audio)
- [25. Technical Notes](#25-technical-notes)

---

## 1. Game Overview

- **Title**: The Muster PointZ
- **Genre**: Endless Stage Survival, Zombie Apocalypse, Strategy
- **Art Style**: 3D Isometric, low-poly models, realistic lighting, bloom post-processing
- **Core Concept**: Endless-wave survival arena. Player controls multiple characters against an endless zombie horde, using strategy and positioning to survive until sunrise, at which point the next night begins.

---

## 2. Controls

| Input | Action |
| :--- | :--- |
| **W / A / S / D** | Pan camera |
| **Mouse Scroll** | Zoom camera |
| **M** | Toggle mute (global) |
| **H** | Use healing item from selected character |
| **G** | Use buff item from selected character |
| **Q** | Activate selected character's skill |
| **C** | Open crafting menu |
| **B** | Open building menu |
| **I** | Open inventory |
| **J** | Open journal |
| **K** | Open character stats |
| **L** | Open upgrade tree |
| **T** | Open deploy menu |
| **O** | Open options |
| **R** | Manual reload |
| **ESC** | Pause / close panel |
| **Left Click (character)** | Select character |
| **Left Click (empty)** | Deselect |
| **Right Click (block)** | Move / interact |
| **Right Click (enemy)** | Lock target |
| **Right Click (ally)** | Open inventory sharing |
| **Right Click (sofa/chair/bed)** | Sit / sleep |
| **Left Drag (Jombipedia)** | Rotate 3D model |

---

## 3. Core Game Loop

1. Player begins in the **Main Menu**.
2. Clicking **SURVIVE** opens the **Deploy Menu** with a 15-second countdown.
3. Player deploys characters within the Deploy Cost cap (max 5 characters).
4. Night begins — 4 waves, each 120 seconds of combat + 30 seconds tactical pause.
5. Waves scale in zombie count and complexity; elite appears on Nights that are multiples of 3; boss on multiples of 5.
6. After Wave 4 → Dawn → **Preparation Phase** (5 minutes).
7. Player repairs, crafts, cooks, heals, and prepares for the next night.
8. Repeat until all characters fall (defeat) or player chooses **End the Night** to cash out.

**Fail Condition**: All deployed characters down simultaneously. Session ends and routes to the Session Statistics screen.

---

## 4. Character Mechanics

### 4.1 General & Stats

- Every character has five base stats: **HP, ATK, DEF, AGI, SPD**.
- **Energy bar**: max 100. Fills from zombie kills. Split evenly between all characters who contributed damage.
- **Energy state**: persists across nights and is included in save/load.
- **Skill**: consumes 100 Energy. When a skill is active, Energy cannot regenerate.

### 4.2 Control & Movement

- **Selection**: Left Click a character to select.
- **Movement**: Right Click a block to command movement. Characters run block-to-block via A* pathfinding.
- **Movement Restriction**: characters cannot jump, sprint, or pass through walls. They CAN pass through other characters while moving but cannot stop on an occupied block.
- **Stationary State**: characters are locked in place while casting skills, reviving, constructing, or in throw-mode.
- **Universal Throw Mode**: any throw-type skill (Alvi tray, Reza Molotov, Hafid sticky, Rehan target-pick) opens a 5-second aim window. Character is locked in place. 3D ghost preview shows target validity (blue = valid, red = out of range). LMB confirms; RMB cancels and refunds Energy. On timeout, the game auto-throws at the most dangerous target in range (priority: Boss > Elite > Normal, then nearest).

### 4.3 Combat & Targeting

- **Auto-Targeting**: attacks nearest visible zombie (LOS + range).
- **Lock-on**: Right Click a zombie to lock. Lock is retained across range/LOS loss and re-engages automatically when target re-enters range + LOS. Lock releases permanently when target dies.
- **Cover**: characters position behind furniture, walls (`#`), or barricades to gain cover bonus (Vikry only — see §21).
- **Infinite Ammo**: unlimited reserve. Only magazine capacity and reload duration constrain firing.

### 4.4 Down & Revive

- **Down**: HP reaches 0 → character collapses, is ignored by enemies, cannot act.
- **Revive**: another living character Right Clicks a downed ally within 1 block. Revive takes 7 seconds (Ariz 2 seconds, tree-modified). Reviver is locked in place and cannot shoot during revive.
- **Cancel**: revive cancels if reviver moves, takes damage, is stunned, or the patient recovers.
- **Recovering**: if not revived before the night ends, character enters RECOVERING — misses the next night, loses all inventory, armor, and special slot contents.
- **Defeat**: if all deployed characters go down simultaneously, the run ends.

---

## 5. Resources

| Resource | Scope | Usage |
| :--- | :--- | :--- |
| **Deploy Cost** | Global | Limits how many characters can be deployed. Cap starts at 20, +5 per night, max 100. Additionally, max 5 characters simultaneously. |
| **Respect** | Global | Earned at night end; used to unlock characters and purchase Upgrade Tree nodes. |
| **XP** | Per-character | Levels the character. |
| **Skill Point** | Per-character | Earned on level-up; spent on base stat allocation. |
| **Energy** | Per-character | Bar for skill activation. Max 100. |

---

## 6. Damage Calculation

### 6.1 Core Terms

- **Total ATK**: base ATK + all modifiers (SP allocation, tree, buffs).
- **Total DEF**: base DEF + armor + tree + buffs.
- **HP**: current health.

### 6.2 Damage Formulas

**Zombie → Character (melee)**:
```
Damage = max(1, round(Total ATK × zAtkMul − Character Total DEF))
```
Where `zAtkMul = 1.3` if Alpha Roar buff active AND zombie is not ZAlpha, else 1.

**Skill Damage (flat)**: many skills (Pounce, Ground Slam, Infectious Swipe, Toxic Explosion, Gas Spew) deal **flat damage that ignores DEF**.

**Character → Zombie**: pure ATK with no subtraction. Zombies have no DEF stat.

**Rabid Slash**:
```
Total Damage = round(3 × ATK × zAtkMul − DEF)
Per-hit = Total / 3 (last hit takes remainder)
```

### 6.3 Attack Types

- **Standard**: single bullet, normal hit detection.
- **Piercing**: continues through targets, hit-set prevents double-hit.
- **Incendiary**: applies BURNING on hit.
- **Explosive**: AoE damage on impact.

### 6.4 Multi-Projectile (§6.4.2)

Weapon fires 1 bullet that splits into N projectiles. ATK divided evenly across projectiles.
```
ATK per projectile = Total ATK / N
```
Used by Vikry (5 proj / 25° fan) and Lele (8 proj / 35° fan).

### 6.5 Armor Durability

```
Durability Loss = Total ATK × 0.5
```
Applied on every hit received. Armor breaks when durability ≤ 0.

---

## 7. Character Unlock

Locked characters are obtained two ways:

1. **Respect shop**: during Preparation Phase, spend Respect to unlock (cost per character — see §21).
2. **Random Event rescue**: interact with NPC at a door/window during a random event.

---

## 8. Character Journal

**Keybind: J**

Each deployed character receives 3 missions (1 Easy + 1 Moderate + 1 Hard) at the start of every night. Missions reset every night.

### 8.1 Easy Missions (250 XP each)

| Mission | Requirement |
| :--- | :--- |
| Zombie Slayer I | Defeat 15 normal zombies |
| Damage Dealer I | Deal 1,000 damage |
| First Aid I | Use any healing item 2 times |
| Prepared I | Use any buff item 1 time |
| Survivor I | Survive a night without going down |
| Scavenger: Metal | Collect 15 Metal Scrap |
| Scavenger: Cloth | Collect 15 Cloth |
| Carpenter | Build or repair a Makeshift Barricade 2× |
| Novice Crafter | Craft any item 3 times |
| Level Up | Level up this character once |
| Night Snacks | Use the Stove 1 time |
| Gunner I | Reload your weapon 10 times |

### 8.2 Moderate Missions (500 XP each)

| Mission | Requirement |
| :--- | :--- |
| Zombie Slayer II | Defeat 40 normal zombies |
| Elite Hunter I | Defeat 1 Elite |
| Damage Dealer II | Deal 5,000 damage |
| Ability Spammer | Use your skill 4 times |
| Lifesaver | Revive an ally 1 time |
| Healthy Finish | End a night with HP ≥ 80% |
| Resource Gatherer | Collect 50 resources total |
| Fortifier | Build 5 barricades or traps |
| Apothecary | Craft 2 healing items |
| No Effect | End a night with no status effects |
| Prepared II | Use 3 buff items |
| Teamwork | End a night with 2+ characters alive |

### 8.3 Hard Missions (1,250 XP each)

| Mission | Requirement |
| :--- | :--- |
| Zombie Annihilator | Defeat 100 zombies total |
| Boss Slayer | Defeat 1 Boss |
| Elite Hunter II | Defeat 3 Elites |
| Ultimate Damage | Deal 15,000 damage |
| Ability Master | Use your skill 10 times |
| Flawless Defense | End a night with no character down |
| Heavy Armored | Craft Military Armor once |
| Pure Skill | End a night without any buff item |
| Combat Legend | Deal 25,000 damage |

---

## 9. Character Stats

**Keybind: K**

Manual Skill Point allocation. Cap: **20 allocations per stat**.

| Stat | SP Effect |
| :--- | :--- |
| HP | +5 Max HP per point |
| ATK | +1 per point |
| DEF | +1 per point |
| AGI | +1 per point |
| SPD | +1 per point |

Allocation is applied before percentage-based buffs. Allocation is permanent (no respec).

---

## 10. Character Upgrade Tree

**Keybind: L**

4 paths × 4 tiers. Costs: **10 / 20 / 35 / 50 Respect** per tier. Total: 115 Respect per path, 460 Respect to fully clear one character.

### Recovery

| Tier | Name | Effect |
| :--- | :--- | :--- |
| 1 (10) | Second Wind | −1s revive time when YOU are down |
| 2 (20) | Field Dressing | +10% healing item effect |
| 3 (35) | Helping Hand | −2s revive time when reviving others |
| 4 (50) | Vampiric | +1 HP per bullet that hits an enemy |

### Offensive

| Tier | Name | Effect |
| :--- | :--- | :--- |
| 1 (10) | Sharpened | ATK +25 |
| 2 (20) | Quick Hands | Reload time −10% |
| 3 (35) | Extended Mag | +2 magazine capacity |
| 4 (50) | Pack Tactics | ATK +10/15/20/25% per nearby ally within 1 block (max 4) |

### Defensive

| Tier | Name | Effect |
| :--- | :--- | :--- |
| 1 (10) | Toughened | DEF +25 |
| 2 (20) | Cover Drill | DEF +50% while behind cover |
| 3 (35) | Last Stand | DEF +60% while HP < 30 |
| 4 (50) | Iron Will | Status effect duration −25% |

### Passive

| Tier | Name | Effect |
| :--- | :--- | :--- |
| 1 (10) | Fleet Footed | AGI +10 |
| 2 (20) | Well Fed | +10% buff item effect |
| 3 (35) | Fast Learner | +20% XP gain |
| 4 (50) | Efficient | Deploy cost −25% (rounded) |

---

## 11. Building

**Keybind: B**

Two categories:

### Entry Barricades (install on doors/windows/breaches)
- **Makeshift Barricade** — 15 Wood + 15 Metal · 200 HP · 3s build
- **Reinforced Barricade** — 30 Stone + 30 Wood + 35 Metal · 500 HP · 5s build

### Floor Structures (placed on free indoor blocks)
- **Sandbag** — 20 Cloth · 120 HP · 3s
- **Construction Barrier** — 12 Wood + 16 Metal · 100 HP · 5s
- **Concrete Barrier** — 40 Stone · 200 HP · 7s
- **Barbed Wire** — 20 Metal · 50 HP · SLOW 50% + 5 HP/s · wears per zombie passing
- **Bear Trap** — 40 Metal · STUN 10s · single-use
- **Claymore** — 50 Metal · AoE 100 damage · single-use
- **Incendiary Mines** — 65 Metal · AoE 50 + BURNING · single-use
- **Oil Bucket** — 20 Metal · SLOW 80% on pass · single-use · fades 5s after trigger
- **Metal Spikes** — 45 Metal · 50 HP · SLOW 60% + 10 HP/s · wears per zombie passing

**Access rules**:
- Makeshift Barricade: all characters
- Reinforced Barricade + all Floor Structures: Vikry (barricades) or Reza (traps)

**Repair**: Right Click a damaged barricade. Cost = 50% of original materials. Takes the same time as original build.

**Mansion Wall Breach**: Boss-tier zombies can break through mansion walls. Breached walls create an opening (walkable by zombies and characters). Repair cost: 15 Wood + 20 Stone · 8s. Can also install Makeshift / Reinforced Barricade on the hole.

---

## 12. Crafting

**Keybind: C**

Categories:

### Basic (all characters)
- **Sterilized Cloth** — 5 Cloth · heals 15% HP · cd 5s
- **Lantern** — 2 Cloth + 6 Metal · placeable, lights 5 blocks
- **Storage Box** — 10 Wood + 8 Metal · placeable, stores 20 items

### Cooking (Alvi)
- **Sardines** — 5 Food · ATK+3 DEF+2 · 60s
- **Instant Noodles** — 8 Food · ATK+5 DEF+2 AGI+2 · 60s
- **Oatmeals** — 10 Food · ATK+2 DEF+7 SPD+5 · 80s
- **Roasted Chicken** — 15 Food · ATK+8 DEF+4 AGI+3 SPD+3 · 100s
- **Beef Steak** — 20 Food · ATK+12 DEF+6 AGI+5 SPD+5 +25% XP · 180s · clears status

### First Aid (Ariz)
- **Medical Herbs** — 5 Herbs · heals 20% + 5 HP over 5s · cd 10s
- **Bandage** — 5 Herbs + 5 Cloth · heals 50% · cd 15s · clears status
- **Medical Kit** — 10 Herbs + 10 Cloth · heals 100% · cd 25s · clears status
- **First Aid Spray** — 20 Herbs · AoE heal 2 blk · 10% + 10 HP over 4s · cd 15s
- **Holy Water** — 70 Herbs + 30 Metal · AoE heal 4 blk · 50% + 10 HP over 5s · cd 60s

### Protection (Sobel)
- **Denim Armor** — 30 Cloth · DEF+10 · durability 250
- **Leather Armor** — 50 Cloth · DEF+20 · durability 800
- **Military Armor** — 80 Cloth + 20 Metal + 10 Stone · DEF+40 · durability 1500

**Workbench Bonus** (Garage apparatus):
- Crafting PROTECTION items (Denim/Leather) at the workbench is available to all characters.
- Military Armor remains Sobel-exclusive.
- Sobel-crafted armor: durability ×1.25 and DEF ×1.1 (marked with ★).

---

## 13. Inventory & Storage

### Capacity

- **12 slots** per character (4×3 grid).
- **Stack sizes**: resources 50 · healing 30 · buff 20 · placeable blocks 5 · armor 1 (not stackable).

### Special Slots (per character)

- **Armor Slot** — active armor
- **Recovery Slot** — healing item, auto-consumed
- **Buff Slot** — buff item, auto-consumed

**Auto-Heal**: when toggled ON, fires from Recovery Slot when HP < 80% (respects item cooldown).
**Auto-Buff**: when toggled ON, fires from Buff Slot when no food buff is active.

### Auto-Merge

When any stack becomes partial (item use, partial discard/drop/transfer), matching stacks in the same inventory merge automatically.

### Item Actions

- **Click** item → equip (armor/heal/buff types).
- **Right Click** item → split slider (choose quantity).
- **Drag & Drop** → move to another slot, transfer to another character, or drop on ground.
- **Drag onto trash icon** → discard.
- **Drag onto hand icon** → drop at feet.

### Inventory Sharing (§13)

Right Click an ally within 1 block → opens 12-slot transfer panel. Items can be moved freely between characters via click (all) or Right Click (split).

### Ground Items

Dropped items can be picked up by any character within 1.5 blocks. Items left on ground at night end are lost.

### Death Penalty

Character that enters RECOVERING loses all inventory and special slots (armor, recovery, buff).

### Save System

Full inventory, armor, special slots, and character progression persist across nights and save/load (localStorage).

---

## 14. Zombies

### Spawn

Zombies spawn from the forest around the mansion. Maximum alive at once: **80**.

### XP & Energy Reward

| Tier | XP | Energy |
| :--- | :---: | :---: |
| Normal | 50 | 5 |
| Elite | 150 | 20 |
| Boss | 500 | 75 |

XP goes to the highest-damage contributor. Energy splits evenly between all contributors.

### Drop Rate

Max 2 item types per kill (drops drawn from the pool below, tier-dependent).

### AI

Zombies path toward nearest living character via A*. If blocked by barricade or closed door/window, they attack the obstacle first.

### Wall Breaking

Boss-tier zombies (PZero, ZAlpha) ignore doors/windows and can break mansion walls (`X`/`#`), creating permanent openings until repaired.

### Pathfinding

A* with frame-time-slicing budget: **4 A* calls/frame**. Zombies unable to get a slot this frame retry next frame. Jitter added to repath timers to prevent synchronized bursts.

---

## 15. Level Structure

### Night Cycle

- 4 waves per night.
- Wave = 120 seconds combat + 30 seconds tactical pause.
- Total cycle: 150 seconds per wave, ~10 minutes per night.

### Wave Spawning

- **Continuous streaming**: zombies spawn gradually throughout the wave, not as a single horde.
- **Per-wave count**:
  ```
  nEff = min(nightNumber, 12)
  perWave = ceil((110 + 12 × (nEff − 1)) / 4)
  ```
- Wave 1 (Night 1): 28 zombies
- Wave 3 (Night 5): 37 zombies
- Wave 3 (Night 12): 61 zombies
- Night 12+: capped at 61 per wave

### Tactical Pause (30s)

Spawning stops. Time for repairs, crafting, item pickup, and repositioning.

### Lighting Progression

| Wave | Lighting |
| :--- | :--- |
| 1 | Sunset/dusk |
| 2 | Pitch dark / midnight |
| 3 | Foggy pre-dawn |
| 4 | Sunrise rays |

### Preparation Phase (5 minutes)

- Lighting locked to bright morning state.
- Characters return to living room.
- Barricades and traps persist (not auto-repaired).
- Player can repair, craft, cook, heal, and end the night.

### Deploy Cost

- Starts at 20 at Night 1.
- +5 per night.
- Max 100.
- **Additional constraint**: max 5 characters deployed simultaneously.
- Both constraints must be satisfied to deploy.

### Escalation

- **Elite**: only on nights that are multiples of 3. Count = `night / 3`. Spawns in Wave 2 or 3 (50/50).
- **Boss**: only on nights that are multiples of 5. Count = `night / 5`. Spawns in Wave 3.

### Respect Reward (per night)

```
Respect = clamp(round((10 + 3n + timeBonus × 0.75) / 2), 10, 40)
```
Where `n` = night number, `timeBonus` = seconds saved by clearing waves early.

### Auto-Deploy

If a night begins with 0 characters deployed, the cheapest available character auto-deploys.

---

## 16. Random Events

Random events can occur during tactical pause (12% chance) or preparation phase (6% chance).

### Event Types

- **Window Trap**: NPC appears at window surrounded by zombies.
- **Door Knock**: NPC knocks at door. **55% chance** it's a zombie bait trap.

### Rescue QTE

1. Left Click NPC to begin.
2. Enter 5 arrow keys in correct order within 7 seconds.
3. Maximum 2 attempts.

**On success**: character unlocks instantly and deploys into the mansion.
**On failure**: NPC dragged back into forest; remains locked.

### Door Bait Variant

If trap: 4 zombies burst from treeline immediately.

---

## 17. Character Rarity

| Rarity | Rescue Chance |
| :--- | :---: |
| Common | 60% |
| Rare | 30% |
| Super Rare | 10% |

Unlock screen shows character base stats, skill, passive, and rarity.

---

## 18. Status Effects

| Status | Effect |
| :--- | :--- |
| **STUNNED** | Cannot move or act |
| **SLOWED** | Reduced AGI (movement slows) |
| **BURNING** | Damage over time |
| **MARKED** | Takes extra damage from all sources |

**Stacking**: multiple sources stack up to a hard cap of **90% effectiveness**.

**Boss CC Resistance**: STUNNED capped at 1 second, followed by 5-second immunity.

Duration is not affected by character DEF.

---

## 19. Map

### Mansion — Single Floor

- **Living Room** — sofa, fireplace (interactable for 60s light), main hub.
- **Dining Room** — long table, chairs (interactable to sit).
- **Kitchen** — stove (interactable during waves for buff), sink.
- **Garage** — workbench (armor crafting).
- **Bathroom** — toilet, sink, shower.
- **Bedrooms** — large bed, nightstands, closets.
- **Storage Room** — storage boxes.
- **Multiple entry points**: front door, back door, side windows.
- **Pre-built Makeshift Barricades** at 5 default entry points.

### Grid

- **40 columns × 32 rows**.
- 1 block = 1 world unit = 1 meter.
- Characters and 1×1 zombies occupy exactly 1 block.
- Multi-block zombies (Bloater 2×2, PZero 3×3) occupy multiple blocks.

### Exterior

- Wide grass yard surrounded by forest ring.
- Path beige leading to entrance.
- Characters cannot leave the mansion — fight from windows, doors, and wall breaches.

### Interactables

- **Sofa / Chair / Bed** — sit (5 HP/s regen) or sleep (10 HP/s regen). DEF set to 0 while seated. Auto-stand on damage.
- **Fireplace** — light for 60 seconds of illumination.
- **Stove** — during wave only; buff ATK+10 DEF+5 AGI+3 HP+20 for 60s (1× per wave per character).
- **Workbench** — opens crafting with PROTECTION category unlocked for all characters (Denim/Leather only; Military remains Sobel-exclusive).

---

## 20. Recipes & Drops

### 20.1 Drop Table

| Item | Normal | Elite | Boss |
| :--- | :---: | :---: | :---: |
| Cloth | 60% (1–5) | 45% (3–8) | 37.5% (7–15) |
| Metal Scrap | 37.5% (1–4) | 62.5% (2–6) | 62.5% (5–15) |
| Wild Herbs | 20% (1–3) | 30% (2–5) | 50% (5–8) |
| Stone | 40% (1–4) | 50% (2–6) | 75% (5–10) |
| Wood | 56.25% (1–4) | 75% (2–6) | 100% (5–10) |
| Food Packs | 15% (1–3) | 25% (2–5) | 40% (4–8) |

**Auto-collect**: kills outside the mansion (grass, forest, path) drop items directly to killer's inventory. Kills inside mansion spawn physical ground items.

### 20.2 Crafting Recipes

See §12 for full crafting list.

### 20.3 Building Recipes

See §11 for full building list.

---

## 21. Character Roster

### 21.1 STARTER

#### DIAZ

- **Rarity**: Starter · **Deploy**: 10 · **Weapon**: Pistol
- **Stats**: HP 100 · ATK 52 · DEF 17 · AGI 45 · SPD 45
- **Weapon detail**: 1 bullet · interval 1.0s · reload 3.0s · mag 9 · range 5
- **Skill — ADRENALINE**: SPD+50% · AGI+50% · ATK+30% for 25s
- **Passive — KILLSTACK**: +10 ATK per kill (7s · +2s per kill · max 10 stacks · 10s cooldown)

#### BAMBANG

- **Rarity**: Starter · **Deploy**: 10 · **Weapon**: Dual Pistol
- **Stats**: HP 100 · ATK 30 · DEF 36 · AGI 42 · SPD 60
- **Weapon detail**: 2 bullets · interval 1.0s · reload 5.0s · mag 18 · range 5
- **Skill — MOTIVATED**: 6 rapid shots · first hit ATK+20% · +10% per hit (max +70% · 10s)
- **Passive — MARKED**: attacks MARK enemies (+50% damage from all sources · 5s · resets on hit)

### 21.2 Common

#### REHAN

- **Rarity**: Common · **Deploy**: 10 · **Respect**: 20 · **Weapon**: Heavy Pistol
- **Stats**: HP 100 · ATK 58 · DEF 20 · AGI 40 · SPD 25
- **Weapon detail**: 1 bullet · interval 1.0s · reload 3.0s · mag 7 · range 6
- **Skill — JUST LIKE BACK HOME..**: target-pick mode · ATK+150% (12s) · skill-kill refills Energy to 100 (max ×4 chain)
- **Passive — CHAIN**: +15% Energy gain from every kill

#### MEMET

- **Rarity**: Common · **Deploy**: 15 · **Respect**: 20 · **Weapon**: Mini-SMG
- **Stats**: HP 100 · ATK 20 · DEF 25 · AGI 32 · SPD 70
- **Weapon detail**: 4 bullets burst · interval 1.0s · reload 5.0s · mag 32 · range 4
- **Skill — MAN OF MEDAN**: DEF+200% SPD+150% · no healing · HP floor 1 · locked in place (25s)
- **Passive — MARKED V**: enemies that hit Memet become MARKED (+20% damage · max 5 enemies)

### 21.3 Rare

#### SOBEL

- **Rarity**: Rare · **Deploy**: 20 · **Respect**: 35 · **Weapon**: Machine Gun
- **Stats**: HP 100 · ATK 15 · DEF 30 · AGI 25 · SPD 100
- **Weapon detail**: 10 bullets fan 45° · interval 2.0s · reload 15.0s · mag 100 · range 6
- **Skill — BRRRT, BRTT..**: 60° fan · 15 piercing bullets/volley · no ammo used (20s) · next reload +50%
- **Passive — MAG200**: every 5th reload = 200-round magazine · Special Crafting: Protection

#### VIKRY

- **Rarity**: Rare · **Deploy**: 20 · **Respect**: 35 · **Weapon**: Pump Shotgun
- **Stats**: HP 100 · ATK 125 · DEF 35 · AGI 30 · SPD 24
- **Weapon detail**: 5 projectiles fan 25° · SLOW 50% (3s) · interval 2.5s · reload 8.0s · mag 8 · range 4
- **Skill — I AM THE STORM**: Ricochet ×3 (100/75/70/65% ATK) · STUN 2s all hits · self ATK+20% SPD+30% (15s)
- **Passive — COVER**: within 1 block of his own Sandbag/Construction/Concrete Barrier → ATK+50% DEF+100%
- **Special Building**: Barricades

#### ERRY

- **Rarity**: Rare · **Deploy**: 20 · **Respect**: 35 · **Weapon**: Grenade Launcher
- **Stats**: HP 100 · ATK 225 · DEF 22 · AGI 25 · SPD 17
- **Weapon detail**: 1 explosive bullet · AoE 30% ATK radius 5 · interval 10.0s · reload 17.5s · mag 5 · range 5
- **Skill — EAT THIS!**: 5 explosive bullets fan 45° · each 50% ATK AoE radius 3
- **Passive — ELITE SLAYER**: ×2 ATK vs Elite & Boss zombies

#### ARIZ

- **Rarity**: Rare · **Deploy**: 20 · **Respect**: 35 · **Weapon**: SMG
- **Stats**: HP 100 · ATK 20 · DEF 42 · AGI 55 · SPD 63
- **Weapon detail**: 4 bullets burst · interval 1.0s · reload 5.0s · mag 40 · range 6
- **Skill — NOT ON MY WATCH!**: healing zone radius 3 · HP+20/s to all allies including self (15s)
- **Passive — FAST REVIVE**: revives downed allies in 2s · Special Crafting: First Aid

#### ALVI

- **Rarity**: Rare · **Deploy**: 20 · **Respect**: 35 · **Weapon**: Semi-Auto Rifle
- **Stats**: HP 100 · ATK 72 · DEF 30 · AGI 67 · SPD 45
- **Weapon detail**: 2 piercing bullets · SLOW 35% (3s) · interval 2.0s · reload 6.0s · mag 20 · range 7
- **Skill — FREE MEALS**: meal-tray throw (≤3 blk) · 4-block zone · ATK+40% DEF+25% AGI+30% SPD+35% (35s)
- **Passive — BUFF BOOST**: +25% buff item effect · Special Crafting: Cooking

#### REZA

- **Rarity**: Rare · **Deploy**: 20 · **Respect**: 35 · **Weapon**: Assault Rifle
- **Stats**: HP 100 · ATK 25 · DEF 10 · AGI 70 · SPD 55
- **Weapon detail**: 6 incendiary bullets burst · BURN 20% ATK/s (4s) · interval 1.0s · reload 5.0s · mag 30 · range 6
- **Skill — PYROMANIAC**: molotov (≤5 blk) · impact 50 HP + BURNING 75% ATK/s radius 2 (10s)
- **Passive — PYRO REGEN**: +1 HP per BURNING tick from his attacks
- **Special Building**: Traps

### 21.4 Super Rare

#### LELE

- **Rarity**: Super Rare · **Deploy**: 30 · **Respect**: 50 · **Weapon**: Semi-Auto Shotgun
- **Stats**: HP 100 · ATK 168 · DEF 62 · AGI 25 · SPD 25
- **Weapon detail**: 8 projectiles fan 35° · STUN 3s · interval 2.0s · reload 8.0s · mag 8 · range 6
- **Skill — GORILLA MODE**: consume 50% HP → +ATK/DEF/AGI/SPD equal to HP consumed · fan 45° · STUN 5s · no reload · next reload +70% (15s)
- **Passive — BIG HIT HEAL**: regenerates 3 HP per single hit dealing 300+ damage

#### RAPTOR

- **Rarity**: Super Rare · **Deploy**: 30 · **Respect**: 50 · **Weapon**: Bolt-Action Sniper
- **Stats**: HP 100 · ATK 197 · DEF 37 · AGI 46 · SPD 19
- **Weapon detail**: 1 piercing bullet · SLOW 80% (5s) · interval 6.0s · reload 10.0s · mag 10 · range 10
- **Skill — QUICK-SCOPE**: ATK+100% SPD+100% · interval & reload −50% · AGI−50% · range −20% · STUN 3s on-hit (3s cd/target) · 15s
- **Passive — LAST SHOT**: last-bullet kill → next magazine ATK+30%

#### HAFID

- **Rarity**: Super Rare · **Deploy**: 30 · **Respect**: 50 · **Weapon**: Marksman Rifle
- **Stats**: HP 100 · ATK 190 · DEF 50 · AGI 25 · SPD 34
- **Weapon detail**: 1 incendiary bullet · BURN 35% ATK/s (5s) · interval 4.0s · reload 8.0s · mag 10 · range 8
- **Skill — HAHAHAHA!**: Sticky Bomb · 250% ATK to target + 200% ATK AoE radius 3 (5s stick)
- **Passive — BOMB ENERGY**: skill-kill → +25 Energy (max ×2)

---

## 22. Zombie Roster

### 22.1 Normal Zombies

| Name | HP | ATK | AGI | Interval | Melee | XP | Energy | BLD |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Walker | 140 | 55 | 23 | 1.5s | 1 | 50 | 5 | 20% |
| Runner | 100 | 62 | 42 | 1.0s | 1 | 50 | 5 | 15% |
| Crawler | 125 | 58 | 25 | 1.8s | 1 | 50 | 5 | 15% |
| Biter | 150 | 72 | 20 | 1.2s | 1 | 50 | 5 | 25% |
| Shambler | 190 | 50 | 20 | 2.0s | 1 | 50 | 5 | 30% |
| Screecher | 155 | 75 | 28 | 0.8s | 1 | 50 | 5 | 12% |
| **Spitter** | 130 | 50 | 25 | 1.0s | 1 | 50 | 5 | 15% |

**Spitter** (ranged): spits green venom at targets within 1.5–7 blocks (line of sight required). Impact AoE radius 1.0. Applies BURNING 10 HP/s for 5s (ignores DEF). Dodge by moving >1 block from impact before projectile lands (0.45s travel).

### 22.2 Elite Zombies

#### Bloater
- **Stats**: HP 900 · ATK 69 · AGI 15 · Interval 2.0s · Melee 1 · BLD 100% · **2×2 hitbox**
- **Model**: super-overweight humanoid — bell-curve torso, moobs, double chin, stretch marks, toxic drips
- **Skill 1 — Gas Spew** (10s cd): BURNING 10 HP/s × 5s to target within 3 blocks
- **Skill 2 — Toxic Explosion** (passive, on death): 50 flat AoE damage in 3-block radius + lingering poison zone (5s, SLOW 40%)

#### Creeper
- **Stats**: HP 700 · ATK 82 · AGI 45 · Interval 1.2s · Melee 1 · BLD 40% · 1×1 hitbox
- **Model**: quadruped beastlike — knuckle-walker, torso leaned forward, claws touching ground, spine ridge
- **Skill 1 — Pounce** (12s cd): leaps to target within 4 blocks · 60 flat damage · STUN 3s
- **Skill 2 — Shadow Step** (passive): HP < 50% → AGI ×1.5 for 5s

#### Sprinter
- **Stats**: HP 650 · ATK 72 · AGI 60 · Interval 0.9s · Melee 1 · BLD 35% · 1×1 hitbox
- **Model**: tall skinny — gaunt runner, long limbs, hunched posture, claws at hands, ribs showing
- **Skill 1 — Frenzy Charge** (15s cd): AGI = 90, ×2 damage to nearest barricade (4s)
- **Skill 2 — Rabid Slash** (8s cd): 3 rapid attacks, total damage `(3 × ATK × zAtkMul) − DEF`

### 22.3 Boss Zombies

#### Patient Zero
- **Stats**: HP 2850 · ATK 92 · AGI 20 · Interval 1.8s · Melee 3 · BLD 80% · **3×3 hitbox**
- **Model**: chaotic flesh-blob — 7 heads, 9 arms, 4 legs, random chunks, blood splatters
- **Skill 1 — Outbreak Cry** (30s cd): SLOW 50% on ALL characters for 4s (global)
- **Skill 2 — Infectious Swipe** (12s cd): 92 flat damage in 90° fan (3-block reach) + SLOW 50% for 3s

#### Zombie Alpha
- **Stats**: HP 2500 · ATK 110 · AGI 35 · Interval 1.5s · Melee 2 · BLD 50% · hitR 0.75
- **Model**: muscular heroic-proportioned — bare pale-gray torso, dirty brown pants, scars and blood, glowing red eyes
- **Skill 1 — Alpha Roar** (25s cd): summon 4 normal zombies from ground + buff all other zombies' ATK +30% (15s)
- **Skill 2 — Ground Slam** (15s cd): 150 flat AoE damage in 2-block radius + STUN 4s + destroy nearest barricade
- **CC Resistance**: STUNNED capped at 1s, followed by 5s immunity

---

## 23. UI/UX

### 23.1 Main Menu

Full-screen background photo (`mainmenu.jpg`) with Ken Burns zoom (100% ↔ 110%, 18s ease-in-out loop). Overlaid:

- Title: "THE MUSTER POINT" white + "Z" red rotated 25° clockwise, larger size
- Subtitle: "ENDLESS STAGE SURVIVAL"
- CSS flicker effect (sporadic opacity dips, 6.5s cycle)
- 6 radial-gradient smoke puffs rising from car area
- Vignette gradient on left (readability)

**Buttons** (bottom-left, descending):
1. **SURVIVE** — Start new run at Night 1
2. **LOAD LAST SAVE** — Load saved session (greyed out if no save)
3. **OPTIONS** — Audio settings
4. **KEYBINDINGS** — Key reference
5. **JOMBIPEDIA** — Bestiary & roster reference
6. **EXIT** — Exit confirmation

### 23.2 Deploy Menu

**Keybind: T** (view anytime; changes only during Preparation Phase)

- 2-column grid of character cards
- Shows Respect, Deploy count, Deploy Cost usage
- **DEPLOY / WITHDRAW** buttons per card
- Locked characters shown as silhhouettes with padlock + Respect cost
- 15-second countdown at Night 1 (auto-starts)
- **START NIGHT NOW** button during deploy phase

**Constraints**:
- Max 5 characters
- Deploy Cost total ≤ cap
- Both must be satisfied (AND)

### 23.3 Character Card (Deploy Menu)

Content: portrait, name, level, weapon name, mag size, reload time, base stats, respect cost (if locked), deploy cost, skill icon (hover = tooltip with skill + passive details).

### 23.4 Character Panel (K / J / L)

Tabbed interface:
- **STATS · K** — SP allocation (5 stats × +/-, cap 20)
- **JOURNAL · J** — 3 active missions (Easy / Moderate / Hard) with progress bars
- **UPGRADE · L** — 4×4 tree grid (paths × tiers)

### 23.5 Squad Cards (HUD)

**Bottom-left**, one card per deployed character.

- **Collapsed**: 114px wide, portrait + name only
- **Selected**: expands to 350px, shows HP/Energy/XP bars + status + buff line
- Ammo badge (top-right of portrait) blinks yellow during reload
- Skill icon at bottom-right with durasi fill overlay
- Card states: `selected`, `down`, `recovering`, `resv` (reserve), `critical`

### 23.6 Combat HUD

- **Top bar**: NIGHT · PHASE · TIMER · ZOMBIES · KILLS · RESPECT
- **Night progress bar**: 4 segments with moving marker showing position in wave
- **Session clock**: HH:MM:SS
- **Rail (right)**: hotkey hints
- **Squad info (bottom-left below cards)**: Respect total + Deploy count/cost
- **Kill list (left)**: zombie type + count (only types killed)
- **Chat bubbles (bottom-left above cards)**: ALERT (red) / NOTICE (green), max 3 stack

### 23.7 Overhead UI

Per character: name + level badge + HP/EN/XP mini bars.
Per zombie: name (color-coded: white normal / amber elite / red boss) + HP bar.

### 23.8 Notifications

- **Toasts**: top-right, up to 3.4s each, color-coded
- **Banner**: center-screen large text for phase transitions
- **Float text**: damage numbers, XP, EN, pickup, buff names — object-pooled for performance

### 23.9 Status Feedback

- **Down**: mini card dims, red `+` pulse
- **Taking damage**: card flashes red (flashMats emissive)
- **Critical (HP < 30%)**: card edge blinks amber
- **RECOVERING**: card darkened with `RECOVERING` text + white flicker

### 23.10 End the Night & Session Statistics

**End the Night button** (top-right, Preparation Phase only). Confirm dialog → session statistics overlay:

- Nights Survived
- Total Respect Gained
- Total Damage Dealt
- Normal / Elite / Boss zombies killed
- Down / Revived count
- Healing / Buff items used
- Items crafted
- Fortifications built / repaired
- Resources scavenged
- Survivors rescued
- Total game time
- **MVP cards**: Most Deployed, Damage Dealer, Zombie Slayer

Buttons: **TRY AGAIN — NIGHT 1** · **BACK TO MAIN MENU**

### 23.11 Defeat Screen

Large "NO SURVIVORS LEFT" splash for 2.5s → auto-transition to Session Statistics overlay.

### 23.12 Jombipedia

**Access: Main Menu only.**

Full-screen 3D viewer:
- Left: roster list (ZOMBIES / SURVIVORS tabs)
- Center: 3D model on rotating pedestal, transparent background showing the scene
- Right: info card (name, threat tier, stats, skill/passive for characters)
- Bottom toolbar: TURNTABLE toggle · STANCE toggle · RESET VIEW · × CLOSE
- **Mouse drag** on center area rotates the model
- **Mouse wheel** zooms the camera (clamped 0.45× to 2.4× base)
- Camera auto-frames each model based on bounding box height

### 23.13 Options Panel

**Keybind: O** (accessible from main menu and pause overlay)

3 audio sliders: SFX / BGM / UI. Live-applied, persisted to localStorage.

### 23.14 Keybindings Panel

Full-screen modal from main menu. Lists all controls.

---

## 24. Audio

### Sound Bus

Three buses with independent volume: **SFX** · **BGM** · **UI**. All controlled by Options sliders. Persisted to `localStorage['mpz_options_v1']`.

### SFX

- All game sounds are synthesized (oscillator + noise) with optional `.mp3` file override.
- Custom audio files loaded from `audio/` folder.
- Fallback synthesizer runs when file missing.

### Sound Groups

| Group | Files |
| :--- | :--- |
| Weapon per character | `pistol`, `dualpistol`, `heavypistol`, `minismg`, `machinegun`, `shotgun`, `grenadelauncher`, `smg`, `semirifle`, `assaultrifle`, `semishotgun`, `sniper`, `marksman` |
| Reload per character | `reload`, `reload_bambang`, `reload_rehan`, `reload_memet`, `reload_sobel`, `reload_vikry`, `reload_erry`, `reload_ariz`, `reload_alvi`, `reload_reza`, `reload_lele`, `reload_raptor`, `reload_hafid` |
| Zombie hits | `zhit_1/2/3` variants (random selection) |
| Zombie death | `zdie` |
| Character hits | `charHurt` (`hit.mp3`) |
| Skills | `skill`, `blast`, `alpha_roar`, `bloater_gas`, `bloater_die`, `outbreak_cry`, `slam`, `swipe`, `roar`, `rabid`, `frenzy`, `slash`, `pounce`, `gas` |
| Explosions | `boom`, `incend`, `blast` |
| Traps | `trapSnap`, `zone`, `collapse`, `breach` |
| UI | `invOpen`, `invClose`, `buildOpen`, `buildClose`, `boxOpen`, `boxClose`, `click`, `tick` |
| Item | `pickup`, `levelUp`, `heal`, `eat` |
| Rescue/QTE | `rescue`, `qteOk`, `qteBad`, `qteFail`, `trap`, `charUnlock` |
| Chat | `alert`, `notice` |
| Phase transitions | `nightBegin`, `waveStart`, `nightPass`, `prepStart`, `bossSpawn`, `eliteSpawn`, `defeat` |
| Steps | `stepL`, `stepR` |
| Sticky | `sticky` |

### BGM

| Key | File | Phase |
| :--- | :--- | :--- |
| `menu` | `main_menu.mp3` | Main menu |
| `w1` | `bgm_w1.mp3` | Wave 1 (sunset) |
| `w2` | `bgm_w2.mp3` | Wave 2 (midnight) |
| `w3` | `bgm_w3.mp3` | Wave 3 (pre-dawn) |
| `w4` | `bgm_w4.mp3` | Wave 4 (sunrise) |
| `pause` | `bgm_pause.mp3` | Tactical pause |
| `prep` | `bgm_prep.mp3` | Preparation phase |
| `defeat` | `defeat.mp3` | Defeat |
| `single` | `bgm.mp3` | Fallback for any phase |

**Silent phases**: intro (4s) · dawn (5s) · deploy (15s).

### SFX Variants

Multi-variant support: `zHit` uses 3 files (`zhit_1`, `zhit_2`, `zhit_3`), randomly selected at runtime.

### Throttle

| Sound | Throttle |
| :--- | :---: |
| zHit | 70ms |
| charHurt | 80ms |
| hitBarricade | 150ms |
| slash | 90ms |
| pickup | 60ms |
| tick | 120ms |
| zone | 250ms |

### Pause Behavior

- Auto-pause on tab hide (visibilitychange) pauses game + BGM + construction work sound.
- Auto-resume on tab show (only if pause was triggered by visibility, not ESC).
- ESC pause: manual, requires ESC to resume.

---

## 25. Technical Notes

### Engine

- Three.js r128 (classic script, runs from `file://`).
- Post-processing: UnrealBloomPass.
- Camera: OrthographicCamera for gameplay, PerspectiveCamera for Jombipedia.

### Performance

- **A* pathfinding**: frame budget of 4 calls/frame. Zombies unable to get a slot retry next frame. Jitter added to repath timers to spread load.
- **Float text**: object pool of 60 pre-created DOM elements, reused for damage/XP/EN notifications.
- **Inventory UI**: event delegation on container (no inline handlers per slot).
- **Character portraits**: single offscreen renderer singleton reused across all portraits.

### Save System

`localStorage['musterpointz_save_v1']`. Persists:
- Night number, Respect, roster ownership
- Per-character: level, XP, SP, HP, Energy, inventory, armor, special slots, auto toggles, reload counter, SP allocation, tree progress, journal
- Structures: barricades, traps, walls (with breach state), lanterns, storage boxes
- Ground items

Save only allowed during Preparation Phase.

### Error Reporting

On-screen error overlay displays message + file/line/column + stack trace (when available) with COPY and DISMISS buttons. `window.onerror` hooks with full arguments.

### File Structure

```
/
├── index.html
├── main.js
├── style.css
├── mainmenu.jpg
├── audio/
│   ├── <sound>.mp3
│   └── <bgm>.mp3
└── assets/
    ├── skill_<id>.png
    ├── ic_<item>.png
    └── <build icon>.png
```

---

## End of Document

**Version**: F12.13 — Pre-Release
**Status**: Feature complete for release candidate. Pending: playtest-driven balance tuning, additional enemy variants.