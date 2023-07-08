import {Args, Flags, Command} from '@oclif/core'

import {loadConfig, parseConfigOverwrites} from '../utils'
import {BackendFactory} from '../backends/factory'

export default class GetUrl extends Command {
  static description = 'Get the downloadable URL for the module package'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static args = {
    name: Args.string({
      description: 'Module name',
      required: true,
    }),
    version: Args.string({
      description: 'Module version',
      required: false,
    }),
  }

  static flags = {
    'work-directory': Flags.string({
      summary: 'Work directory for the module publication',
      default: '.',
    }),
    'overwrite-config': Flags.string({
      summary: 'Overwrite terrac configuration',
      multiple: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(GetUrl)

    const {name, version} = args
    const workDir = flags['work-directory']
    const config = await loadConfig(workDir, parseConfigOverwrites(flags['overwrite-config']))

    const backend = BackendFactory.create(config.backend)
    const url = await backend.getSourceUrl(name, version)

    this.log(url)
  }
}
