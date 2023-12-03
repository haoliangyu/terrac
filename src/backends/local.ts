import {IBackend, IModuleListItem, getNewMeta} from './shared'
import {IModuleMeta} from '../types/module'
import {ModuleNotFoundError} from '../errors'

import * as Joi from 'joi'
import {copy, pathExists, readJson, writeJson, readdir, ensureDir} from 'fs-extra'
import {dirname} from 'node:path'

export const configSchemaLocal = Joi.object({
  type: Joi.string().allow('local').required().description('Backend type'),
  path: Joi.string().required().description('Local directory path'),
})

export interface IBackendConfigLocal {
  /**
   * Backend type
   */
  type: 'local'
  /**
   * Path
   */
  path: string
}

export class BackendLocal implements IBackend {
  config: IBackendConfigLocal

  constructor(config: IBackendConfigLocal) {
    this.config = config
  }

  public async upload(name: string, version: string, packagePath: string): Promise<void> {
    await copy(packagePath, this.getPackagePath(name, version))
  }

  public async getSourceUrl(name: string, version?: string): Promise<string> {
    let targetVersion = version

    if (!targetVersion) {
      const meta = await this.getMeta(name)
      targetVersion = meta.version
    }

    const path = this.getPackagePath(name, targetVersion)

    if (!(await pathExists(path))) {
      throw new ModuleNotFoundError()
    }

    return path
  }

  public async list(name?: string): Promise<IModuleListItem[]> {
    const moduleList = []

    if (name) {
      const modulePath = `${this.config.path}/${name}`

      if (!(await pathExists(modulePath))) {
        throw new ModuleNotFoundError()
      }

      const versions = await this.listDir(modulePath)

      for (const version of versions) {
        moduleList.push({
          name,
          version,
        })
      }
    } else {
      const names = await this.listDir(this.config.path)
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
    return pathExists(path)
  }

  public async getMeta(name: string): Promise<IModuleMeta> {
    const path = this.getMetaPath(name)

    if (await pathExists(path)) {
      return readJson(path)
    }

    return getNewMeta(name)
  }

  public async saveMeta(meta: IModuleMeta): Promise<void> {
    const path = this.getMetaPath(meta.name)
    await ensureDir(dirname(path))
    await writeJson(path, meta)
  }

  private getMetaPath(name: string): string {
    return `${this.config.path}/${name}/meta.json`
  }

  private getPackagePath(name: string, version: string): string {
    return `${this.config.path}/${name}/${version}/module.zip`
  }

  private async listDir(path: string): Promise<string[]> {
    const files = await readdir(path, {withFileTypes: true})
    return files
    .filter(file => file.isDirectory())
    .map(file => file.name)
  }
}
