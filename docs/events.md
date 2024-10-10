---
title: Events
description: Lando events let you run arbitrary commands before or after certain parts of the Lando runtime; clear caches after a database import or run a script before deployment.
---

# Events

::: tip When should I use events instead of a build step?
Unlike [build steps](./services.md#build-steps) `events` will run **every time** so it is advisable to use them for automating common steps like compiling `sass` before or after your app starts and not installing lower level dependencies like `node modules` or `php extensions`.
:::

Events allow you to automate commands or tasks you might often or always run either `before` or `after` something happens. Generally, you can hook into `pre` and `post` events for every part of the [Lando](https://docs.lando.dev/api/lando.html) and [App](https://docs.lando.dev/api/app.html) runtime. At time of writing, those events were as follows:

| **LANDO** | **APP** |
| -- | -- |
| [pre-bootstrap-config](https://docs.lando.dev/api/lando.html#event_pre_bootstrap_config) | [pre-destroy](https://docs.lando.dev/api/app.html#pre-destroy) |
| [pre-bootstrap-tasks](https://docs.lando.dev/api/lando.html#event_pre_bootstrap_tasks) | [ post-destroy](https://docs.lando.dev/api/app.html#post-destroy) |
| [pre-bootstrap-engine](https://docs.lando.dev/api/lando.html#event_pre_bootstrap_engine) | [pre-init](https://docs.lando.dev/api/app.html#pre-init) |
| [pre-bootstrap-app](https://docs.lando.dev/api/lando.html#event_pre_bootstrap_app) | [post-init](https://docs.lando.dev/api/app.html#post-init) |
| [post-bootstrap-config](https://docs.lando.dev/api/lando.html#event_post_bootstrap_config) | [pre-rebuild](https://docs.lando.dev/api/app.html#pre-rebuild) |
| [post-bootstrap-tasks](https://docs.lando.dev/api/lando.html#event_post_bootstrap_tasks) | [post-rebuild](https://docs.lando.dev/api/app.html#post-rebuild) |
| [post-bootstrap-engine](https://docs.lando.dev/api/lando.html#event_post_bootstrap_engine) | [pre-start](https://docs.lando.dev/api/app.html#pre-start) |
| [post-bootstrap-app](https://docs.lando.dev/api/lando.html#event_post_bootstrap_app) | [post-start](https://docs.lando.dev/api/app.html#post-start) |
| [pre-engine-build](https://docs.lando.dev/api/engine.html#event_pre_engine_build) | [pre-stop](https://docs.lando.dev/api/app.html#pre-stop) |
| [post-engine-build](https://docs.lando.dev/api/engine.html#event_post_engine_build) | [post-stop](https://docs.lando.dev/api/app.html#pre-stop) |
| [pre-engine-destroy](https://docs.lando.dev/api/engine.html#event_pre_engine_destroy) | [pre-uninstall](https://docs.lando.dev/api/app.html#pre-uninstall) |
| [post-engine-destroy](https://docs.lando.dev/api/engine.html#event_post_engine_destroy) | [post-uninstall](https://docs.lando.dev/api/app.html#post-uninstall) |
| [pre-engine-run](https://docs.lando.dev/api/engine.html#event_pre_engine_run) | [ready](https://docs.lando.dev/api/app.html#ready) |
| [post-engine-run](https://docs.lando.dev/api/engine.html#event_post_engine_run) | []() |
| [pre-engine-start](https://docs.lando.dev/api/engine.html#event_pre_engine_start) | []() |
| [post-engine-start](https://docs.lando.dev/api/engine.html#event_post_engine_start) | []() |
| [pre-engine-stop](https://docs.lando.dev/api/engine.html#event_pre_engine_stop) | []() |
| [post-engine-stop](https://docs.lando.dev/api/engine.html#event_post_engine_stop) | []() |

You can also hook into `pre` and `post` events for all [tooling](./tooling.md) commands. For example, the command `lando db-import` should expose `pre-db-import` and `post-db-import`.

## Discovering Events

While the above lists are great starting point, they may be out of date. You can explicitly discover what events are available by running as shown below:

```bash
# Discover hookable events for the `lando start` command
lando start -vvv | grep "Emitting"

# Discover hookable events for the `lando test` command
# NOTE: This assumed you've defined a `test` command in tooling
lando test -vvv | grep "Emitting"
```

Specifically, you need to hook into an event where the service you are running the command against exists and is running.

## Usage

It's fairly straightforward to add events to your [Landofile](./index.md) using the `events` top level config.

Note that due to the nature of events (e.g. automating steps that the _user_ usually runs), all commands are run as "you" and do not have `sudo` or `root` access.

### Default commands

By default, event commands will run on the `appserver` service which **may not exist** if you are not using one of Lando's [recipes](./recipes.md) as a starting point for your Landofile.

```yaml
events:
  pre-start:
    - yarn install
    - echo "I JUST YARNED"
```

An exception for this is events that are based on [tooling](./tooling.md) commands which will use the tooling `service` as the default.

```yaml
events:
  post-thing:
    - some-command
tooling:
  thing:
    service: web
```

In the above scenario, `some-command` will run on the `web` service by default instead of the `appserver`. For [dynamic tooling routes](./tooling.md#dynamic-service-commands), events will use the default of the dynamic route.

```yaml
events:
  post-dynamic:
    - some-command
tooling:
  dynamic:
    cmd: env
    service: :host
    options:
      host:
        default: web2
        alias:
          - h
        describe: Run a different service
```

In the above scenario, `some-command` will run on `web2` by default.

### Service commands

While the defaults above are good to know, we *highly recommend* you just explicitly define which commands should run on which services by keying the command with a service as shown below:

```yaml
events:
  pre-start:
    - appserver: composer install
    - database: echo "I JUST COMPOSERED"
  post-start:
    - node: yarn sass
    - appserver: composer compile-templates
```

