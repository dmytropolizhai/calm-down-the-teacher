import { FallingNote, NOTE_SIZE } from '../entities/FallingNote';
import { Teacher } from '../entities/Teacher';
import { HitDetector } from '../notes/HitDetector';
import { NoteSpawner } from '../notes/NoteSpawner';
import { ProceduralSprites } from '../rendering/ProceduralSprites';
import { PALETTE } from '../rendering/palette';
import { columnXs } from '../state/LevelConfig';
import { HUD } from '../ui/HUD';
import { Sound } from '../audio/sounds';
import type { GameContext } from './GameContext';
import type { IScene } from './IScene';

/** Teacher reaction lines; index 9 (the 10th miss) ends the game. */
const PHRASES = [
  'Launch SafeExam Browsers!',
  'Acis uz savu monitoru',
  'Atbilstoši telefons pie skolotāja galda',
  'Tad atbilstoši...',
  "Mikus!",
  'Ar pierakstiem pie skolotāja!',
];

interface Flash {
  column: number;
  t: number; // seconds remaining
}

/**
 * Orchestrates the falling-note loop: intro walk-in, spawning, hit/miss
 * resolution, teacher/HUD reactions, and the victory/defeat handoff. DIP: it
 * talks to NoteSpawner / HitDetector / StateStore through their interfaces and
 * requests scene changes via the context — never reaching into other scenes.
 */
export class GameplayScene implements IScene {
  private readonly teacher: Teacher;
  private readonly spawner: NoteSpawner;
  private readonly detector: HitDetector;
  private readonly hud: HUD;
  private readonly xs: number[];

  private notes: FallingNote[] = [];
  private flashes: Flash[] = [];
  private intro = true;
  private endTimer = -1; // > 0 once victory/defeat fired; switches when it hits 0
  private endTarget: 'gameover' = 'gameover';
  private unsub: Array<() => void> = [];

  private readonly zoneTop: number;
  private readonly zoneBottom: number;

  constructor(private readonly ctx: GameContext) {
    const r = ctx.renderer;
    const lvl = ctx.level;
    this.zoneTop = Math.round(r.height * lvl.hitZoneTopPct);
    this.zoneBottom = Math.round(r.height * lvl.hitZoneBottomPct);
    this.xs = columnXs(lvl.columnKeys.length);

    this.teacher = new Teacher(r.width - 70, 70);
    this.spawner = new NoteSpawner(lvl);
    this.detector = new HitDetector({ top: this.zoneTop, bottom: this.zoneBottom });
    this.hud = new HUD(lvl.initialRage, lvl.maxMisses);
  }

  enter(): void {
    this.ctx.store.reset(this.ctx.level.initialRage);
    this.ctx.store.setPhase('transitioning');
    // teacher walks from the right edge to centre-top over ~1.5s
    this.teacher.x = this.ctx.renderer.width - 70;
    this.teacher.walkTo(this.ctx.renderer.width / 2 - 18);

    this.unsub.push(
      this.ctx.bus.on('VICTORY', () => this.beginEnd()),
      this.ctx.bus.on('DEFEAT', () => this.beginEnd()),
    );
  }

  exit(): void {
    for (const u of this.unsub) u();
    this.unsub = [];
  }

  private beginEnd(): void {
    if (this.endTimer < 0) this.endTimer = 0.9; // let the final reaction land
  }

  update(dt: number): void {
    this.teacher.update(dt, { waving: false });
    this.hud.update(dt, this.ctx.store.get().rage);
    for (const f of this.flashes) f.t -= dt;
    this.flashes = this.flashes.filter((f) => f.t > 0);

    // intro walk-in: hold spawning until the teacher reaches centre
    if (this.intro) {
      if (!this.teacher.walking) {
        this.intro = false;
        this.ctx.store.setPhase('gameplay');
      }
      return;
    }

    if (this.endTimer >= 0) {
      this.endTimer -= dt;
      if (this.endTimer <= 0) this.ctx.switchTo(this.endTarget);
      return; // freeze the field during the end beat
    }

    // spawn
    for (const note of this.spawner.tick(dt)) this.notes.push(note);

    // move
    for (const note of this.notes) note.update(dt);

    // resolve presses (wrong keys are silently ignored — beginner friendly)
    for (const key of this.ctx.input.justPressed()) {
      if (!this.ctx.level.columnKeys.includes(key)) continue;
      const note = this.detector.resolve(key, this.notes);
      if (note) this.onHit(note);
    }

    // detect misses (note fell past the zone untouched)
    for (const note of this.notes) {
      if (!note.hit && !note.missed && this.detector.belowZone(note)) {
        this.onMiss(note);
      }
    }

    // cull finished notes
    this.notes = this.notes.filter((n) => !n.hit && !n.missed);
  }

  private onHit(note: FallingNote): void {
    note.hit = true;
    this.flashes.push({ column: note.column, t: 0.1 });
    this.spawner.recordHit();
    this.ctx.store.registerHit(note.key);
    this.ctx.audio.play(Sound.HIT);
    this.teacher.syncToRage(this.ctx.store.get().rage);
  }

  private onMiss(note: FallingNote): void {
    note.missed = true;
    const before = this.ctx.store.get().misses; // 0-indexed phrase pick
    this.ctx.store.registerMiss(note.key);
    this.ctx.audio.play(Sound.MISS);
    const phrase = PHRASES[Math.min(before, PHRASES.length - 1)];
    this.teacher.react(phrase);
    this.teacher.syncToRage(this.ctx.store.get().rage);
    if (this.ctx.store.get().phase === 'victory' || this.ctx.store.get().phase === 'defeat') {
      this.ctx.audio.play(this.ctx.store.get().phase === 'defeat' ? Sound.DEFEAT : Sound.VICTORY);
    }
  }

  render(): void {
    const r = this.ctx.renderer;
    ProceduralSprites.drawClassroom(r.ctx, r.width, r.height);

    // teacher first, so falling notes are never occluded by the sprite
    this.teacher.render(r);

    // column guides + hit zone
    for (let i = 0; i < this.xs.length; i++) {
      const x = this.xs[i];
      r.withAlpha(0.12, () => r.fillRect(x - NOTE_SIZE / 2, this.zoneTop - 90, NOTE_SIZE, 90 + (this.zoneBottom - this.zoneTop), PALETTE.cream));
    }
    // hit zone bar (glowing)
    r.fillRect(0, this.zoneTop, r.width, this.zoneBottom - this.zoneTop, 'rgba(255,183,77,0.18)');
    r.line(0, this.zoneTop, r.width, this.zoneTop, PALETTE.amber, 2);
    r.line(0, this.zoneBottom, r.width, this.zoneBottom, PALETTE.amber, 1);

    // notes
    for (const note of this.notes) note.render(r);

    // column hit flashes
    for (const f of this.flashes) {
      const a = f.t / 0.1;
      r.withAlpha(a, () => {
        r.fillRect(this.xs[f.column] - NOTE_SIZE / 2, this.zoneTop, NOTE_SIZE, this.zoneBottom - this.zoneTop, PALETTE.cream);
      });
    }

    // key labels under the zone (cream for contrast on the wood floor)
    for (let i = 0; i < this.xs.length; i++) {
      r.font.draw(this.ctx.level.columnKeys[i], this.xs[i], this.zoneBottom + 6, 1, PALETTE.cream, 'center');
    }

    // speech bubble sits above everything in the field
    this.teacher.renderBubble(r);

    // HUD on top
    const s = this.ctx.store.get();
    this.hud.render(r, s.score, s.misses);
  }
}
