import {expect, test} from '@oclif/test'
import {tmpdir} from 'node:os'
import {pathExists, ensureDir, outputFile, outputJson, readJson} from 'fs-extra'

import {IModuleMeta} from '../../src/types/module'

const localDir = `${tmpdir()}/terrac-publish-test-${Date.now()}`

describe('commands/publish', () => {
  test
  .do(async () => {
    await ensureDir(localDir)
  })
  .stdout()
  .command([
    'publish',
    '--work-directory',
    'test/fixtures/basic-module-local',
    '--overwrite-config',
    'module.name=test-publish',
    '--overwrite-config',
    `backend.path=${localDir}`,
  ])
  .it('should publish a module with semver to a local directory', async () => {
    expect(await pathExists(`${localDir}/test-publish/meta.json`)).to.be.true
    expect(await pathExists(`${localDir}/test-publish/1/module.zip`)).to.be.true
    expect(await pathExists(`${localDir}/test-publish/1.2/module.zip`)).to.be.true
    expect(await pathExists(`${localDir}/test-publish/1.2.3/module.zip`)).to.be.true
    expect(await pathExists(`${localDir}/test-publish/latest/module.zip`)).to.be.true

    const meta = await readJson(`${localDir}/test-publish/meta.json`)
    expect(meta.version).to.equal('1.2.3')
    expect(meta.releases.length).to.equal(1)

    const release = meta.releases[0]
    expect(release.version).to.equal('1.2.3')
  })

  test
  .do(async () => {
    await ensureDir(localDir)
  })
  .stdout()
  .command([
    'publish',
    '--work-directory',
    'test/fixtures/basic-module-local',
    '--overwrite-config',
    'module.name=test-publish-3',
    '--overwrite-config',
    'module.version=beta',
    '--overwrite-config',
    `backend.path=${localDir}`,
  ])
  .it('should publish a module with non-semver to a local directory', async () => {
    expect(await pathExists(`${localDir}/test-publish-3/meta.json`)).to.be.true
    expect(await pathExists(`${localDir}/test-publish-3/beta/module.zip`)).to.be.true
    expect(await pathExists(`${localDir}/test-publish-3/latest/module.zip`)).to.be.true
  })

  test
  .do(async () => {
    await ensureDir(localDir)

    const meta: IModuleMeta = {
      name: 'test-publish-2',
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

    await outputJson(`${localDir}/test-publish-2/meta.json`, meta)
    await outputFile(`${localDir}/test-publish-2/1.2.3/module.zip`, 'test')
  })
  .stderr()
  .command([
    'publish',
    '--work-directory',
    'test/fixtures/basic-module-local',
    '--overwrite-config',
    'module.name=test-publish-2',
    '--overwrite-config',
    `backend.path=${localDir}`,
  ])
  .catch('The version "1.2.3" for the module "test-publish-2" already exists.')
  .it('should throw an error if the version already exists')

  test
  .do(async () => {
    await ensureDir(localDir)

    const meta: IModuleMeta = {
      name: 'test-publish-3',
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

    await outputJson(`${localDir}/test-publish-3/meta.json`, meta)
    await outputFile(`${localDir}/test-publish-3/1.2.3/module.zip`, 'test')
  })
  .stderr()
  .command([
    'publish',
    '--overwrite',
    '--work-directory',
    'test/fixtures/basic-module-local',
    '--overwrite-config',
    'module.name=test-publish-3',
    '--overwrite-config',
    `backend.path=${localDir}`,
  ])
  .it('should not throw an error if the version already exists but the overwrite option is set', (ctx: any) => {
    expect(ctx.stderr).to.not.include('ModuleAlreadyExists')
  })

  test
  .stderr()
  .command([
    'publish',
    '--work-directory',
    'test/fixtures/invalid-module-config',
  ])
  .catch('Terrac configuration is invalid. "module.name" is required')
  .it('should throw an error if the terrac configuration is invalid')
})
