import {Args, Flags, Command} from '@oclif/core'
import * as Joi from 'joi'
import {EOL} from 'node:os'

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
    '<%= config.bin %> <%= command.id %> my-module latest',
    '<%= config.bin %> <%= command.id %> my-module 1.3.2',
    '<%= config.bin %> <%= command.id %> my-module 1.3',
    '<%= config.bin %> <%= command.id %> --exact my-module 1.3',
  ]

  static args = {
    name: Args.string({
      description: 'Module name',
      required: true,
    }),
    version: Args.string({
      description: [
        'Module version. This could be a version name (like latest), a semver, or a semver component.',
        'By default, terrac will verify the release with the input version and generate the source URL.',
        'If it needs to resolve to an exact version, use the --exact flag.',
      ].join(EOL),
      required: false,
    }),
  }

  static flags = {
    exact: Flags.boolean({
      summary: 'Whether to resolve to an exact version if a named version or a semver component is given',
      default: false,
    }),
    'work-directory': Flags.string({
      summary: 'Root directory of the module configuration',
      default: '.',
    }),
    'overwrite-config': Flags.string({
      summary: 'Overwrite terrac configuration',
      multiple: true,
      hidden: true,
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

    const outputVersion = version ?
      (flags.exact ? resolveVersion(meta, version) : version) :
      resolveVersion(meta, 'latest')
    const sourceUrl = await backend.getSourceUrl(name, outputVersion)

    if (flags.exact && version !== outputVersion) {
      this.log(`The input version is resolved to the exact version ${outputVersion} and available at ${sourceUrl}`)
    } else if (version) {
      this.log(`The release ${version} is found and available at ${sourceUrl}`)
    } else {
      this.log(`The latest release ${outputVersion} is found and available at ${sourceUrl}`)
    }
  }
}
