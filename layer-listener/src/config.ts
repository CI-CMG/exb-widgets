import { ImmutableObject } from 'seamless-immutable';

export interface Config {
  layerTitle: string;
}

export type IMConfig = ImmutableObject<Config>;
