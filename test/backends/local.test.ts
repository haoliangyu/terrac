import {expect, test} from '@oclif/test'
import {ensureDir, outputFile, outputJson, pathExists} from 'fs-extra'
import {tmpdir} from 'node:os'

import {BackendLocal} from '../../src/backends/local'
import {IModuleMeta} from '../../src/types/module'

const localDirPrefix = `${tmpdir()}/terrac-test`

describe('backends/local', () => {
  describe('upload', () => {
    test
    .it('should upload a new module to a local directory', async () => {
      const localDirPath = `${localDirPrefix}-${Date.now()}`
      await ensureDir(localDirPath)

      const backend = new BackendLocal({
        type: 'local',
        path: localDirPath,
      })

      const packagePath = `${tmpdir()}/terrac-publish-package-${Date.now()}.zip`
      await outputFile(packagePath, 'test')

      await backend.upload('test-publish', '1.2.3', packagePath)

      expect(await pathExists(`${localDirPath}/test-publish/1.2.3/module.zip`)).to.be.true
    })
  })

  describe('getSourceUrl', () => {
    test
    .it('should get the source of the latest version by default', async () => {
      const localDirPath = `${localDirPrefix}-${Date.now()}`
      const meta: IModuleMeta = {
        name: 'test-module',
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

      await outputJson(`${localDirPath}/test-module/meta.json`, meta)
      await outputFile(`${localDirPath}/test-module/1.2.3/module.zip`, 'test')
      await outputFile(`${localDirPath}/test-module/1.2.4/module.zip`, 'test')

      const backend = new BackendLocal({
        type: 'local',
        path: localDirPath,
      })

      const url = await backend.getSourceUrl('test-module')
      expect(url).to.equal(`${localDirPath}/test-module/1.2.4/module.zip`)
    })

    test
    .it('should get the dource of a specific version', async () => {
      const localDirPath = `${localDirPrefix}-${Date.now()}`
      const meta: IModuleMeta = {
        name: 'test-module',
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

      await outputJson(`${localDirPath}/test-module/meta.json`, meta)
      await outputFile(`${localDirPath}/test-module/1.2.3/module.zip`, 'test')
      await outputFile(`${localDirPath}/test-module/1.2.4/module.zip`, 'test')

      const backend = new BackendLocal({
        type: 'local',
        path: localDirPath,
      })

      const url = await backend.getSourceUrl('test-module', '1.2.3')
      expect(url).to.equal(`${localDirPath}/test-module/1.2.3/module.zip`)
    })
  })

  describe('list', () => {
    test
    .it('should list all modules by default', async () => {
      const localDirPath = `${localDirPrefix}-${Date.now()}`
      await outputFile(`${localDirPath}/test-module-1/1.2.3/module.zip`, 'test')
      await outputFile(`${localDirPath}/test-module-2/1.2.4/module.zip`, 'test')

      const backend = new BackendLocal({
        type: 'local',
        path: localDirPath,
      })

      const results = await backend.list()
      const modules = results.map(result => result.name)
      expect(modules.sort()).to.deep.equal(['test-module-1', 'test-module-2'])
    })

    test
    .it('should list all versions with a given module name', async () => {
      const localDirPath = `${localDirPrefix}-${Date.now()}`
      await outputFile(`${localDirPath}/test-module-1/1.2.3/module.zip`, 'test')
      await outputFile(`${localDirPath}/test-module-1/1.2.4/module.zip`, 'test')
      await outputFile(`${localDirPath}/test-module-2/1.2.5/module.zip`, 'test')

      const backend = new BackendLocal({
        type: 'local',
        path: localDirPath,
      })

      const results = await backend.list('test-module-1')

      const modules = results.map(result => result.name)
      expect(modules.sort()).to.deep.equal(['test-module-1', 'test-module-1'])

      const versions = results.map(result => result.version)
      expect(versions.sort()).to.deep.equal(['1.2.3', '1.2.4'])
    })
  })

  describe('exists', () => {
    test
    .it('should return true if the module is found', async () => {
      const localDirPath = `${localDirPrefix}-${Date.now()}`
      const meta: IModuleMeta = {
        name: 'test-module',
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

      await outputJson(`${localDirPath}/test-module/meta.json`, meta)
      await outputFile(`${localDirPath}/test-module/1.2.3/module.zip`, 'test')

      const backend = new BackendLocal({
        type: 'local',
        path: localDirPath,
      })

      expect(await backend.exists('test-module')).to.equal(true)
    })

    test
    .it('should return true if the module version is found', async () => {
      const localDirPath = `${localDirPrefix}-${Date.now()}`
      const meta: IModuleMeta = {
        name: 'test-module',
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

      await outputJson(`${localDirPath}/test-module/meta.json`, meta)
      await outputFile(`${localDirPath}/test-module/1.2.3/module.zip`, 'test')

      const backend = new BackendLocal({
        type: 'local',
        path: localDirPath,
      })

      expect(await backend.exists('test-module', '1.2.3')).to.equal(true)
    })

    test
    .it('should return false if the module is not found', async () => {
      const localDirPath = `${localDirPrefix}-${Date.now()}`
      const backend = new BackendLocal({
        type: 'local',
        path: localDirPath,
      })

      expect(await backend.exists('test-module')).to.equal(false)
    })

    test
    .it('should return true if the module version is found', async () => {
      const localDirPath = `${localDirPrefix}-${Date.now()}`
      const meta: IModuleMeta = {
        name: 'test-module',
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

      await outputJson(`${localDirPath}/test-module/meta.json`, meta)
      await outputFile(`${localDirPath}/test-module/1.2.3/module.zip`, 'test')

      const backend = new BackendLocal({
        type: 'local',
        path: localDirPath,
      })

      expect(await backend.exists('test-module', '1.2.4')).to.equal(false)
    })
  })

  describe('getMeta', () => {
    test
    .it('should get the module metadata', async () => {
      const localDirPath = `${localDirPrefix}-${Date.now()}`
      const meta = {
        name: 'test-module',
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

      await outputJson(`${localDirPath}/test-module/meta.json`, meta)

      const backend = new BackendLocal({
        type: 'local',
        path: localDirPath,
      })

      expect(await backend.getMeta('test-module')).to.deep.equal(meta)
    })
  })

  describe('saveMeta', () => {
    test
    .it('should save modified metadata', async () => {
      const localDirPath = `${localDirPrefix}-${Date.now()}`
      const meta = {
        name: 'test-module',
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

      const backend = new BackendLocal({
        type: 'local',
        path: localDirPath,
      })

      await backend.saveMeta(meta)

      expect(await pathExists(`${localDirPath}/test-module/meta.json`)).to.equal(true)
    })
  })
})
