/**
 * Frame sequencer driven by elapsed time. SRP: turns dt into a current frame
 * index. No drawing, no knowledge of what the frames depict.
 */
export class Animator {
  private elapsed = 0;
  private index = 0;

  /**
   * @param frameCount number of frames in the loop
   * @param fps frames per second
   * @param loop whether to wrap (true) or clamp on the last frame (false)
   */
  constructor(
    private frameCount: number,
    private fps: number,
    private readonly loop = true,
  ) {}

  update(dt: number): void {
    if (this.frameCount <= 1 || this.fps <= 0) return;
    this.elapsed += dt;
    const frameDur = 1 / this.fps;
    while (this.elapsed >= frameDur) {
      this.elapsed -= frameDur;
      this.index++;
      if (this.index >= this.frameCount) {
        this.index = this.loop ? 0 : this.frameCount - 1;
        if (!this.loop) this.elapsed = 0;
      }
    }
  }

  get frame(): number {
    return this.index;
  }

  /** Retarget to a different clip (e.g. switching teacher animation state). */
  reset(frameCount: number, fps: number): void {
    this.frameCount = frameCount;
    this.fps = fps;
    this.elapsed = 0;
    this.index = 0;
  }
}
