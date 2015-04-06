'use strict';

exports.register = function (server, options, next) {
  server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      //console.log(server);
      var uri = server.connections[0].info.uri;
      var docsFolder = server.settings.app.config.product.docsFolder || '/docs';
      var name = server.settings.app.config.product.name || 'goldvault';
      var info = server.settings.app.config.product.info;
      var response = {
        name: name,
        docs: uri + docsFolder
      };

      if (info) {
        response.info = info;
      }

      reply(response);
    }
  });

  next();
};

exports.register.attributes = {
  name: 'Index page for goldvault.',
  version: '1.0.0'
};