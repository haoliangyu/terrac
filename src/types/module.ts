export interface IModule {
  /**
   * Module name
   */
  name: string
  /**
   * Module version
   */
  version: string
}

export interface IModuleRelease {
  version: string
  updated: number
}

export interface IModuleMeta extends IModule {
  created: number
  updated: number
  releases: IModuleRelease[]
}
