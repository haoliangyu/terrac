import {tmpdir} from 'node:os'
import {set} from 'lodash'
import {simpleGit} from 'simple-git'
import {unlinkSync, existsSync, createReadStream} from 'fs-extra'
import {zip} from 'zip-a-folder'
import {S3Client, PutObjectCommand, GetObjectCommand} from '@aws-sdk/client-s3'

import {IProjectConfig} from './types/project'
import {IModuleMeta, ModuleAccess} from './types/module'
import {loadConfig, keyExists, getMetaKey, getPackageKey} from './utils'

export interface IPublishOptions {
  /**
   * Whether to dry-run the publication
   */
  dryRun?: boolean;
  overwriteConfigs?: {
    key: string;
    value: string;
  }[]
}

/**
 *
 * @param config Publish configuration
 */
export async function publish(workDir: string, options: IPublishOptions = {}): Promise<void> {
  const git = simpleGit(workDir)
  // const gitStatus = await git.status()

  // if (gitStatus.not_added.length > 0 || gitStatus.staged.length > 0) {
  //   throw new Error('workspace not clean')
  // }

  const config = await loadConfig(workDir)
  for (const item of (options.overwriteConfigs || [])) {
    set(config, item.key, item.value)
  }

  const zipPath = `${tmpdir()}/${config.module.name}-${config.module.version}.zip`

  try {
    await zip(workDir, zipPath)

    const client = new S3Client({
      // this is a special env for testing
      endpoint: process.env.TERRAC_BACKEND_S3_ENDPOINT,
      region: config.backend.region,
    })

    const bucket = config.backend.bucket
    const keyPrefix = config.backend.keyPrefix || ''
    const name = config.module.name
    const version = config.module.version

    if (await keyExists(client, bucket, getPackageKey(keyPrefix, name, version))) {
      throw new Error('key exists')
    }

    if (options?.dryRun) {
      return
    }

    const newPackageKeys = expandVersion(version).map(versionPart => getPackageKey(keyPrefix, name, versionPart))
    const uploadTasks = newPackageKeys.map(key => putObject(client, bucket, key, createReadStream(zipPath)))

    await Promise.all(uploadTasks)

    const metadatKey = getMetaKey(keyPrefix, name)
    const metadata = await getMetadata(client, config, metadatKey)
    const updated = Date.now()

    metadata.updated = updated
    metadata.releases.push({
      version: config.module.version,
      sha: (await git.revparse('HEAD')).trim(),
      updated,
    })

    await putObject(client, bucket, metadatKey, JSON.stringify(metadata))
  } finally {
    if (existsSync(zipPath)) {
      unlinkSync(zipPath)
    }
  }
}

function expandVersion(version: string): string[] {
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

async function getMetadata(client: S3Client, config: IProjectConfig, key: string): Promise<IModuleMeta> {
  const bucket = config.backend.bucket as string

  if (await keyExists(client, bucket, key)) {
    const getCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
    const response = await client.send(getCommand) as any
    const data = await response.Body.transformToString()
    return JSON.parse(data) as IModuleMeta
  }

  const metadata: IModuleMeta = {
    name: config.module.name,
    version: config.module.version,
    access: ModuleAccess.private,
    created: Date.now(),
    updated: Date.now(),
    releases: [],
  }

  return metadata
}

async function putObject(client: S3Client, bucket: string, key: string, data: any): Promise<void> {
  const putCommand = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: data,
  })

  await client.send(putCommand)
}
