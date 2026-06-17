import { LOGICAL_WIDTH } from '../rendering/palette';

/** Shape of one entry in assets/data/levels.json. All balance lives in data. */
export interface LevelConfig {
  readonly id: string;
  readonly background: string;
  readonly rageDecayPerHit: number;
  readonly rageIncreasePerMiss: number;
  readonly initialRage: number;
  readonly maxMisses: number;
  readonly spawnCooldownMs: number;
  readonly noteSpeedPps: number;
  readonly speedScalingPerHit: number;
  readonly columnKeys: string[];
  readonly columnWeights: number[];
  readonly hitZoneTopPct: number;
  readonly hitZoneBottomPct: number;
}

export interface LevelsFile {
  readonly levels: LevelConfig[];
}

/** Logical centre-x for each column, evenly spread with side margins. */
export function columnXs(columnCount: number): number[] {
  const margin = 40;
  const usable = LOGICAL_WIDTH - margin * 2;
  const xs: number[] = [];
  for (let i = 0; i < columnCount; i++) {
    xs.push(Math.round(margin + (usable * (i + 0.5)) / columnCount));
  }
  return xs;
}
