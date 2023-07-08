import {Command, Flags} from '@oclif/core'
import {tmpdir} from 'node:os'
import {unlink} from 'fs-extra'
import {zip} from 'zip-a-folder'

import {loadConfig, parseConfigOverwrites} from '../utils'
import {BackendFactory} from '../backends/factory'

export default class Publish extends Command {
  static description = 'Publish a terraform module'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    'overwrite-config': Flags.string({
      summary: 'Overwrite terrac configuration',
      multiple: true,
    }),
    'work-directory': Flags.string({
      summary: 'Work directory for the module publication',
      default: '.',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Publish)

    const workDir = flags['work-directory']

    // const git = simpleGit(workDir)
    // const gitStatus = await git.status()

    // if (gitStatus.not_added.length > 0 || gitStatus.staged.length > 0) {
    //   throw new Error('workspace not clean')
    // }

    const config = await loadConfig(workDir, parseConfigOverwrites(flags['overwrite-config']))

    const zipPath = `${tmpdir()}/${config.module.name}-${config.module.version}.zip`
    await zip(workDir, zipPath)

    const backend = BackendFactory.create(config.backend)
    const name = config.module.name
    const version = config.module.version

    await backend.publish(name, version, zipPath)
    await unlink(zipPath)
  }
}
