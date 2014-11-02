'use strict';

exports.register = function (plugin, options, next) {
  plugin.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      var uri = plugin.servers[0].info.uri;
      var docsFolder = plugin.app.config.product.docsFolder || '/docs';
      var response = {
        name: plugin.app.config.product.name,
        docs: uri + docsFolder
      };

      if (plugin.app.config.product.info) {
        response.info = plugin.app.config.product.info;
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