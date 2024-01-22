import {Command, Flags} from '@oclif/core'
import {tmpdir} from 'node:os'
import {unlink} from 'fs-extra'
import {zip} from 'zip-a-folder'
import * as Joi from 'joi'

import {loadConfig, parseConfigOverwrites, isSemver, expandSemver, backendConfigSchema, moduleConfigSchema, validateConfig} from '../utils'
import {BackendFactory} from '../backends/factory'
import {ModuleAlreadyExistsError} from '../errors'
import {IModule} from '../types/module'

const requiredConfigSchema = Joi.object({
  backend: backendConfigSchema.required(),
  module: moduleConfigSchema.required(),
})

export default class Publish extends Command {
  static description = 'Publish a terraform module'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    overwrite: Flags.boolean({
      summary: 'Overwrite a published version with a new package',
      default: false,
    }),
    'overwrite-config': Flags.string({
      summary: 'Overwrite terrac configuration',
      multiple: true,
      hidden: true,
    }),
    'work-directory': Flags.string({
      summary: 'Root directory of the module project',
      default: '.',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Publish)

    const workDir = flags['work-directory']
    const config = await loadConfig(workDir, parseConfigOverwrites(flags['overwrite-config']))
    const module = config.module as IModule

    await validateConfig(requiredConfigSchema, config)

    const zipPath = `${tmpdir()}/${module.name}-${module.version}.zip`
    await zip(workDir, zipPath)

    const backend = BackendFactory.create(config.backend)
    const name = module.name
    const version = module.version

    if ((await backend.exists(name, version)) && !flags.overwrite) {
      throw new ModuleAlreadyExistsError(name, version)
    }

    // always update latest
    const versions = ['latest']

    if (isSemver(version)) {
      versions.push(...expandSemver(version))
    } else {
      versions.push(version)
    }

    for (const value of versions) {
      // Do NOT assume the backend can support concurrent write
      // eslint-disable-next-line no-await-in-loop
      await backend.upload(name, value, zipPath)
    }

    const meta = await backend.getMeta(name)
    const existingRelease = meta.releases.find(release => release.version === version)

    const updated = Date.now()
    meta.updated = updated

    if (flags.overwrite && existingRelease) {
      existingRelease.updated = updated
    } else {
      meta.version = version
      meta.releases.push({
        version,
        updated,
      })
    }

    await backend.saveMeta(meta)

    await unlink(zipPath)

    const sourceUrl = await backend.getSourceUrl(name, version)
    this.log(`The module is published and available with the source URL: ${sourceUrl}`)
  }
}
