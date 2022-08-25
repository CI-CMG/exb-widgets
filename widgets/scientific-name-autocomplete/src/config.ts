import { ImmutableObject } from 'seamless-immutable'

export interface Config {
  menuItemsConfigUrl: string
}

export type IMConfig = ImmutableObject<Config>
