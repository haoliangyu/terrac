import {IBackend} from './factory'
import {expandVersion} from '../utils'
import {IModuleMeta} from '../types/module'
import {ModuleAlreadyExistsError, ModuleNotFoundError} from '../errors'

import {copy, pathExists, readJson, writeJson} from 'fs-extra'

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
    if (await pathExists(this.getPackagePath(name, version))) {
      throw new ModuleAlreadyExistsError()
    }

    const newPackagePaths = expandVersion(version).map(versionPart => this.getPackagePath(name, versionPart))
    const tasks = newPackagePaths.map(dest => copy(packagePath, dest))

    await Promise.all(tasks)

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

    const path = this.getPackagePath(name, targetVersion)

    if (!(await pathExists(path))) {
      throw new ModuleNotFoundError()
    }

    return this.getPackagePath(name, targetVersion)
  }

  public async getMeta(name: string): Promise<IModuleMeta> {
    const path = this.getMetaPath(name)

    if (await pathExists(path)) {
      return readJson(path)
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
    const path = this.getMetaPath(name)
    await writeJson(path, meta)
  }

  private getMetaPath(name: string): string {
    return `${this.config.path}/${name}/meta.json`
  }

  private getPackagePath(name: string, version: string): string {
    return `${this.config.path}/${name}/${version}/module.zip`
  }
}
