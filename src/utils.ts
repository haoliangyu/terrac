import {readJson, writeFile} from 'fs-extra'
import {set} from 'lodash'
import * as Joi from 'joi'
import {gt} from 'semver'

import {IProjectConfig} from './types/project'
import {IModuleMeta} from './types/module'
import {configSchema} from './backends/factory'

export const backendConfigSchema = configSchema

export const moduleConfigSchema = Joi.object({
  name: Joi.string().pattern(/^[\dA-Za-z-]+$/).required().description('Module name'),
  version: Joi.string().pattern(/^[\d.a-z-]+$/).required().description('Module version'),
})

export const projectConfigSchema = Joi.object({
  backend: backendConfigSchema.required(),
  module: moduleConfigSchema.optional(),
})

export async function validateConfig(schema: Joi.Schema, config: IProjectConfig): Promise<void> {
  try {
    await schema.validateAsync(config)
  } catch (error) {
    throw new Error(`Terrac configuration is invalid. ${(error as Error).message}`)
  }
}

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

export async function saveConfig(rootDir: string, config: IProjectConfig): Promise<void> {
  await validateConfig(projectConfigSchema, config)
  await writeFile(`${rootDir}/terrac.json`, JSON.stringify(config, null, 2))
}

export function isSemver(version: string): boolean {
  return version.match(/^(\d+)(\.\d+)?(\.\d+)?$/) !== null
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

export function resolveVersion(meta: IModuleMeta, target: string): string {
  const versions = meta.releases.map(release => release.version)

  if (!isSemver(target)) {
    if (target === 'latest') {
      return meta.version
    }

    if (!versions.includes(target)) {
      throw new Error(`The version ${target} is not found.`)
    }

    return target
  }

  let found = '0.0.0'

  for (const version of versions) {
    if (
      isSemver(version) &&
      version.startsWith(target) &&
      gt(version, found)
    ) {
      found = version
    }
  }

  if (found === '0.0.0' && meta.version !== '0.0.0') {
    throw new Error(`The version ${target} cannot be resolved.`)
  }

  return found
}

export function parseConfigOverwrites(inputs: string[] = []): { [key: string]: string } {
  const overwrites: { [key: string]: string } = {}

  for (const conifg of inputs) {
    const [key, value] = conifg.split('=')
    overwrites[key] = value
  }

  return overwrites
}
