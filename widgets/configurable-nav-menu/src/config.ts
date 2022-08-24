import { ImmutableObject } from 'seamless-immutable';

export interface UrlEntry {
  url: string;
  label: string;
}
export interface Config {
  menuItemsConfigUrl: string;
}

export type IMConfig = ImmutableObject<Config>;
