import {readJson} from 'fs-extra'
import {set} from 'lodash'

import {IProjectConfig} from './types/project'

export async function loadConfig(rootDir: string, overwrites: { [key: string]: string } = {}): Promise<IProjectConfig> {
  const config = await readJson(`${rootDir}/terrac.json`)
  const defaults = {
    backend: {
      keyPrefix: '',
    },
  }

  const result = Object.assign({}, defaults, config) as IProjectConfig

  for (const [key, value] of Object.entries(overwrites)) {
    set(result, key, value)
  }

  return result
}

export function expandVersion(version: string): string[] {
  const versions = []
  const checkSemver = version.match(/(\d+)\.(\d+)\.(\d+)/)

  if (checkSemver) {
    versions.push(
      checkSemver[1],
      `${checkSemver[1]}.${checkSemver[2]}`,
      version,
    )
  } else {
    versions.push(version)
  }

  return versions
}

export function parseConfigOverwrites(inputs: string[] = []): { [key: string]: string } {
  const overwrites: { [key: string]: string } = {}

  for (const conifg of inputs) {
    const [key, value] = conifg.split('=')
    overwrites[key] = value
  }

  return overwrites
}
