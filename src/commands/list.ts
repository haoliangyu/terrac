import {Args, Flags, Command} from '@oclif/core'
import {gt} from 'semver'
import {loadConfig, parseConfigOverwrites} from '../utils'
import {BackendFactory} from '../backends/factory'

export default class List extends Command {
  static description = 'List available modules and versions.'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> my-module',
  ]

  static args = {
    name: Args.string({
      description: 'Module name',
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
    const {args, flags} = await this.parse(List)

    const {name} = args
    const workDir = flags['work-directory']
    const config = await loadConfig(workDir, parseConfigOverwrites(flags['overwrite-config']))

    const backend = BackendFactory.create(config.backend)
    const modules = await backend.list(name)

    if (name) {
      modules.sort((a, b) => {
        const aVersion = a.version || ''
        const bVersion = b.version || ''
        return gt(aVersion, bVersion) ? -1 : 1
      })

      for (const module of modules) {
        this.log(module.version)
      }
    } else {
      modules.sort((a, b) => a.name.localeCompare(b.name))

      for (const module of modules) {
        this.log(module.name)
      }
    }
  }
}
