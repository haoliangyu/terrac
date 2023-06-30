import {readJson} from 'fs-extra'
import {ListObjectsV2Command, ListObjectsV2CommandOutput, S3Client} from '@aws-sdk/client-s3'

import {IProjectConfig} from './types/project'

export async function loadConfig(rootDir: string): Promise<IProjectConfig> {
  const config = await readJson(`${rootDir}/terrac.json`)
  const defaults = {
    backend: {
      keyPrefix: '',
    },
  }

  return Object.assign({}, defaults, config) as IProjectConfig
}

export async function keyExists(client: S3Client, bucket: string, key: string): Promise<boolean> {
  const listCommand = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: key,
    MaxKeys: 1,
  })
  const listResponse: ListObjectsV2CommandOutput = await client.send(listCommand)

  return listResponse.KeyCount === 1
}

export function getMetaKey(prefix: string, moduleName: string): string {
  const baseKey = `${moduleName}/meta.json`
  return prefix ? `${prefix}${baseKey}` : baseKey
}

export function getPackageKey(prefix: string, moduleName: string, moduleVersion: string): string {
  const baseKey = `${moduleName}/${moduleVersion}/module.zip`
  return prefix ? `${prefix}${baseKey}` : baseKey
}
