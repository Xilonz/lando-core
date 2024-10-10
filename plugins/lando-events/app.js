'use strict';

// Modules
const _ = require('lodash');
const utils = require('./lib/utils');

/*
 * @TODO
 */
module.exports = (app, lando) => {
  if (!_.isEmpty(_.get(app, 'config.events', []))) {
    _.forEach(app.config.events, (cmds, name) => {
      app.events.on(name, 9999, data => {
        const eventCommands = utils.events2Runz(cmds, app, data);
        // add perm sweeping to all v3 services
        if (!_.isEmpty(eventCommands)) {
          const v3EventCommands = _(eventCommands)
            .filter(command => command.api === 3)
            .map('id')
            .uniq()
            .value();
          lando.log.debug('added preemptive perm sweeping to evented v3 services %j', v3EventCommands);
          _.forEach(v3EventCommands, container => {
            eventCommands.unshift({
              id: container,
              cmd: '/helpers/user-perms.sh --silent',
              compose: app.compose,
              project: app.project,
              opts: {
                mode: 'attach',
                user: 'root',
                services: [container.split('_')[1]],
              },
            });
          });
        }
        const injectable = _.has(app, 'engine') ? app : lando;
        return injectable.engine.run(eventCommands).catch(err => {
          const command = _.tail(name.split('-')).join('-');
          if (app.addWarning) {
            app.addWarning({
              title: `The ${name} event has command(s) that failed!`,
              detail: [
                `Event failed with: "${_.get(err, 'message')}"`,
                'This **MAY** prevent your app from working.',
                'Check for errors above, fix them in your Landofile, and run the command again:',
              ],
              command: `lando ${command}`,
            }, err);
          } else {
            lando.exitCode = 12;
          }
        });
      });
    });
  }
};
