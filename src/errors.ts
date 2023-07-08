export class ModuleAlreadyExistsError extends Error {
  constructor() {
    super()

    this.name = 'ModuleAlreadyExists'
    this.message = 'This module and version already exist in the given backend.'
  }
}

export class ModuleNotFoundError extends Error {
  constructor() {
    super()

    this.name = 'ModuleNotFound'
    this.message = 'This module version is not found in the given backend.'
  }
}
