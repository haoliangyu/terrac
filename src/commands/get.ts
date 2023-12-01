import {EOL} from 'node:os'
import {Args, Flags, Command} from '@oclif/core'
import * as Joi from 'joi'

import {loadConfig, parseConfigOverwrites, backendConfigSchema, moduleConfigSchema, validateConfig, resolveVersion} from '../utils'
import {BackendFactory} from '../backends/factory'

const requiredConfigSchema = Joi.object({
  backend: backendConfigSchema.required(),
  module: moduleConfigSchema.optional(),
})
export default class Get extends Command {
  static description = 'Get the module source URL of the given module and version.'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-module',
    '<%= config.bin %> <%= command.id %> my-module 1.2.3',
  ]

  static args = {
    name: Args.string({
      description: 'Module name.',
      required: true,
    }),
    version: Args.string({
      description: [
        'Module version. It could be omitted, or a complete semver.',
        'If omitted, it will resolve to the latest version.',
        'If a complete semver is given, it will resolve to the exact version.',
      ].join(EOL),
      required: false,
      default: 'latest',
    }),
  }

  static flags = {
    'work-directory': Flags.string({
      summary: 'Root directory of the module project',
      default: '.',
    }),
    'overwrite-config': Flags.string({
      summary: 'Overwrite terrac configuration',
      multiple: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Get)

    const {name, version} = args
    const workDir = flags['work-directory']
    const config = await loadConfig(workDir, parseConfigOverwrites(flags['overwrite-config']))

    await validateConfig(requiredConfigSchema, config)

    const backend = BackendFactory.create(config.backend)
    const meta = await backend.getMeta(name)

    const resolvedVersion = resolveVersion(meta, version)
    const sourceUrl = await backend.getSourceUrl(name, resolvedVersion)

    this.logJson({
      version: resolvedVersion,
      source: sourceUrl,
    })
  }
}
