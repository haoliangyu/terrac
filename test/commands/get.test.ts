import {expect, test} from '@oclif/test'
import {tmpdir} from 'node:os'
import {outputJson, outputFile} from 'fs-extra'

import {IModuleMeta} from '../../src/types/module'

// provision local directory for testing
const localDirPrefix = `${tmpdir()}/terrac-get-url-test-${Date.now()}`

describe('commands/get', () => {
  test
  .stdout()
  .do(async () => {
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

    // provision local directory for testing
    await outputJson(`${localDirPrefix}-1/test-module/meta.json`, meta)
    await outputFile(`${localDirPrefix}-1/test-module/1.2.3/module.zip`, 'test')
  })
  .command([
    'get',
    'test-module',
    '--work-directory',
    'test/fixtures/basic-module-local',
    '--overwrite-config',
    `backend.path=${localDirPrefix}-1`,
  ])
  .it('should get the latest version URL from the local directory', ctx => {
    expect(ctx.stdout).to.contain(`${localDirPrefix}-1/test-module/1.2.3/module.zip`)
  })

  test
  .stdout()
  .do(async () => {
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

    // provision local directory for testing
    await outputJson(`${localDirPrefix}-2/test-module/meta.json`, meta)
    await outputFile(`${localDirPrefix}-2/test-module/1.2.3/module.zip`, 'test')
    await outputFile(`${localDirPrefix}-2/test-module/1.2.4/module.zip`, 'test')
  })
  .command([
    'get',
    'test-module',
    '1.2.3',
    '--work-directory',
    'test/fixtures/basic-module-local',
    '--overwrite-config',
    `backend.path=${localDirPrefix}-2`,
  ])
  .it('should get the specific version URL from the local directory', ctx => {
    expect(ctx.stdout).to.contain(`${localDirPrefix}-2/test-module/1.2.3/module.zip`)
  })

  test
  .stdout()
  .do(async () => {
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

    // provision local directory for testing
    await outputJson(`${localDirPrefix}-3/test-module/meta.json`, meta)
    await outputFile(`${localDirPrefix}-3/test-module/1.2/module.zip`, 'test')
    await outputFile(`${localDirPrefix}-3/test-module/1.2.3/module.zip`, 'test')
    await outputFile(`${localDirPrefix}-3/test-module/1.2.4/module.zip`, 'test')
  })
  .command([
    'get',
    'test-module',
    '1.2',
    '--work-directory',
    'test/fixtures/basic-module-local',
    '--overwrite-config',
    `backend.path=${localDirPrefix}-3`,
  ])
  .it('should return the source URL with the semver component input', ctx => {
    expect(ctx.stdout).to.contain(`${localDirPrefix}-3/test-module/1.2/module.zip`)
  })

  test
  .stdout()
  .do(async () => {
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

    // provision local directory for testing
    await outputJson(`${localDirPrefix}-4/test-module/meta.json`, meta)
    await outputFile(`${localDirPrefix}-4/test-module/1.2/module.zip`, 'test')
    await outputFile(`${localDirPrefix}-4/test-module/1.2.3/module.zip`, 'test')
    await outputFile(`${localDirPrefix}-4/test-module/1.2.4/module.zip`, 'test')
  })
  .command([
    'get',
    'test-module',
    '1.2',
    '--exact',
    '--work-directory',
    'test/fixtures/basic-module-local',
    '--overwrite-config',
    `backend.path=${localDirPrefix}-4`,
  ])
  .it('should resolve to the latest in-range version if the exact flag is given', ctx => {
    expect(ctx.stdout).to.contain(`${localDirPrefix}-4/test-module/1.2.4/module.zip`)
  })

  test
  .stderr()
  .command([
    'get',
    'test-module',
    '1.2.3',
    '--work-directory',
    'test/fixtures/invalid-backend-config',
  ])
  .catch('Terrac configuration is invalid. "backend" does not match any of the allowed types')
  .it('should throw an error if the terrac configuration is invalid')
})
