import {IBackend, IModuleListItem, IModuleSource} from './factory'
import {IModuleMeta} from '../types/module'
import {ModuleNotFoundError} from '../errors'

import {copy, pathExists, readJson, writeJson, readdir} from 'fs-extra'

export interface IBackendConfigLocalDirectory {
  /**
   * Backend type
   */
  type: 'local-directory'
  /**
   * Path
   */
  path: string
}

export class BackendLocalDirectory implements IBackend {
  config: IBackendConfigLocalDirectory

  constructor(config: IBackendConfigLocalDirectory) {
    this.config = config
  }

  public async publish(name: string, version: string, packagePath: string): Promise<void> {
    await copy(packagePath, this.getPackagePath(name, version))

    const meta = await this.getMeta(name)
    const updated = Date.now()

    meta.updated = updated
    meta.version = version
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

    const path = this.getPackagePath(name, targetVersion)

    if (!(await pathExists(path))) {
      throw new ModuleNotFoundError()
    }

    return {
      version: targetVersion,
      value: path,
    }
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

  private async getMeta(name: string): Promise<IModuleMeta> {
    const path = this.getMetaPath(name)

    if (await pathExists(path)) {
      return readJson(path)
    }

    const meta: IModuleMeta = {
      name,
      version: '0.0.0',
      created: Date.now(),
      updated: Date.now(),
      releases: [],
    }

    return meta
  }

  private async saveMeta(name: string, meta: IModuleMeta): Promise<void> {
    const path = this.getMetaPath(name)
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
