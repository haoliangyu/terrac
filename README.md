# terrac

A simple CLI tool to quickly setup a minimal private terraform module registry with your cloud storage service.

[![Version](https://img.shields.io/npm/v/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![License](https://img.shields.io/npm/l/oclif-hello-world.svg)](https://github.com/oclif/hello-world/blob/main/package.json)
[![Main](https://github.com/haoliangyu/terrac/actions/workflows/main.yaml/badge.svg)](https://github.com/haoliangyu/terrac/actions/workflows/main.yaml)

<!-- toc -->

* [Why](#why)
* [Design](#design)
* [Installation](#installation)
* [Configuration](#configuration)
* [Commands](#commands)
* [Backends](#backends)
* [Limitations](#limitations)
* [Roadmap](#roadmap)

<!-- tocstop -->

## Why

<!-- why -->

Sharing terraform module privately is usually necessary when the infrastructure development happens across multiple teams (DevOps vs applications) or multiple repositories (core vs. app infrastructure).

While a module can be downloaded from a git URL, it lacks the support to code versionization and storage management. While other paid solutions (like [Terraform Cloud](https://developer.hashicorp.com/terraform/cloud-docs/registry)) or open-source solutions (like [citizen](https://github.com/outsideris/citizen)) exist as a full-feature registry, they are usually overkill for small teams, in terms of const, features, or maintenance.

The `terrac` CLI provides a thin layer on your choice of cloud storage service, such as [AWS S3](https://aws.amazon.com/s3/) or [GCP Cloud Storage](https://cloud.google.com/storage/), to publish and share private module code.  It provides features:

* Publish and download with [semver](https://semver.org)
* Manage storage schema and metadata automatically
* Fully integrated with your infrastructure
* Completely serverless (no hosting)
* Simple commands (npm-style)
* Free and flexible

It is suitable to use as a private terraform registry in small teams (while limitations apply).

<!-- whystop -->

## Design

<!-- design -->

The desing of `terrac` consists of three components:

* **Configuration**: a JSON file to provide configurations on the module and the cloud storage service
* **Commands**: a set of commands to provide user interface and interaction
* **Backends**: a set of standard abstractions for different cloud storage services. All backends expose the same interface to the commands and encapuslate the details of interaction with the remote API.

```mermaid
graph TD;
    Configuration-->Command:publish;
    Command:publish-->Backend:s3;
    Backend:s3-->S3;
```

<!-- designstop -->

## Installation

<!-- installation -->

### npm

```bash
npm install -g terrac
```

<!-- installationstop -->

## Configuration

<!-- configuration -->

A `terrac.json` file at the module root directory is used to provide configuration for the CLI tool. It contains two objects:

* **backend** to provide the cloud storage configuration
* **module** to provide the module metadata

The JSON configuration can be populated interactively using the `terrac init` command and this is an example:

```json
{
  "backend": {
    "type": "s3",
    "bucket": "team-sharing",
    "region": "us-east-1"
  },
  "module": {
    "name": "custom-rds-module",
    "version": "1.6.3"
  }
}
```

### Backend

See the [Backends](#backends) section for more details.

### Module

The `module` object describes the meta information for the module to publish:

* **name**: module name
* **version**: module version number. This could be a sematic version or a custom string.

<!-- configurationstop -->

## Commands

<!-- commands -->

* [`terrac get`](#terrac-get)
* [`terrac list`](#terrac-list)

## `terrac get`

Get the module source URL of the given module and version.

```sh
USAGE
  $ terrac get NAME [VERSION] [--work-directory <value>] [--overwrite-config <value>]

ARGUMENTS
  NAME     Module name.
  VERSION  Module version. It could be omitted, or a complete/short semver.
           If omitted, it will resolve to the latest version.
           If a complete semver is given, it will resolve to the exact version.

FLAGS
  --overwrite-config=<value>...  Overwrite terrac configuration
  --work-directory=<value>       [default: .] Root directory of the module project

DESCRIPTION
  Get the module source URL of the given module and version.

EXAMPLES
  $ terrac get my-module

  $ terrac get my-module 1.0.3
```

_See code: [src/commands/get.ts](https://github.com/haoliangyu/terrac/blob/master/src/commands/get.ts)_

## `terrac list`

List available modules and versions.

```sh
USAGE
  $ terrac list [NAME] [--work-directory <value>] [--overwrite-config <value>]

ARGUMENTS
  NAME  Module name

FLAGS
  --overwrite-config=<value>...  Overwrite terrac configuration
  --work-directory=<value>       [default: .] Work directory for the module publication

DESCRIPTION
  List available modules and versions.

EXAMPLES
  $ terrac list

  $ terrac list my-module
```

_See code: [src/commands/list.ts](https://github.com/haoliangyu/terrac/blob/master/src/commands/list.ts)_

<!-- commandsstop -->

## Backends

<!-- backends -->

<!-- backendsstop -->

## Limitations

<!-- limitations -->

<!-- limitationsstop -->

## Roadmap

<!-- roadmap -->

* Features
   * [ ] Add `overwrite` option to the `publish` command
   * [ ] Add `init` command to interatively initialize a module project
   * [ ] Add schema check to the terrac configuration file
   * [ ] Add support to any custom version name in the `get` and `publish` commands
   * [ ] Add support to using partial semver in the `get` and `list` commands
   * [ ] Install with brew
   * [ ] Install with bash script

* Backends
   * [ ] GCP Cloud Storage
   * [ ] Azure Blob Storage

* Maintenance
   * [ ] Automate release process

<!-- roadmapstop -->
