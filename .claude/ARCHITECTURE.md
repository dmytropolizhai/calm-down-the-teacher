# Architecture: Calm Down the Teacher

## Overview

A pixel-art browser game where the player defuses an angry teacher through Quick Time Events (QTE). The player must press the right buttons at the right moment to reduce the teacher's rage meter before time runs out.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Language | TypeScript | Type safety, better DX |
| Rendering | HTML5 Canvas 2D | Pixel art friendly, no heavy engine overhead |
| Build | Vite | Fast HMR, zero-config bundling |
| State | Custom event bus + immutable state | No framework dependency, easy to test |
| Audio | Web Audio API | Precise timing needed for QTE sounds |

---

## Core Principles

- **SRP (S in SOLID)** — each class/module has one reason to change
- **OCP (O in SOLID)** — new teacher types, QTE types, and scenes are added by extension, not modification
- **LSP (L in SOLID)** — all QTE types are substitutable through a common interface
- **ISP (I in SOLID)** — small, focused interfaces; nothing implements methods it doesn't use
- **DIP (D in SOLID)** — high-level game loop depends on abstractions, not concrete renderers or input handlers
- **DRY** — shared pixel-art rendering helpers, single source of truth for game state
- **KISS** — flat module structure, no over-abstraction; prefer plain objects over deep class hierarchies

---

## Directory Structure

```
src/
├── core/
│   ├── GameLoop.ts          # requestAnimationFrame driver; owns update/render cycle
│   ├── EventBus.ts          # typed publish/subscribe; decouples all systems
│   └── StateMachine.ts      # finite state machine used by scenes and teacher AI
│
├── state/
│   ├── GameState.ts         # single immutable snapshot: rage, score, lives, phase
│   └── StateStore.ts        # holds current state, emits change events via EventBus
│
├── scenes/
│   ├── IScene.ts            # interface: update(dt), render(ctx), enter(), exit()
│   ├── MainMenuScene.ts
│   ├── GameplayScene.ts     # orchestrates QTE spawner, teacher, HUD
│   └── GameOverScene.ts
│
├── entities/
│   ├── Teacher.ts           # sprite, rage level, animation state machine
│   └── Player.ts            # avatar, reaction animations
│
├── qte/
│   ├── IQte.ts              # interface: id, prompt, timeLimit, evaluate(input): Result
│   ├── ButtonQte.ts         # single key press (e.g. Space)
│   ├── SequenceQte.ts       # ordered key sequence (e.g. A → B → C)
│   ├── MashQte.ts           # rapid repeated key press
│   ├── QteFactory.ts        # creates QTE instances by type; register new types here
│   └── QteSpawner.ts        # decides when and which QTE to spawn based on game phase
│
├── rendering/
│   ├── Renderer.ts          # wraps Canvas context; pixel-art scale, clear, drawSprite
│   ├── SpriteSheet.ts       # slices a loaded image into named frames
│   ├── Animator.ts          # frame sequencer driven by elapsed time
│   └── PixelFont.ts         # renders bitmap text from a font sprite sheet
│
├── input/
│   ├── InputManager.ts      # listens to keyboard/touch; exposes isPressed(key), flush()
│   └── TouchAdapter.ts      # maps on-screen buttons to key codes for mobile
│
├── audio/
│   ├── AudioManager.ts      # loads and plays sounds; respects mute state
│   └── sounds.ts            # typed enum of sound asset keys
│
├── ui/
│   ├── HUD.ts               # rage meter, score counter, QTE prompt overlay
│   └── PromptDisplay.ts     # animated QTE key prompt (flash, countdown ring)
│
└── assets/
    ├── sprites/             # PNG sprite sheets
    ├── audio/               # OGG/MP3 sound effects
    └── data/
        └── levels.json      # level configs: rage thresholds, QTE weights, time limits
```

---

## Data Flow

```
InputManager
    │  key events
    ▼
QteSpawner ──spawns──► IQte.evaluate(input) ──► Result (success/fail/timeout)
                                                       │
                                                       ▼
                                                 StateStore.dispatch(action)
                                                       │
                                            ┌──────────┴──────────┐
                                            ▼                     ▼
                                      Teacher.react()         HUD.update()
                                      (animation FSM)         (rage meter)
```

---

## Key Abstractions

### `IScene`
```ts
interface IScene {
  enter(): void;
  exit(): void;
  update(dt: number): void;
  render(ctx: CanvasRenderingContext2D): void;
}
```
Scene switching is handled by a `SceneManager` that calls `exit()` on the old scene and `enter()` on the new one — no scene knows about others.

### `IQte`
```ts
interface IQte {
  readonly id: string;
  readonly prompt: QtePrompt;      // what to show the player
  readonly timeLimit: number;      // ms
  tick(dt: number, input: InputSnapshot): QteResult | null; // null = still running
}

type QteResult = 'success' | 'fail' | 'timeout';
```
Adding a new QTE type (e.g. rhythm tap) means implementing `IQte` and registering it in `QteFactory`. Zero changes to `QteSpawner` or `GameplayScene`.

### `GameState` (immutable)
```ts
interface GameState {
  readonly rage: number;        // 0–100; 0 = teacher calm, 100 = game over
  readonly score: number;
  readonly phase: 'intro' | 'gameplay' | 'victory' | 'defeat';
  readonly activeQte: IQte | null;
}
```
State is never mutated in place. `StateStore` produces a new snapshot on each action and notifies subscribers through `EventBus`.

---

## Game Loop

```
GameLoop.start()
  └─ requestAnimationFrame
       ├─ dt = now - lastTime
       ├─ SceneManager.currentScene.update(dt)
       │    ├─ QteSpawner.tick(dt)
       │    ├─ activeQte?.tick(dt, inputSnapshot)  →  result
       │    ├─ StateStore.dispatch(result)
       │    └─ Teacher.update(dt)
       └─ Renderer.clear()
            └─ SceneManager.currentScene.render(ctx)
                 ├─ Teacher.render(ctx)
                 ├─ Player.render(ctx)
                 └─ HUD.render(ctx)
```

---

## Teacher Rage State Machine

```
CALM ──[wrong QTE / timeout]──► ANNOYED ──[more fails]──► FURIOUS
  ▲                                  │                        │
  └──[successful QTE]────────────────┘                        │
  ▲                                                           │
  └──[successful QTE × 3]────────────────────────────────────┘

rage == 0  →  emit 'victory'
rage == 100 →  emit 'defeat'
```

Each state maps to a different animation set and affects QTE spawn rate and time limits.

---

## Level Configuration (`levels.json`)

```json
{
  "levels": [
    {
      "id": "classroom",
      "background": "classroom.png",
      "rageDecayPerSuccess": 15,
      "rageIncreasePerFail": 20,
      "qteCooldownMs": 2000,
      "qteWeights": {
        "button": 0.5,
        "sequence": 0.3,
        "mash": 0.2
      },
      "timeLimits": {
        "button": 1500,
        "sequence": 3000,
        "mash": 2500
      }
    }
  ]
}
```

All balance tuning lives in data, not code.

---

## Extension Points

| Want to add… | Do this |
|---|---|
| New QTE type | Implement `IQte`, register in `QteFactory` |
| New teacher character | Extend `Teacher` with a new sprite sheet + FSM config |
| New scene (e.g. cutscene) | Implement `IScene`, register in `SceneManager` |
| Mobile support | Expand `TouchAdapter` to map buttons to key codes |
| New level | Add an entry to `levels.json` |

---

## Asset Pipeline

1. Sprite sheets are 1×/2× source PNGs, scaled to target pixel size by `Renderer` using `imageSmoothingEnabled = false` to preserve pixel art.
2. Sounds ship as OGG (primary) + MP3 (fallback); `AudioManager` picks the supported format at load time.
3. All assets are imported via Vite's static asset handling and fingerprinted for cache-busting.

---

## Testing Strategy

- **Unit** — `IQte` implementations, `StateMachine`, `StateStore` reducers (pure functions, no DOM needed)
- **Integration** — `QteSpawner` + `StateStore` driven by synthetic input snapshots
- **Visual regression** — screenshot tests on `Renderer` output using a headless Canvas (e.g. `node-canvas`)
- No end-to-end framework needed; the game is self-contained in a single Canvas element