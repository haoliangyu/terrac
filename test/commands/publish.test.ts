import {expect, test} from '@oclif/test'
import {tmpdir} from 'node:os'
import {pathExists, ensureDir} from 'fs-extra'

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
