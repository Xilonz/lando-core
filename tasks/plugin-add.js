'use strict';

module.exports = lando => {
  return {
    command: 'plugin-add',
    usage: '$0 plugin-add <plugin> [plugin...] [--auth <auth>...] [--registry <registry>...] [--scope <scope>...]',
    examples: [
      '$0 plugin-add @lando/php@1.2.0',
      '$0 plugin-add @lando/php@file:~/my-php-plugin lando/node#main https://github.com/pirog/plugin.git#v1.2.1',
      '$0 plugin-add @myorg/php --auth "$TOKEN" --registry https://npm.pkg.github.com',
      '$0 plugin-add @org/a @myorg/b --auth "//npm.pkg.github.com/:_authToken=$TOKEN" --scope myorg:registry=https://npm.pkg.github.com', // eslint-disable-line max-len
    ],
    level: 'tasks',
    positionals: {
      plugin: {
        describe: 'Installs these plugins',
        type: 'string',
      },
    },
    options: {
      auth: {
        describe: 'Sets global or scoped auth',
        alias: ['a'],
        array: true,
        default: [],
      },
      registry: {
        describe: 'Sets global or scoped registry',
        alias: ['r', 's', 'scope'],
        array: true,
        default: [],
      },
      force: {
        describe: 'Force install the plugin',
        alias: ['f'],
        type: 'boolean'
      }
    },
    run: async options => {
      const getPluginConfig = require('../utils/get-plugin-config');
      const lopts2Popts = require('../utils/lopts-2-popts');
      const merge = require('../utils/merge');

      const Plugin = require('../components/plugin');

      // normalize incoming options on top of any managed or user plugin config we already have
      options.config = merge({}, [
        getPluginConfig(lando.config.pluginConfigFile, lando.config.pluginConfig),
        lopts2Popts(options),
        { force: !!options.force }
      ]);

      // reset Plugin static defaults for v3 purposes
      Plugin.config = options.config;
      Plugin.debug = require('../utils/debug-shim')(lando.log);

      // merge plugins together
      const plugins = options._.slice(1);
      lando.log.debug('attempting to install plugins %j', plugins);

      // attempt to compute the destination to install the plugin
      // @NOTE: is it possible for this to ever be undefined?
      const {dir} = lando.config.pluginDirs.find(dir => dir.type === require('../utils/get-plugin-type')());
      // prep listr things
      const tasks = plugins.map(plugin => require('../utils/get-plugin-add-task')(plugin, {dir, Plugin}));

      // try to fetch the plugins
      const {errors, results, total} = await lando.runTasks(tasks, {
        renderer: 'lando',
        rendererOptions: {
          level: 0,
        },
      });

      // status
      console.log();
      console.log('added %s of %s plugins with %s errors', results.length, total, errors.length); // eslint-disable-line max-len
      console.log();
      // clear
      lando.cli.clearTaskCaches();

      // if we have errors then lets print them out
      if (errors.length > 0) {
        // print the full errors
        for (const error of errors) lando.log.debug(error);
        throw Error('There was a problem installing some of your plugins. Rerun with -vvv for more details.');
      }
    },
  };
};
