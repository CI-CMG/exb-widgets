import { ImmutableObject } from 'seamless-immutable'

export interface Config {
  erddapBaseUrl: string
}

export type IMConfig = ImmutableObject<Config>
