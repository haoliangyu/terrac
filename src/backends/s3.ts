import {IBackend, IModuleListItem, IModuleSource} from './factory'
import {IModuleMeta} from '../types/module'
import {ModuleNotFoundError} from '../errors'

import {createReadStream} from 'fs-extra'
import {uniq} from 'lodash'
import {S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command} from '@aws-sdk/client-s3'
import * as Joi from 'joi'

export const configSchema = Joi.object({
  type: Joi.string().allow('s3').required().description('Backend type'),
  bucket: Joi.string().required().description('Bucket name'),
  region: Joi.string().pattern(/^(?:[a-z]+-){2}\d+$/).required().description('AWS region'),
  keyPrefix: Joi.string().optional().allow('').description('Object key prefix'),
})
export interface IBackendConfigS3 {
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

export class BackendS3 implements IBackend {
  config: IBackendConfigS3
  client: S3Client

  constructor(config: IBackendConfigS3) {
    this.config = config

    this.client = new S3Client({
      // this is a special env for testing
      endpoint: process.env.TERRAC_BACKEND_S3_ENDPOINT,
      region: config.region,
    })
  }

  public async publish(name: string, version: string, packagePath: string): Promise<void> {
    await this.putObject(this.getPackageKey(name, version), createReadStream(packagePath))

    const meta = await this.getMeta(name)
    const updated = Date.now()

    meta.version = version
    meta.updated = updated
    meta.releases.push({
      version,
      updated,
    })

    await this.saveMeta(name, meta)
  }

  public async getSource(name: string, version?: string): Promise<IModuleSource> {
    let targetVersion = version

    if (!targetVersion) {
      const meta = await this.getMeta(name)
      targetVersion = meta.version
    }

    const key = this.getPackageKey(name, targetVersion)

    if (!this.keyExists(key)) {
      throw new ModuleNotFoundError()
    }

    return {
      version: targetVersion,
      value: `s3::https://s3-${this.config.region}.amazonaws.com/${this.config.bucket}/${key}`,
    }
  }

  public async list(name?: string): Promise<IModuleListItem[]> {
    const moduleList = []
    const prefix = this.config.keyPrefix || ''

    if (name) {
      if (!(await this.keyExists(this.getMetaKey(name)))) {
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
      const keys = await this.listKeys(prefix)
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
    const key = version ? this.getPackageKey(name, version) : this.getMetaKey(name)
    return this.keyExists(key)
  }

  private async getMeta(name: string): Promise<IModuleMeta> {
    const bucket = this.config.bucket
    const key = this.getMetaKey(name)

    if (await this.keyExists(key)) {
      const getCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
      const response = await this.client.send(getCommand) as any
      const data = await response.Body.transformToString()
      return JSON.parse(data) as IModuleMeta
    }

    const meta: IModuleMeta = {
      name: name,
      version: '0.0.0',
      created: Date.now(),
      updated: Date.now(),
      releases: [],
    }

    return meta
  }

  private async saveMeta(name: string, meta: IModuleMeta): Promise<void> {
    const metaKey = this.getMetaKey(name)
    await this.putObject(metaKey, JSON.stringify(meta))
  }

  private async putObject(key: string, data: any): Promise<void> {
    const putCommand = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      Body: data,
    })

    await this.client.send(putCommand)
  }

  private async keyExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      })
      await this.client.send(command)

      return true
    // eslint-disable-next-line unicorn/prefer-optional-catch-binding
    } catch (error) {
      return false
    }
  }

  private async listKeys(prefix: string): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.config.bucket,
      Prefix: prefix,
    })
    const response = await this.client.send(command)

    return response.Contents ? response.Contents.map(item => item.Key as string) : []
  }

  private getMetaKey(name: string): string {
    const baseKey = `${name}/meta.json`
    return this.config.keyPrefix ? `${this.config.keyPrefix}${baseKey}` : baseKey
  }

  private getPackageKey(name: string, version: string): string {
    const baseKey = `${name}/${version}/module.zip`
    const keyPrefix = this.config.keyPrefix ?? ''
    return `${keyPrefix}${baseKey}`
  }
}
