import {writeJson} from 'fs-extra'
import {ITshareConfig} from './utils'

/**
 * Initialize a project with TShare
 * @param config Project configuration
 */
export async function init(rootDir: string, config: ITshareConfig): Promise<void> {
  await writeJson(`${rootDir}/tshare.json`, config)
}
