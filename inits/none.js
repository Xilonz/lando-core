'use strict';

const {nanoid} = require('nanoid');

/*
 * Init Lamp
 */
module.exports = {
  name: 'none',
  overrides: {
    name: {
      when: answers => {
        answers.name = nanoid();
        return false;
      },
    },
    webroot: {when: () => false},
  },
  build: () => ([
    {name: 'script-load-test', cmd: '/helpers/init-tester.sh'},
  ]),
};
