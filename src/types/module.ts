export interface IModule {
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

export interface IModuleRelease {
  version: string
  updated: number
  sha: string
}

export interface IModuleMeta extends IModule {
  created: number
  updated: number
  releases: IModuleRelease[]
}
