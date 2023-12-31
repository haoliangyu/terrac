import * as Joi from 'joi'

import {IBackend} from './shared'
import {BackendS3, IBackendConfigS3, configSchemaS3} from './s3'
import {BackendLocal, IBackendConfigLocal, configSchemaLocal} from './local'
import {BackendGCP, IBackendConfigGCP, configSchemaGCP} from './gcp'
import {BackendAzure, IBackendConfigAzure, configSchemaAzure} from './azure'

export const configSchema = Joi.alternatives(configSchemaS3, configSchemaLocal, configSchemaGCP, configSchemaAzure)

export type IBackendConfig = IBackendConfigS3 | IBackendConfigLocal | IBackendConfigGCP | IBackendConfigAzure

export class BackendFactory {
  // eslint-disable-next-line @typescript-eslint/no-empty-function, no-useless-constructor
  constructor() {}

  static create(config: IBackendConfig): IBackend {
    switch (config.type) {
    case 's3':
      return new BackendS3(config)
    case 'local':
      return new BackendLocal(config)
    case 'gcp':
      return new BackendGCP(config)
    case 'azure':
      return new BackendAzure(config)
    default:
      throw new Error('Unrecongized backend type')
    }
  }
}

