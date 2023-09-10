export class ModuleAlreadyExistsError extends Error {
  constructor(name: string, version?: string) {
    super()

    this.name = 'ModuleAlreadyExists'
    this.message = version ? `The version "${version}" for the module "${name}" already exists.` : `The module "${name}" already exists.`
  }
}

export class ModuleNotFoundError extends Error {
  constructor() {
    super()

    this.name = 'ModuleNotFound'
    this.message = 'This module version is not found in the given backend.'
  }
}
