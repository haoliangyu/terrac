import {expect, test} from '@oclif/test'
import {ensureDir, outputFile, outputJson, pathExists} from 'fs-extra'
import {tmpdir} from 'node:os'

import {BackendLocalDirectory} from '../../src/backends/local-directory'
import {IModuleMeta} from '../../src/types/module'

const localDirPrefix = `${tmpdir()}/terrac-test`

describe('backends/local-directory', () => {
  describe('publish', () => {
    test
    .it('should publish a module to a local directory', async () => {
      const localDirPath = `${localDirPrefix}-${Date.now()}`
      await ensureDir(localDirPath)

      const backend = new BackendLocalDirectory({
        type: 'local-directory',
        path: localDirPath,
      })

      const packagePath = `${tmpdir()}/terrac-publish-package-${Date.now()}.zip`
      await outputFile(packagePath, 'test')

      await backend.publish('test-publish', '1.2.3', packagePath)

      expect(await pathExists(`${localDirPath}/test-publish/meta.json`)).to.be.true
      expect(await pathExists(`${localDirPath}/test-publish/1/module.zip`)).to.be.true
      expect(await pathExists(`${localDirPath}/test-publish/1.2/module.zip`)).to.be.true
      expect(await pathExists(`${localDirPath}/test-publish/1.2.3/module.zip`)).to.be.true
    })
  })

  describe('getSource', () => {
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

      const backend = new BackendLocalDirectory({
        type: 'local-directory',
        path: localDirPath,
      })

      const source = await backend.getSource('test-module')
      expect(source.version).to.equal('1.2.4')
      expect(source.value).to.equal(`${localDirPath}/test-module/1.2.4/module.zip`)
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

      const backend = new BackendLocalDirectory({
        type: 'local-directory',
        path: localDirPath,
      })

      const source = await backend.getSource('test-module', '1.2.3')
      expect(source.version).to.equal('1.2.3')
      expect(source.value).to.equal(`${localDirPath}/test-module/1.2.3/module.zip`)
    })
  })

  describe('list', () => {
    test
    .it('should list all modules by default', async () => {
      const localDirPath = `${localDirPrefix}-${Date.now()}`
      await outputFile(`${localDirPath}/test-module-1/1.2.3/module.zip`, 'test')
      await outputFile(`${localDirPath}/test-module-2/1.2.4/module.zip`, 'test')

      const backend = new BackendLocalDirectory({
        type: 'local-directory',
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

      const backend = new BackendLocalDirectory({
        type: 'local-directory',
        path: localDirPath,
      })

      const results = await backend.list('test-module-1')

      const modules = results.map(result => result.name)
      expect(modules.sort()).to.deep.equal(['test-module-1', 'test-module-1'])

      const versions = results.map(result => result.version)
      expect(versions.sort()).to.deep.equal(['1.2.3', '1.2.4'])
    })
  })
})
