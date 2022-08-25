import { ImmutableObject } from 'seamless-immutable'

export interface Config {
  featureServiceUrl: string
}

export type IMConfig = ImmutableObject<Config>
