import {IModuleMeta} from '../types/module'

export type IModuleListItem = {
  name: string
  version?: string
}

export type IModuleSource = {
  version: string
  value: string
}

export interface IBackend {
  upload: (name: string, version: string, packagePath: string) => Promise<void>

  list: (name?: string) => Promise<IModuleListItem[]>

  exists: (name: string, version?: string) => Promise<boolean>

  getSourceUrl: (name: string, version?: string) => Promise<string>

  getMeta: (name: string) => Promise<IModuleMeta>

  saveMeta: (meta: IModuleMeta) => Promise<void>
}

/**
 * Get a new inital metadata for a module
 * @param name module name
 * @returns module metadata object
 */
export function getNewMeta(name: string): IModuleMeta {
  const meta: IModuleMeta = {
    name: name,
    version: '0.0.0',
    created: Date.now(),
    updated: Date.now(),
    releases: [],
  }

  return meta
}
