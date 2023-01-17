// function builder(yargs: any) {
//   yargs
//     .positional('name', {
//       description: 'Module name',
//       type: 'string'
//     })
//     .positional('version', {
//       description: 'Module version. This can be a semver or any custom version string.',
//       type: 'string'
//     })
//     .option('access', {
//       description: 'Tells the registry whether this package should be published as public or restricted.',
//       type: 'string',
//       choices: ['public', 'restricted'],
//       default: 'restricted'
//     })
//     .option('dry-run', {
//       description: 'Dry-run the publication without actually pushing code to the remote storage.',
//       type: 'boolean',
//       default: false
//     })
// }

// async function handler(argv) {
//   const name = argv.name
//   const type = argv.type
//   const cwd = process.cwd()

//   return addPlugin(cwd, type, name, argv)
// }

// const command = {
//   command: 'publish [name] [version]',
//   description: 'Publish the terraform module from the current directory to the remote storage.',
//   builder,
//   handler
// }