import {EOL} from 'node:os'
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

export function isSemver(version: string): boolean {
  return version.match(/(\d+)\.(\d+)\.(\d+)/) !== null
}

export function expandSemver(version: string): string[] {
  const versions = []
  const checkSemver = version.match(/(\d+)\.(\d+)\.(\d+)/)

  if (!checkSemver) {
    throw new Error(`The version "${version}" is not a semver.`)
  }

  versions.push(
    checkSemver[1],
    `${checkSemver[1]}.${checkSemver[2]}`,
    version,
  )

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

export function printKV(data: Record<string, string>): string {
  const lines = []

  for (const [key, value] of Object.entries(data)) {
    lines.push(`${key}:\t${value}`)
  }

  return lines.join(EOL)
}
