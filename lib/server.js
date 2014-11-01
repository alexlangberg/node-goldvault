'use strict';

var s1 = pack.server(8080, 'localhost');

s1.route({
  path: '/users',
  method: 'GET',
  handler: function (request, reply) {
    reply({
      api: 'http://www.npmjs.org/something',
      version: '0.0.1',
      documentation: '/docs'
    });
  }
});