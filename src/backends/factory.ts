import * as Joi from 'joi'

import {BackendS3, IBackendConfigS3, configSchema as s3ConfigSchema} from './s3'
import {BackendLocalDirectory, IBackendConfigLocalDirectory, configSchema as localConfigSchema} from './local-directory'

export const configSchema = Joi.alternatives(s3ConfigSchema, localConfigSchema)

export type IBackendConfig = IBackendConfigS3 | IBackendConfigLocalDirectory

export type IModuleListItem = {
  name: string
  version?: string
}

export type IModuleSource = {
  version: string
  value: string
}

export interface IBackend {
  publish: (name: string, version: string, packagePath: string) => Promise<void>

  list: (name?: string) => Promise<IModuleListItem[]>

  exists: (name: string, version?: string) => Promise<boolean>

  getSource: (name: string, version?: string) => Promise<IModuleSource>
}

export class BackendFactory {
  // eslint-disable-next-line @typescript-eslint/no-empty-function, no-useless-constructor
  constructor() {}

  static create(config: IBackendConfig): IBackend {
    switch (config.type) {
    case 's3':
      return new BackendS3(config)
    case 'local-directory':
      return new BackendLocalDirectory(config)
    default:
      throw new Error('not found')
    }
  }
}
