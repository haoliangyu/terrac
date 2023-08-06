import {expect, test} from '@oclif/test'
import {S3Client, ListObjectsV2Command, ListObjectsV2CommandOutput} from '@aws-sdk/client-s3'
import {tmpdir} from 'node:os'
import {pathExists, ensureDir} from 'fs-extra'

const s3 = new S3Client({
  endpoint: 'http://s3.localhost.localstack.cloud:4566',
  region: 'us-east-1',
})

const bucket = process.env.TEST_BUCKET as string
const localDir = `${tmpdir()}/terrac-publish-test-${Date.now()}`

describe('commands/publish', () => {
  test
  .stdout()
  .command([
    'publish',
    '--work-directory',
    'test/fixtures/basic-module-s3',
    '--overwrite-config',
    'module.name=test-publish',
    '--overwrite-config',
    `backend.bucket=${bucket}`,
  ])
  .it('should publish a module to S3', async () => {
    expect(await keyExists(s3, bucket, 'test-publish/meta.json')).to.be.true
    expect(await keyExists(s3, bucket, 'test-publish/1/module.zip')).to.be.true
    expect(await keyExists(s3, bucket, 'test-publish/1.2/module.zip')).to.be.true
    expect(await keyExists(s3, bucket, 'test-publish/1.2.3/module.zip')).to.be.true
  })

  test
  .do(async () => {
    await ensureDir(localDir)
  })
  .stdout()
  .command([
    'publish',
    '--work-directory',
    'test/fixtures/basic-module-local-directory',
    '--overwrite-config',
    'module.name=test-publish',
    '--overwrite-config',
    `backend.path=${localDir}`,
  ])
  .it('should publish a module to a local directory', async () => {
    expect(await pathExists(`${localDir}/test-publish/meta.json`)).to.be.true
    expect(await pathExists(`${localDir}/test-publish/1/module.zip`)).to.be.true
    expect(await pathExists(`${localDir}/test-publish/1.2/module.zip`)).to.be.true
    expect(await pathExists(`${localDir}/test-publish/1.2.3/module.zip`)).to.be.true
  })
})

async function keyExists(client: S3Client, bucket: string, key: string): Promise<boolean> {
  const listCommand = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: key,
    MaxKeys: 1,
  })
  const listResponse: ListObjectsV2CommandOutput = await client.send(listCommand)

  return listResponse.KeyCount === 1
}
