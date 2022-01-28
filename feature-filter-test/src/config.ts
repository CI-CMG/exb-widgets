import { ImmutableObject } from 'seamless-immutable';

export interface Config {
  zoomLevelToggle: number,
  pointLayerTitle: string,
  densityLayerTitle: string,
  showValues: boolean
}

export type IMConfig = ImmutableObject<Config>;
