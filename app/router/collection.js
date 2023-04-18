'use strict';

module.exports = (app, jwt) => {
  app.router.post('/collection/api/page/:type', 'collection.collectionList');
  app.router.put('/collection/api/collect', jwt, 'collection.collect');
};
