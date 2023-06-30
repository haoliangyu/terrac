import {Command, Args, Flags} from '@oclif/core'

import {publish} from '../publish'

export default class Publish extends Command {
  static description = 'Publish a terraform module'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static args = {
    workDir: Args.string({
      name: 'work-directory',
      required: false,
      description: 'Work directory for the module publication',
      default: '.',
    }),
  }

  static flags = {
    'overwrite-config': Flags.string({
      summary: 'Overwrite terrac configuration',
      multiple: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Publish)
    const overwriteConfigs = (flags['overwrite-config'] || []).map(input => {
      const [key, value] = input.split('=')
      return {key, value}
    })

    await publish(args.workDir, {
      overwriteConfigs,
    })
  }
}
