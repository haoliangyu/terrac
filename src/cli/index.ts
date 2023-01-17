#!/usr/bin/env node

import { readFileSync } from 'fs'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { findUpSync } from 'find-up';
import { parse } from 'yaml'

const configPath = findUpSync(['.tsharerc', '.tsharerc.yaml', '.tsharerc.yml'])
const config = configPath ? parse(readFileSync(configPath, 'utf-8')) : {}

yargs(hideBin(process.argv))
  .commandDir('commands')
  .demandCommand()
  .help()
  .config(config)
  .parse()