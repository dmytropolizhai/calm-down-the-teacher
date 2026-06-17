import levelsData from './assets/data/levels.json';

import { AudioManager } from './audio/AudioManager';
import { EventBus } from './core/EventBus';
import { GameLoop } from './core/GameLoop';
import { InputManager } from './input/InputManager';
import { TouchAdapter } from './input/TouchAdapter';
import { Renderer } from './rendering/Renderer';
import type { LevelConfig, LevelsFile } from './state/LevelConfig';
import { StateStore } from './state/StateStore';
import type { GameContext, SceneName } from './scenes/GameContext';
import { GameOverScene } from './scenes/GameOverScene';
import { GameplayScene } from './scenes/GameplayScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { SceneManager } from './scenes/SceneManager';

function bootstrap(): void {
  const canvas = document.getElementById('game') as HTMLCanvasElement | null;
  if (!canvas) throw new Error('main: <canvas id="game"> not found');

  const level: LevelConfig = (levelsData as LevelsFile).levels[0];

  // Composition root — the one place concrete implementations are wired up.
  const renderer = new Renderer(canvas);
  const input = new InputManager(window);
  const audio = new AudioManager();
  const bus = new EventBus();
  const store = new StateStore(
    bus,
    {
      rageDecayPerHit: level.rageDecayPerHit,
      rageIncreasePerMiss: level.rageIncreasePerMiss,
      maxMisses: level.maxMisses,
    },
    level.initialRage,
  );

  const scenes = new SceneManager();

  const ctx: GameContext = {
    renderer,
    input,
    audio,
    bus,
    store,
    level,
    switchTo: (name: SceneName) => scenes.switchTo(name),
  };

  scenes.register('menu', () => new MainMenuScene(ctx));
  scenes.register('gameplay', () => new GameplayScene(ctx));
  scenes.register('gameover', () => new GameOverScene(ctx));

  // mobile on-screen controls
  new TouchAdapter(input, level.columnKeys);

  scenes.switchTo('menu');

  const loop = new GameLoop(scenes, renderer, input);
  loop.start();
}

bootstrap();
