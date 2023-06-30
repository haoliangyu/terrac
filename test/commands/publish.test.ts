import {expect, test} from '@oclif/test'
import {S3Client} from '@aws-sdk/client-s3'

import {keyExists, getMetaKey, getPackageKey} from '../../src/utils'

const s3 = new S3Client({
  endpoint: 'http://s3.localhost.localstack.cloud:4566',
  region: 'us-east-1',
})

const bucket = process.env.TEST_BUCKET as string

describe('src/commands/publish', () => {
  test
  .stdout()
  .command(['publish', 'test/fixtures/basic-module', '--overwrite-config', 'module.name=test-publish'])
  .it('should publish a module to S3', async () => {
    expect(await keyExists(s3, bucket, getMetaKey('', 'test-publish'))).to.be.true
    expect(await keyExists(s3, bucket, getPackageKey('', 'test-publish', '1.2.3'))).to.be.true
    expect(await keyExists(s3, bucket, getPackageKey('', 'test-publish', '1.2'))).to.be.true
    expect(await keyExists(s3, bucket, getPackageKey('', 'test-publish', '1'))).to.be.true
  })
})
