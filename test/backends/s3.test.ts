import {expect, test} from '@oclif/test'
import {S3Client} from '@aws-sdk/client-s3'
import {outputFile} from 'fs-extra'
import {tmpdir} from 'node:os'

import {keyExists, putObject, getObject, purge} from '../helpers/s3'
import {BackendS3} from '../../src/backends/s3'
import {IModuleMeta} from '../../src/types/module'

const s3 = new S3Client({
  endpoint: process.env.TERRAC_BACKEND_S3_ENDPOINT,
  region: 'us-east-1',
})

const bucket = process.env.TEST_BUCKET as string

describe('backends/s3', () => {
  describe('publish', () => {
    test
    .it('should publish a new module', async () => {
      const backend = new BackendS3({
        type: 's3',
        bucket,
        region: 'us-east-1',
      })

      const packagePath = `${tmpdir()}/terrac-publish-package-${Date.now()}.zip`
      const moduleName = 'test-publish'
      await outputFile(packagePath, 'test')

      await backend.publish(moduleName, '1.2.3', packagePath)

      expect(await keyExists(s3, bucket, `${moduleName}/meta.json`)).to.be.true
      expect(await keyExists(s3, bucket, `${moduleName}/1.2.3/module.zip`)).to.be.true
    })

    test
    .it('should publish a new version for an existing module', async () => {
      const moduleName = 'test-publish-2'
      const meta: IModuleMeta = {
        name: moduleName,
        version: '1.2.3',
        created: Date.now(),
        updated: Date.now(),
        releases: [
          {
            version: '1.2.3',
            updated: Date.now(),
          },
        ],
      }

      await putObject(s3, bucket, `${moduleName}/meta.json`, meta)
      await putObject(s3, bucket, `${moduleName}/1.2.3/module.zip`, 'test')

      const backend = new BackendS3({
        type: 's3',
        bucket,
        region: 'us-east-1',
      })

      const packagePath = `${tmpdir()}/terrac-publish-package-${Date.now()}.zip`
      await outputFile(packagePath, 'test')

      expect(await keyExists(s3, bucket, `${moduleName}/1.2.4/module.zip`)).to.be.false

      await backend.publish(moduleName, '1.2.4', packagePath)

      expect(await keyExists(s3, bucket, `${moduleName}/1.2.4/module.zip`)).to.be.true

      const updated = await getObject(s3, bucket, `${moduleName}/meta.json`)
      expect(updated.version).to.equal('1.2.4')
      expect(updated.releases.length).to.equal(2)
      expect(updated.releases[0].version).to.equal('1.2.3')
      expect(updated.releases[1].version).to.equal('1.2.4')
    })
  })

  describe('getSource', () => {
    test
    .it('should get the source of the latest version by default', async () => {
      const meta: IModuleMeta = {
        name: 'test-get-source-url',
        version: '1.2.4',
        created: Date.now(),
        updated: Date.now(),
        releases: [
          {
            version: '1.2.4',
            updated: Date.now(),
          },
          {
            version: '1.2.3',
            updated: Date.now(),
          },
        ],
      }

      await putObject(s3, bucket, 'test-get-source-url/meta.json', meta)
      await putObject(s3, bucket, 'test-get-source-url/1.2.3/module.zip', 'test')
      await putObject(s3, bucket, 'test-get-source-url/1.2.4/module.zip', 'test')

      const backend = new BackendS3({
        type: 's3',
        bucket,
        region: 'us-east-1',
      })

      const source = await backend.getSource('test-get-source-url')
      expect(source.version).to.equal('1.2.4')
      expect(source.value).to.equal(`s3::https://s3-us-east-1.amazonaws.com/${bucket}/test-get-source-url/1.2.4/module.zip`)
    })

    test
    .it('should get the source of a specific version', async () => {
      const name = 'test-get-source-url-specific'
      const meta: IModuleMeta = {
        name,
        version: '1.2.4',
        created: Date.now(),
        updated: Date.now(),
        releases: [
          {
            version: '1.2.4',
            updated: Date.now(),
          },
          {
            version: '1.2.3',
            updated: Date.now(),
          },
        ],
      }

      await putObject(s3, bucket, `${name}/meta.json`, meta)
      await putObject(s3, bucket, `${name}/1.2.3/module.zip`, 'test')
      await putObject(s3, bucket, `${name}/1.2.4/module.zip`, 'test')

      const backend = new BackendS3({
        type: 's3',
        bucket,
        region: 'us-east-1',
      })

      const source = await backend.getSource(name, '1.2.3')
      expect(source.version).to.equal('1.2.3')
      expect(source.value).to.equal(`s3::https://s3-us-east-1.amazonaws.com/${bucket}/${name}/1.2.3/module.zip`)
    })
  })

  describe('list', () => {
    test
    .it('should list all modules by default', async () => {
      await purge(s3, bucket)

      const namePrefix = 'test-list-modules'
      await putObject(s3, bucket, `${namePrefix}-1/1.2.3/module.zip`, 'test')
      await putObject(s3, bucket, `${namePrefix}-2/1.2.4/module.zip`, 'test')

      const backend = new BackendS3({
        type: 's3',
        bucket,
        region: 'us-east-1',
      })

      const results = await backend.list()
      const modules = results.map(result => result.name)
      expect(modules.sort()).to.deep.equal([`${namePrefix}-1`, `${namePrefix}-2`])
    })

    test
    .it('should list all versions with a given module name', async () => {
      await purge(s3, bucket)

      const namePrefix = 'test-list-module-versions'

      await putObject(s3, bucket, `${namePrefix}-1/meta.json`, {
        name: `${namePrefix}-1`,
        version: '1.2.4',
        created: Date.now(),
        updated: Date.now(),
        releases: [
          {
            version: '1.2.4',
            updated: Date.now(),
          },
          {
            version: '1.2.3',
            updated: Date.now(),
          },
        ],
      })
      await putObject(s3, bucket, `${namePrefix}-1/1.2.3/module.zip`, 'test')
      await putObject(s3, bucket, `${namePrefix}-1/1.2.4/module.zip`, 'test')

      await putObject(s3, bucket, `${namePrefix}-12meta.json`, {
        name: `${namePrefix}-2`,
        version: '1.2.5',
        created: Date.now(),
        updated: Date.now(),
        releases: [
          {
            version: '1.2.5',
            updated: Date.now(),
          },
        ],
      })
      await putObject(s3, bucket, `${namePrefix}-2/1.2.5/module.zip`, 'test')

      const backend = new BackendS3({
        type: 's3',
        bucket,
        region: 'us-east-1',
      })

      const results = await backend.list(`${namePrefix}-1`)

      const modules = results.map(result => result.name)
      expect(modules.sort()).to.deep.equal([`${namePrefix}-1`, `${namePrefix}-1`])

      const versions = results.map(result => result.version)
      expect(versions.sort()).to.deep.equal(['1.2.3', '1.2.4'])
    })
  })

  describe('exists', () => {
    test
    .it('should return true if the module is found', async () => {
      const moduleName = 'test-exists-1'
      const meta: IModuleMeta = {
        name: moduleName,
        version: '1.2.4',
        created: Date.now(),
        updated: Date.now(),
        releases: [
          {
            version: '1.2.4',
            updated: Date.now(),
          },
        ],
      }

      await putObject(s3, bucket, `${moduleName}/meta.json`, meta)
      await putObject(s3, bucket, `${moduleName}/1.2.4/module.zip`, 'test')

      const backend = new BackendS3({
        type: 's3',
        bucket,
        region: 'us-east-1',
      })

      expect(await backend.exists(moduleName)).to.equal(true)
    })

    test
    .it('should return true if the module version is found', async () => {
      const moduleName = 'test-exists-2'
      const meta: IModuleMeta = {
        name: moduleName,
        version: '1.2.4',
        created: Date.now(),
        updated: Date.now(),
        releases: [
          {
            version: '1.2.4',
            updated: Date.now(),
          },
        ],
      }

      await putObject(s3, bucket, `${moduleName}/meta.json`, meta)
      await putObject(s3, bucket, `${moduleName}/1.2.4/module.zip`, 'test')

      const backend = new BackendS3({
        type: 's3',
        bucket,
        region: 'us-east-1',
      })

      expect(await backend.exists(moduleName, '1.2.4')).to.equal(true)
    })

    test
    .it('should return false if the module is not found', async () => {
      const backend = new BackendS3({
        type: 's3',
        bucket,
        region: 'us-east-1',
      })

      expect(await backend.exists('not-found')).to.equal(false)
    })

    test
    .it('should return true if the module version is found', async () => {
      const moduleName = 'test-exists-4'
      const meta: IModuleMeta = {
        name: moduleName,
        version: '1.2.4',
        created: Date.now(),
        updated: Date.now(),
        releases: [
          {
            version: '1.2.4',
            updated: Date.now(),
          },
        ],
      }

      await putObject(s3, bucket, `${moduleName}/meta.json`, meta)
      await putObject(s3, bucket, `${moduleName}/1.2.4/module.zip`, 'test')

      const backend = new BackendS3({
        type: 's3',
        bucket,
        region: 'us-east-1',
      })

      expect(await backend.exists(moduleName, '1.2.5')).to.equal(false)
    })
  })
})
