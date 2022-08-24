import { ImmutableObject } from 'seamless-immutable';

export interface Config {
  databaseVersion: string;
}

export type IMConfig = ImmutableObject<Config>;
