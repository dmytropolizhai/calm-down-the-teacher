/**
 * ISP: the smallest surface a scene needs. Every scene implements exactly these
 * four methods — nothing more, nothing it won't use. LSP: any IScene is
 * substitutable in the SceneManager without the game loop knowing the concrete
 * type.
 */
export interface IScene {
  enter(): void;
  exit(): void;
  update(dt: number): void;
  render(ctx: CanvasRenderingContext2D): void;
}
