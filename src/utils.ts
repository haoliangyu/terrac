import { readJson } from 'fs-extra'

/**
 * Module access mode
 */
export enum ModuleAccess {
  /**
   * Private access
   */
  private,
  /**
   * Public access
   */
  public
}

export interface ModuleRelease {
  version: string
  updated: number
  sha: string
}

export interface IModuleMetadata {
  name: string
  version: string
  access: ModuleAccess
  created: number
  updated: number
  history: ModuleRelease[]
}

/**
 * TShare project configuration
 */
export interface ITshareConfig {
  /**
   * S3 configuration
   */
  s3: {
    /**
     * Bucket name
     */
    bucket: string
    /**
     * Object key prefix
     */
    keyPrefix?: string
  }
  /**
   * Terraform module metadata
   */
  module: {
    /**
     * Module name
     */
    name: string
    /**
     * Module version
     */
    version: string
    /**
     * Module access mode
     */
    access?: ModuleAccess
  }
}

export async function loadConfig (rootDir: string): Promise<ITshareConfig> {
  const config = await readJson(`${rootDir}/tshare.json`)
  const defaults = {
    s3: {
      keyPrefix: ''
    },
    module: {
      access: ModuleAccess.private.toString()
    }
  }

  return Object.assign({}, defaults, config) as ITshareConfig
}
