import {IModule} from './module'
import {IBackendConfig} from '../backends/factory'

/**
 * Project configuration
 */
export interface IProjectConfig {
  /**
   * backend configuration
   */
  backend: IBackendConfig
  /**
   * Terraform module information
   */
  module?: IModule
}
