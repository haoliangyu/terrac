import {IBackend, IModuleListItem, getNewMeta} from './shared'
import {IModuleMeta} from '../types/module'
import {ModuleNotFoundError} from '../errors'

import {BlobServiceClient, ContainerClient} from '@azure/storage-blob'
import {DefaultAzureCredential} from '@azure/identity'
import {uniq} from 'lodash'
import * as Joi from 'joi'

export const configSchemaAzure = Joi.object({
  type: Joi.string().allow('azure').required().description('Backend type'),
  account: Joi.string().required().description('Account name'),
  container: Joi.string().required().description('Container name'),
  fileNamePrefix: Joi.string().optional().allow('').description('File name prefix'),
})

export interface IBackendConfigAzure {
  /**
   * Backend type
   */
  type: 'azure'
  /**
   * Account name
   */
  account: string
  /**
   * Container name
   */
  container: string
  /**
   * File name prefix
   */
  fileNamePrefix?: string
}

export class BackendAzure implements IBackend {
  config: IBackendConfigAzure
  containerClient: ContainerClient
  serviceUrl: string

  constructor(config: IBackendConfigAzure) {
    this.config = config
    this.serviceUrl = process.env.TERRAC_BACKEND_AZURE_SERVICE_URL || `https://${this.config.account}.blob.core.windows.net`

    const serviceClient = new BlobServiceClient(this.serviceUrl,  new DefaultAzureCredential())
    this.containerClient = serviceClient.getContainerClient(this.config.container)
  }

  public async upload(name: string, version: string, packagePath: string): Promise<void> {
    await this.uploadFile(this.getPackageFileName(name, version), packagePath)
  }

  public async getSourceUrl(name: string, version?: string): Promise<string> {
    let targetVersion = version

    if (!targetVersion) {
      const meta = await this.getMeta(name)
      targetVersion = meta.version
    }

    const fileName = this.getPackageFileName(name, targetVersion)

    if (!this.fileNameExists(fileName)) {
      throw new ModuleNotFoundError()
    }

    const blobClient = await this.containerClient.getBlobClient(fileName)

    return blobClient.url
  }

  public async list(name?: string): Promise<IModuleListItem[]> {
    const moduleList = []
    const prefix = this.config.fileNamePrefix || ''

    if (name) {
      if (!(await this.fileNameExists(this.getMetaFileName(name)))) {
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
      const keys = await this.listFileNames(prefix)
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
    const fileName = version ? this.getPackageFileName(name, version) : this.getMetaFileName(name)
    return this.fileNameExists(fileName)
  }

  public async getMeta(name: string): Promise<IModuleMeta> {
    const fileName = this.getMetaFileName(name)

    if (await this.fileNameExists(fileName)) {
      const bolbClient = this.containerClient.getBlobClient(fileName)
      const result = await bolbClient.downloadToBuffer()
      return JSON.parse(result.toString())
    }

    return getNewMeta(name)
  }

  public async saveMeta(meta: IModuleMeta): Promise<void> {
    const metaKey = this.getMetaFileName(meta.name)
    await this.uploadObject(metaKey, JSON.stringify(meta))
  }

  private async uploadFile(fileName: string, localFilePath: string): Promise<void> {
    const blockBlobClient = await this.containerClient.getBlockBlobClient(fileName)
    await blockBlobClient.uploadFile(localFilePath)
  }

  private async uploadObject(fileName: string, data: any): Promise<void> {
    const blockBlobClient = await this.containerClient.getBlockBlobClient(fileName)
    await blockBlobClient.uploadData(Buffer.from(data))
  }

  private async fileNameExists(fileName: string): Promise<boolean> {
    const blobClient = this.containerClient.getBlobClient(fileName)
    return blobClient.exists()
  }

  private async listFileNames(prefix?: string): Promise<string[]> {
    const fileNames = []

    for await (const blob of this.containerClient.listBlobsFlat({prefix})) {
      fileNames.push(blob.name)
    }

    return fileNames
  }

  private getMetaFileName(name: string): string {
    const basePath = `${name}/meta.json`
    return this.config.fileNamePrefix ? `${this.config.fileNamePrefix}${basePath}` : basePath
  }

  private getPackageFileName(name: string, version: string): string {
    const basePath = `${name}/${version}/module.zip`
    const prefix = this.config.fileNamePrefix ?? ''
    return `${prefix}${basePath}`
  }
}
