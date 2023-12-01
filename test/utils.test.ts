import {expect, test} from '@oclif/test'

import {IModuleMeta} from '../src/types/module'
import {expandSemver, resolveVersion} from '../src/utils'

describe('expandSemver', () => {
  test
  .it('should convert semver into a list of versions', () => {
    const result = expandSemver('1.2.3')
    expect(result).to.deep.equal(['1', '1.2', '1.2.3'])
  })

  test
  .it('should throw an error if the input is not a semver', () => {
    expect(() => expandSemver('beta')).to.throws
  })
})

describe('resolveVersion', () => {
  const meta: IModuleMeta = {
    name: 'test',
    version: '1.2.3',
    updated: 3,
    created: 1,
    releases: [
      {
        version: '1.2.2',
        updated: 1,
      },
      {
        version: '1.2.3',
        updated: 3,
      },
      {
        version: 'beta',
        updated: 2,
      },
    ],
  }

  test
  .it('should return the exact version if the input is not semver', () => {
    expect(resolveVersion(meta, 'beta')).to.equal('beta')
  })

  test
  .it('should return the most recent version if the input is "latest"', () => {
    expect(resolveVersion(meta, 'latest')).to.equal('1.2.3')
  })

  test
  .it('should return the closest version if the input is a semver', () => {
    expect(resolveVersion(meta, '1')).to.equal('1.2.3')
    expect(resolveVersion(meta, '1.2')).to.equal('1.2.3')
    expect(resolveVersion(meta, '1.2.2')).to.equal('1.2.2')
  })

  test
  .it('should throw an error if the semver version is out-of-bound', () => {
    expect(() => resolveVersion(meta, '0')).to.throws
    expect(() => resolveVersion(meta, '2')).to.throws
    expect(() => resolveVersion(meta, '1.1')).to.throws
    expect(() => resolveVersion(meta, '1.3')).to.throws
    expect(() => resolveVersion(meta, '1.2.1')).to.throws
    expect(() => resolveVersion(meta, '1.2.4')).to.throws
  })

  test
  .it('should throw an error if the non-semver version is not found', () => {
    expect(() => resolveVersion(meta, 'alpha')).to.throws
  })
})
