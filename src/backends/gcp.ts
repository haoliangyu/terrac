import {IBackend, IModuleListItem, getNewMeta} from './shared'
import {IModuleMeta} from '../types/module'
import {ModuleNotFoundError} from '../errors'

import {Storage, GetFilesOptions} from '@google-cloud/storage'
import {uniq} from 'lodash'
import * as Joi from 'joi'

export const configSchemaGCP = Joi.object({
  type: Joi.string().allow('gcp').required().description('Backend type'),
  bucket: Joi.string().required().description('Bucket name'),
  projectId: Joi.string().required().description('Google Cloud project ID for the bucket'),
  pathPrefix: Joi.string().optional().allow('').description('Object path prefix'),
})

export interface IBackendConfigGCP {
  /**
   * Backend type
   */
  type: 'gcp'
  /**
   * Bucket name
   */
  bucket: string
  /**
   * Google Cloud project ID for the bucket
   */
  projectId: string
  /**
   * Object path prefix
   */
  pathPrefix?: string
}

export class BackendGCP implements IBackend {
  config: IBackendConfigGCP
  client: Storage
  apiEndpoint: string

  constructor(config: IBackendConfigGCP) {
    this.config = config
    this.apiEndpoint = process.env.TERRAC_BACKEND_GCP_API_ENDPOINT || 'https://www.googleapis.com'
    this.client = new Storage({
      apiEndpoint: process.env.TERRAC_BACKEND_GCP_API_ENDPOINT,
      projectId: this.config.projectId,
    })
  }

  public async upload(name: string, version: string, packagePath: string): Promise<void> {
    await this.uploadFile(this.getPackagePath(name, version), packagePath)
  }

  public async getSourceUrl(name: string, version?: string): Promise<string> {
    let targetVersion = version

    if (!targetVersion) {
      const meta = await this.getMeta(name)
      targetVersion = meta.version
    }

    const path = this.getPackagePath(name, targetVersion)

    if (!this.pathExists(path)) {
      throw new ModuleNotFoundError()
    }

    return `gcs::${this.apiEndpoint}/storage/v1/${this.config.bucket}/${path}`
  }

  public async list(name?: string): Promise<IModuleListItem[]> {
    const moduleList = []
    const prefix = this.config.pathPrefix || ''

    if (name) {
      if (!(await this.pathExists(this.getMetaPath(name)))) {
        throw new ModuleNotFoundError()
      }

      const meta = await this.getMeta(name)

      for (const release of meta.releases) {
        moduleList.push({
          name,
          version: release.version,
        })
      }
    } else {
      const keys = await this.listPaths(prefix)
      const names = uniq(keys.map(key => key.replace(prefix, '').split('/').shift() as string))

      for (const name of names) {
        moduleList.push({
          name,
        })
      }
    }

    return moduleList
  }

  public async exists(name: string, version?: string): Promise<boolean> {
    const path = version ? this.getPackagePath(name, version) : this.getMetaPath(name)
    return this.pathExists(path)
  }

  public async getMeta(name: string): Promise<IModuleMeta> {
    const bucket = this.config.bucket
    const path = this.getMetaPath(name)

    if (await this.pathExists(path)) {
      const result = await this.client.bucket(bucket).file(path).download()
      return JSON.parse(result[0].toString())
    }

    return getNewMeta(name)
  }

  public async saveMeta(meta: IModuleMeta): Promise<void> {
    const metaKey = this.getMetaPath(meta.name)
    await this.uploadObject(metaKey, JSON.stringify(meta))
  }

  private async uploadFile(path: string, localFilePath: string): Promise<void> {
    await this.client
    .bucket(this.config.bucket)
    .upload(localFilePath, {
      destination: path,
    })
  }

  private async uploadObject(path: string, data: any): Promise<void> {
    await this.client
    .bucket(this.config.bucket)
    .file(path)
    .save(data)
  }

  private async pathExists(path: string): Promise<boolean> {
    const result = await this.client.bucket(this.config.bucket).file(path).exists()
    return result[0]
  }

  private async listPaths(prefix?: string): Promise<string[]> {
    const options: GetFilesOptions = {prefix}
    const [files] = await this.client.bucket(this.config.bucket).getFiles(options)

    return files.map(file => file.name)
  }

  private getMetaPath(name: string): string {
    const basePath = `${name}/meta.json`
    return this.config.pathPrefix ? `${this.config.pathPrefix}${basePath}` : basePath
  }

  private getPackagePath(name: string, version: string): string {
    const basePath = `${name}/${version}/module.zip`
    const pathPrefix = this.config.pathPrefix ?? ''
    return `${pathPrefix}${basePath}`
  }
}
