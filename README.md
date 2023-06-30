oclif-hello-world
=================

oclif example Hello World CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![CircleCI](https://circleci.com/gh/oclif/hello-world/tree/main.svg?style=shield)](https://circleci.com/gh/oclif/hello-world/tree/main)
[![Downloads/week](https://img.shields.io/npm/dw/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![License](https://img.shields.io/npm/l/oclif-hello-world.svg)](https://github.com/oclif/hello-world/blob/main/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g terrac
$ terrac COMMAND
running command...
$ terrac (--version)
terrac/0.0.0 darwin-x64 node-v16.19.0
$ terrac --help [COMMAND]
USAGE
  $ terrac COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`terrac hello PERSON`](#terrac-hello-person)
* [`terrac hello world`](#terrac-hello-world)
* [`terrac help [COMMANDS]`](#terrac-help-commands)
* [`terrac plugins`](#terrac-plugins)
* [`terrac plugins:install PLUGIN...`](#terrac-pluginsinstall-plugin)
* [`terrac plugins:inspect PLUGIN...`](#terrac-pluginsinspect-plugin)
* [`terrac plugins:install PLUGIN...`](#terrac-pluginsinstall-plugin-1)
* [`terrac plugins:link PLUGIN`](#terrac-pluginslink-plugin)
* [`terrac plugins:uninstall PLUGIN...`](#terrac-pluginsuninstall-plugin)
* [`terrac plugins:uninstall PLUGIN...`](#terrac-pluginsuninstall-plugin-1)
* [`terrac plugins:uninstall PLUGIN...`](#terrac-pluginsuninstall-plugin-2)
* [`terrac plugins update`](#terrac-plugins-update)

## `terrac hello PERSON`

Say hello

```
USAGE
  $ terrac hello [PERSON] -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ oex hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [dist/commands/hello/index.ts](https://github.com/haoliangyu/terrac/blob/v0.0.0/dist/commands/hello/index.ts)_

## `terrac hello world`

Say hello world

```
USAGE
  $ terrac hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ terrac hello world
  hello world! (./src/commands/hello/world.ts)
```

## `terrac help [COMMANDS]`

Display help for terrac.

```
USAGE
  $ terrac help [COMMANDS] [-n]

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for terrac.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.2.0/src/commands/help.ts)_

## `terrac plugins`

List installed plugins.

```
USAGE
  $ terrac plugins [--core]

FLAGS
  --core  Show core plugins.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ terrac plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.2.2/src/commands/plugins/index.ts)_

## `terrac plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ terrac plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ terrac plugins add

EXAMPLES
  $ terrac plugins:install myplugin 

  $ terrac plugins:install https://github.com/someuser/someplugin

  $ terrac plugins:install someuser/someplugin
```

## `terrac plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ terrac plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ terrac plugins:inspect myplugin
```

## `terrac plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ terrac plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ terrac plugins add

EXAMPLES
  $ terrac plugins:install myplugin 

  $ terrac plugins:install https://github.com/someuser/someplugin

  $ terrac plugins:install someuser/someplugin
```

## `terrac plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ terrac plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ terrac plugins:link myplugin
```

## `terrac plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ terrac plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ terrac plugins unlink
  $ terrac plugins remove
```

## `terrac plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ terrac plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ terrac plugins unlink
  $ terrac plugins remove
```

## `terrac plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ terrac plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ terrac plugins unlink
  $ terrac plugins remove
```

## `terrac plugins update`

Update installed plugins.

```
USAGE
  $ terrac plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```
<!-- commandsstop -->
