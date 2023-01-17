import { tmpdir } from 'os';
import { simpleGit } from 'simple-git';
import { unlinkSync, existsSync, createReadStream } from 'fs-extra';
import { zip } from 'zip-a-folder';
import { S3Client, PutObjectCommand, ListObjectsV2Command, ListObjectsV2CommandOutput, GetObjectCommand } from "@aws-sdk/client-s3"; 
import { ITshareConfig, IModuleMetadata, ModuleAccess, loadConfig } from './utils'

export interface IPublishOptions {
  /**
   * Whether to dry-run the publication
   */
  dryRun?: boolean;
}

/**
 * 
 * @param config Publish configuration
 */
export async function publish(rootDir: string, options?: IPublishOptions): Promise<void> {
  const git = simpleGit(rootDir)
  const gitStatus = await git.status()

  if (gitStatus.not_added.length > 0 || gitStatus.staged.length > 0) {
    throw new Error('workspace not clean')
  }

  const config = await loadConfig(rootDir)
  const zipPath = `${tmpdir()}/${config.module.name}-${config.module.version}.zip`

  try {
    await zip(rootDir, zipPath);

    const client = new S3Client({});
    const testKey = getKey(config)

    if (await keyExists(client, config.s3.bucket, testKey)) {
      throw new Error('key exists')
    }

    if (options?.dryRun) {
      return
    }

    const uploadKeys = getExpandedKeys(config)
    const uploadTasks = uploadKeys.map(async (key) => {
      const putCommand = new PutObjectCommand({
        Bucket: config.s3.bucket,
        Key: key,
        Body: createReadStream(zipPath)
      });

      await client.send(putCommand);
    })

    await Promise.all(uploadTasks)

    const metadata = await getMetadata(client, config)
    const updated = Date.now()

    metadata.updated = updated
    metadata.history.push({
      version: config.module.version,
      sha: (await git.revparse('HEAD')).trim(),
      updated
    })
  } catch (error) {
    throw error
  } finally {
    if (existsSync(zipPath)) {
      unlinkSync(zipPath)
    }
  }
}

function getKey (config: ITshareConfig): string {
  return `${config.s3.keyPrefix}/${config.module.name}/${config.module.version}.zip`
}

function getExpandedKeys(config: ITshareConfig): string[] {
  const versions = []
  const checkSemver = config.module.version?.match(/(\d+)\.(\d+)\.(\d+)/)

  if (checkSemver) {
    versions.push(
      checkSemver[1],
      `${checkSemver[1]}.${checkSemver[2]}`,
      config.module.version
    )
  } else {
    versions.push(config.module.version)
  }

  return versions.map((version) => `${config.s3.keyPrefix}/${config.module.name}/${version}.zip`)
}

async function keyExists(client: S3Client, bucket: string, key: string): Promise<boolean> {
  const listCommand = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: key,
    MaxKeys: 1
  })
  const listResponse: ListObjectsV2CommandOutput = await client.send(listCommand)

  return listResponse.KeyCount === 1
}

async function getMetadata(client: S3Client, config: ITshareConfig): Promise<IModuleMetadata> {
  const key = `${config.s3.keyPrefix}/${config.module.name}/metadata.json`

  if (await keyExists(client, config.s3.bucket, key)) {
    const getCommand = new GetObjectCommand({
      Bucket: config.s3.bucket,
      Key: key
    })
    const response = await client.send(getCommand) as any
    const data = await response.Body.transformToString();
    return JSON.parse(data) as IModuleMetadata
  } else {
    const metadata: IModuleMetadata = {
      name: config.module.name,
      version: config.module.version,
      access: ModuleAccess.private,
      created: Date.now(),
      updated: Date.now(),
      history: []
    }

    return metadata
  }
}
