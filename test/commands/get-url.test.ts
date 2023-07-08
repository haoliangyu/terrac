import {expect, test} from '@oclif/test'
import {tmpdir} from 'node:os'
import {outputJson, outputFile} from 'fs-extra'

import {IModuleMeta} from '../../src/types/module'

// provision local directory for testing
const localDir = `${tmpdir()}/terrac-get-url-test-${Date.now()}`

describe('get-url', () => {
  test
  .stdout()
  .do(async () => {
    const meta: IModuleMeta = {
      name: 'test-get-url',
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
    await outputJson(`${localDir}/test-get-url/meta.json`, meta)
    await outputFile(`${localDir}/test-get-url/1.2.3/module.zip`, 'test')
  })
  .command([
    'get-url',
    'test-module',
    '--work-directory',
    'test/fixtures/basic-module-local-directory',
    '--overwrite-config',
    `backend.path=${localDir}`,
  ])
  .it('should get the latest version URL from the local directory', ctx => {
    expect(ctx.stdout).to.contain(`${localDir}/test-module/1.2.3/module.zip`)
  })
})
