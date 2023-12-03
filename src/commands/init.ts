import {basename} from 'node:path'
import {Command, Flags} from '@oclif/core'
import {input, select, confirm} from '@inquirer/prompts'

import {IBackendConfig} from '../backends/factory'
import {IBackendConfigS3} from '../backends/s3'
import {IBackendConfigGCP} from '../backends/gcp'

import {IModule} from '../types/module'
import {IProjectConfig} from '../types/project'

import {saveConfig} from '../utils'

export default class Init extends Command {
  static description = 'Initialize terrac configuration in a directory.'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    'work-directory': Flags.string({
      summary: 'Root directory of the terraform project',
      default: '.',
    }),
  }

  static args = {}

  public async run(): Promise<void> {
    const {flags} = await this.parse(Init)
    const workDir = flags['work-directory']

    // ask for backend type
    const backendType = await select({
      message: 'Select a backend type',
      choices: [
        {
          name: 'AWS S3',
          value: 's3',
        },
        {
          name: 'GCP Stroage',
          value: 'gcp',
        },
      ],
    })

    const config: IProjectConfig = {
      backend: await this.askForBackendConfig(backendType),
    }

    const isModule = await confirm({message: 'Is this a module to publish?'})

    if (isModule) {
      config.module = await this.askForModuleConfig()
    }

    await saveConfig(workDir, config)

    this.log('Initialization is completed.')
  }

  private async askForModuleConfig(): Promise<IModule> {
    const name = await input({
      message: 'Module name',
      default: basename(process.cwd()),
    })
    const version = await input({
      message: 'Module version',
      default: '0.0.0',
    })

    return {name, version}
  }

  private async askForBackendConfig(type: string): Promise<IBackendConfig> {
    switch (type) {
    case 's3':
      return this.askForS3Config()
    default:
      throw new Error(`Backend type "${type}" is not supported.`)
    }
  }

  private async askForS3Config(): Promise<IBackendConfigS3> {
    const bucket = await this.askForInput('Bucket')
    const region = await this.askForInput('Region')
    const keyPrefix = await this.askForInput('Object key prefix', true)

    return {
      type: 's3',
      bucket,
      region,
      keyPrefix,
    }
  }

  private async askForGCPConfig(): Promise<IBackendConfigGCP> {
    const bucket = await this.askForInput('Bucket')
    const projectId = await this.askForInput('Project')
    const pathPrefix = await this.askForInput('Object path prefix', true)

    return {
      type: 'gcp',
      bucket,
      projectId,
      pathPrefix,
    }
  }

  private async askForInput(message: string, optional = false) {
    const inputMessage = optional ? `[Optional] ${message}` : message
    return input({message: inputMessage})
  }
}
