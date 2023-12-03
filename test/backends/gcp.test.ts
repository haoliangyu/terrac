import {expect, test} from '@oclif/test'
import {Storage} from '@google-cloud/storage'
import {outputFile} from 'fs-extra'
import {tmpdir} from 'node:os'

import {exists, upload, purge} from '../helpers/gcp'
import {BackendGCP} from '../../src/backends/gcp'
import {IModuleMeta} from '../../src/types/module'

const projectId = process.env.TEST_PROJECT_ID as string
const apiEndpoint = process.env.TERRAC_BACKEND_GCP_API_ENDPOINT
const client = new Storage({
  apiEndpoint,
  projectId,
})

const bucket = process.env.TEST_BUCKET as string

describe('backends/gcp', () => {
  describe('upload', () => {
    let backend: BackendGCP

    beforeEach(() => {
      backend = new BackendGCP({
        type: 'gcp',
        bucket,
        projectId,
      })
    })

    test
    .it('should upload a module', async () => {
      const packagePath = `${tmpdir()}/terrac-publish-package-${Date.now()}.zip`
      const moduleName = 'test-publish'
      await outputFile(packagePath, 'test')

      await backend.upload(moduleName, '1.2.3', packagePath)

      expect(await exists(client, bucket, `${moduleName}/1.2.3/module.zip`)).to.be.true
    })
  })

  describe('getSourceUrl', () => {
    let backend: BackendGCP

    beforeEach(() => {
      backend = new BackendGCP({
        type: 'gcp',
        bucket,
        projectId,
      })
    })

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

      await upload(client, bucket, 'test-get-source-url/meta.json', meta)
      await upload(client, bucket, 'test-get-source-url/1.2.3/module.zip', 'test')
      await upload(client, bucket, 'test-get-source-url/1.2.4/module.zip', 'test')

      const url = await backend.getSourceUrl('test-get-source-url')
      expect(url).to.equal(`gcs::${apiEndpoint}/storage/v1/${bucket}/test-get-source-url/1.2.4/module.zip`)
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

      await upload(client, bucket, `${name}/meta.json`, meta)
      await upload(client, bucket, `${name}/1.2.3/module.zip`, 'test')
      await upload(client, bucket, `${name}/1.2.4/module.zip`, 'test')

      const url = await backend.getSourceUrl(name, '1.2.3')
      expect(url).to.equal(`gcs::${apiEndpoint}/storage/v1/${bucket}/${name}/1.2.3/module.zip`)
    })
  })

  describe('list', () => {
    let backend: BackendGCP

    beforeEach(() => {
      backend = new BackendGCP({
        type: 'gcp',
        bucket,
        projectId,
      })
    })

    beforeEach(async () => {
      await purge(client, bucket)
    })

    test
    .it('should list all modules by default', async () => {
      const namePrefix = 'test-list-modules'
      await upload(client, bucket, `${namePrefix}-1/1.2.3/module.zip`, 'test')
      await upload(client, bucket, `${namePrefix}-2/1.2.4/module.zip`, 'test')

      const results = await backend.list()
      const modules = results.map(result => result.name)
      expect(modules.sort()).to.deep.equal([`${namePrefix}-1`, `${namePrefix}-2`])
    })

    test
    .it('should list all versions with a given module name', async () => {
      const namePrefix = 'test-list-module-versions'

      await upload(client, bucket, `${namePrefix}-1/meta.json`, {
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
      await upload(client, bucket, `${namePrefix}-1/1.2.3/module.zip`, 'test')
      await upload(client, bucket, `${namePrefix}-1/1.2.4/module.zip`, 'test')

      await upload(client, bucket, `${namePrefix}-12meta.json`, {
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
      await upload(client, bucket, `${namePrefix}-2/1.2.5/module.zip`, 'test')

      const results = await backend.list(`${namePrefix}-1`)

      const modules = results.map(result => result.name)
      expect(modules.sort()).to.deep.equal([`${namePrefix}-1`, `${namePrefix}-1`])

      const versions = results.map(result => result.version)
      expect(versions.sort()).to.deep.equal(['1.2.3', '1.2.4'])
    })
  })

  describe('exists', () => {
    let backend: BackendGCP

    beforeEach(() => {
      backend = new BackendGCP({
        type: 'gcp',
        bucket,
        projectId,
      })
    })

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

      await upload(client, bucket, `${moduleName}/meta.json`, meta)
      await upload(client, bucket, `${moduleName}/1.2.4/module.zip`, 'test')

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

      await upload(client, bucket, `${moduleName}/meta.json`, meta)
      await upload(client, bucket, `${moduleName}/1.2.4/module.zip`, 'test')

      expect(await backend.exists(moduleName, '1.2.4')).to.equal(true)
    })

    test
    .it('should return false if the module is not found', async () => {
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

      await upload(client, bucket, `${moduleName}/meta.json`, meta)
      await upload(client, bucket, `${moduleName}/1.2.4/module.zip`, 'test')

      expect(await backend.exists(moduleName, '1.2.5')).to.equal(false)
    })
  })

  describe('getMeta', () => {
    let backend: BackendGCP

    beforeEach(() => {
      backend = new BackendGCP({
        type: 'gcp',
        bucket,
        projectId,
      })
    })

    test
    .it('should get the module metadata', async () => {
      const moduleName = 'test-get-meta-1'
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

      await upload(client, bucket, `${moduleName}/meta.json`, meta)

      expect(await backend.getMeta(moduleName)).to.deep.equal(meta)
    })
  })

  describe('saveMeta', () => {
    let backend: BackendGCP

    beforeEach(() => {
      backend = new BackendGCP({
        type: 'gcp',
        bucket,
        projectId,
      })
    })

    test
    .it('should save modified metadata', async () => {
      const moduleName = 'test-save-meta-1'
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

      await backend.saveMeta(meta)

      expect(await exists(client, bucket, `${moduleName}/meta.json`)).to.equal(true)
    })
  })
})
