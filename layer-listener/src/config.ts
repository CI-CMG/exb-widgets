import { ImmutableObject } from 'seamless-immutable';

export interface Config {
  zoomLevelToggle: number,
  pointLayerTitle: string,
  densityLayerTitle: string
}

export type IMConfig = ImmutableObject<Config>;
