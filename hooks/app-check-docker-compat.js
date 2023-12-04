'use strict';

const _ = require('lodash');

module.exports = async (app, lando) => {
  _.forEach(_(lando.versions).filter(version => version && version.dockerVersion).value(), thing => {
    if (!thing.satisfied) app.addMessage(require('../messages/unsupported-version-info')(thing));
  });
};
