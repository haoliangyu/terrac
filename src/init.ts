import {writeJson} from 'fs-extra'
import {IProjectConfig} from './types/project'

/**
 * Initialize a project with terrac
 * @param workDir Work diectory
 * @param config Project configuration
 * @returns Promise
 */
export async function init(workDir: string, config: IProjectConfig): Promise<void> {
  await writeJson(`${workDir}/terrac.json`, config)
}
