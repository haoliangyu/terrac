import {IBackend} from './factory'
import {expandVersion} from '../utils'
import {IModuleMeta} from '../types/module'
import {ModuleAlreadyExistsError, ModuleNotFoundError} from '../errors'

import {createReadStream} from 'fs-extra'
import {S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand} from '@aws-sdk/client-s3'

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
    if (await this.keyExists(this.getPackageKey(name, version))) {
      throw new ModuleAlreadyExistsError()
    }

    const newPackageKeys = expandVersion(version).map(versionPart => this.getPackageKey(name, versionPart))
    const uploadTasks = newPackageKeys.map(key => this.putObject(key, createReadStream(packagePath)))

    await Promise.all(uploadTasks)

    const meta = await this.getMeta(name)
    const updated = Date.now()

    meta.updated = updated
    meta.releases.push({
      version,
      updated,
    })

    await this.saveMeta(name, meta)
  }

  public async getSourceUrl(name: string, version?: string): Promise<string> {
    let targetVersion = version

    if (!targetVersion) {
      const meta = await this.getMeta(name)
      targetVersion = meta.version
    }

    const key = this.getPackageKey(name, targetVersion)

    if (!this.keyExists(key)) {
      throw new ModuleNotFoundError()
    }

    return `s3::https://s3-${this.config.region}.amazonaws.com/${this.config.bucket}/${this.getPackageKey(name, targetVersion)}`
  }

  public async getMeta(name: string): Promise<IModuleMeta> {
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

  public async saveMeta(name: string, meta: IModuleMeta): Promise<void> {
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
