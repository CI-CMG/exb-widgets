import { ImmutableObject } from 'seamless-immutable';

export interface Config {
  layerTitle: string;
  zoomLevelToggle: number
}

export type IMConfig = ImmutableObject<Config>;
