import {expect, test} from '@oclif/test'
import {tmpdir} from 'node:os'
import {outputJson, outputFile} from 'fs-extra'

import {IModuleMeta} from '../../src/types/module'

const localDirPrefix = `${tmpdir()}/terrac-list-test-${Date.now()}`

describe('commands/list', () => {
  test
  .stdout()
  .do(async () => {
    const meta1: IModuleMeta = {
      name: 'test-module-1',
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

    await outputJson(`${localDirPrefix}-1/test-module-1/meta.json`, meta1)
    await outputFile(`${localDirPrefix}-1/test-module-1/1.2.3/module.zip`, 'test')

    const meta2: IModuleMeta = {
      name: 'test-module-2',
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

    await outputJson(`${localDirPrefix}-1/test-module-2/meta.json`, meta2)
    await outputFile(`${localDirPrefix}-1/test-module-2/1.2.4/module.zip`, 'test')
  })
  .command([
    'list',
    '--work-directory',
    'test/fixtures/basic-module-local',
    '--overwrite-config',
    `backend.path=${localDirPrefix}-1`,
  ])
  .it('should return all module names if no name is specified', ctx => {
    expect(ctx.stdout).to.contain('test-module-1')
    expect(ctx.stdout).to.contain('test-module-2')
    expect(ctx.stdout).to.not.contain('1.2.3')
    expect(ctx.stdout).to.not.contain('1.2.4')
  })

  test
  .stdout()
  .do(async () => {
    const meta1: IModuleMeta = {
      name: 'test-module-1',
      version: '1.2.3',
      created: Date.now(),
      updated: Date.now(),
      releases: [
        {
          version: '1.2.2',
          updated: Date.now(),
        },
        {
          version: '1.2.3',
          updated: Date.now(),
        },
      ],
    }

    await outputJson(`${localDirPrefix}-2/test-module-1/meta.json`, meta1)
    await outputFile(`${localDirPrefix}-2/test-module-1/1.2.2/module.zip`, 'test')
    await outputFile(`${localDirPrefix}-2/test-module-1/1.2.3/module.zip`, 'test')

    const meta2: IModuleMeta = {
      name: 'test-module-2',
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

    await outputJson(`${localDirPrefix}-2/test-module-2/meta.json`, meta2)
    await outputFile(`${localDirPrefix}-2/test-module-2/1.2.4/module.zip`, 'test')
  })
  .command([
    'list',
    'test-module-1',
    '--work-directory',
    'test/fixtures/basic-module-local',
    '--overwrite-config',
    `backend.path=${localDirPrefix}-2`,
  ])
  .it('should return all module versions if the name is specified', ctx => {
    expect(ctx.stdout).to.contain('1.2.2')
    expect(ctx.stdout).to.contain('1.2.3')

    expect(ctx.stdout).to.not.contain('test-module-1')
    expect(ctx.stdout).to.not.contain('test-module-2')
    expect(ctx.stdout).to.not.contain('1.2.4')
  })

  test
  .stderr()
  .command([
    'list',
    '--work-directory',
    'test/fixtures/invalid-backend-config',
  ])
  .catch('Terrac configuration is invalid. "backend" does not match any of the allowed types')
  .it('should throw an error if the terrac configuration is invalid')
})
