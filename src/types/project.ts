import {IModule} from './module'

export interface IProjectBackendS3 {
  /**
   * Backend type
   */
  type: 's3'
  /**
   * Bucket name
   */
  bucket: string
  /**
   * Bucket region
   */
  region: string
  /**
   * Object key prefix
   */
  keyPrefix?: string
}

/**
 * Project configuration
 */
export interface IProjectConfig {
  /**
   * backend configuration
   */
  backend: IProjectBackendS3
  /**
   * Terraform module information
   */
  module: IModule
}
