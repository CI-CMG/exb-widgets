import { ImmutableObject } from 'seamless-immutable';

export interface Config {
  serviceUrl: string;
}

export type IMConfig = ImmutableObject<Config>;
