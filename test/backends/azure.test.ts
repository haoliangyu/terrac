import {expect, test} from '@oclif/test'
import {BlobServiceClient} from '@azure/storage-blob'
import {DefaultAzureCredential} from '@azure/identity'
import {outputFile} from 'fs-extra'
import {tmpdir} from 'node:os'

import {exists, upload, purge} from '../helpers/azure'
import {BackendAzure} from '../../src/backends/azure'
import {IModuleMeta} from '../../src/types/module'

const serviceUrl = process.env.TERRAC_BACKEND_AZURE_SERVICE_URL as string
const client = new BlobServiceClient(serviceUrl, new DefaultAzureCredential())

const container = process.env.TEST_CONTAINER as string
const account = process.env.TEST_ACCOUNT as string

describe('backends/azure', () => {
  describe('upload', () => {
    let backend: BackendAzure

    beforeEach(() => {
      backend = new BackendAzure({
        type: 'azure',
        container,
        account,
      })
    })

    test
    .it('should upload a module', async () => {
      const packagePath = `${tmpdir()}/terrac-publish-package-${Date.now()}.zip`
      const moduleName = 'test-publish'
      await outputFile(packagePath, 'test')

      await backend.upload(moduleName, '1.2.3', packagePath)

      expect(await exists(client, container, `${moduleName}/1.2.3/module.zip`)).to.be.true
    })
  })

  describe('getSourceUrl', () => {
    let backend: BackendAzure

    beforeEach(() => {
      backend = new BackendAzure({
        type: 'azure',
        container,
        account,
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

      await upload(client, container, 'test-get-source-url/meta.json', meta)
      await upload(client, container, 'test-get-source-url/1.2.3/module.zip', 'test')
      await upload(client, container, 'test-get-source-url/1.2.4/module.zip', 'test')

      const url = await backend.getSourceUrl('test-get-source-url')
      expect(url).to.equal(`${serviceUrl}/${container}/test-get-source-url/1.2.4/module.zip`)
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

      await upload(client, container, `${name}/meta.json`, meta)
      await upload(client, container, `${name}/1.2.3/module.zip`, 'test')
      await upload(client, container, `${name}/1.2.4/module.zip`, 'test')

      const url = await backend.getSourceUrl(name, '1.2.3')
      expect(url).to.equal(`${serviceUrl}/${container}/${name}/1.2.3/module.zip`)
    })
  })

  describe('list', () => {
    let backend: BackendAzure

    beforeEach(() => {
      backend = new BackendAzure({
        type: 'azure',
        container,
        account,
      })
    })

    beforeEach(async () => {
      await purge(client, container)
    })

    test
    .it('should list all modules by default', async () => {
      const namePrefix = 'test-list-modules'
      await upload(client, container, `${namePrefix}-1/1.2.3/module.zip`, 'test')
      await upload(client, container, `${namePrefix}-2/1.2.4/module.zip`, 'test')

      const results = await backend.list()
      const modules = results.map(result => result.name)
      expect(modules.sort()).to.deep.equal([`${namePrefix}-1`, `${namePrefix}-2`])
    })

    test
    .it('should list all versions with a given module name', async () => {
      const namePrefix = 'test-list-module-versions'

      await upload(client, container, `${namePrefix}-1/meta.json`, {
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
      await upload(client, container, `${namePrefix}-1/1.2.3/module.zip`, 'test')
      await upload(client, container, `${namePrefix}-1/1.2.4/module.zip`, 'test')

      await upload(client, container, `${namePrefix}-12meta.json`, {
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
      await upload(client, container, `${namePrefix}-2/1.2.5/module.zip`, 'test')

      const results = await backend.list(`${namePrefix}-1`)

      const modules = results.map(result => result.name)
      expect(modules.sort()).to.deep.equal([`${namePrefix}-1`, `${namePrefix}-1`])

      const versions = results.map(result => result.version)
      expect(versions.sort()).to.deep.equal(['1.2.3', '1.2.4'])
    })
  })

  describe('exists', () => {
    let backend: BackendAzure

    beforeEach(() => {
      backend = new BackendAzure({
        type: 'azure',
        container,
        account,
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

      await upload(client, container, `${moduleName}/meta.json`, meta)
      await upload(client, container, `${moduleName}/1.2.4/module.zip`, 'test')

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

      await upload(client, container, `${moduleName}/meta.json`, meta)
      await upload(client, container, `${moduleName}/1.2.4/module.zip`, 'test')

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

      await upload(client, container, `${moduleName}/meta.json`, meta)
      await upload(client, container, `${moduleName}/1.2.4/module.zip`, 'test')

      expect(await backend.exists(moduleName, '1.2.5')).to.equal(false)
    })
  })

  describe('getMeta', () => {
    let backend: BackendAzure

    beforeEach(() => {
      backend = new BackendAzure({
        type: 'azure',
        container,
        account,
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

      await upload(client, container, `${moduleName}/meta.json`, meta)

      expect(await backend.getMeta(moduleName)).to.deep.equal(meta)
    })
  })

  describe('saveMeta', () => {
    let backend: BackendAzure

    beforeEach(() => {
      backend = new BackendAzure({
        type: 'azure',
        container,
        account,
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

      expect(await exists(client, container, `${moduleName}/meta.json`)).to.equal(true)
    })
  })
})
