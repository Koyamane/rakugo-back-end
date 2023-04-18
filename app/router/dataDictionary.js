'use strict';

module.exports = (app, jwt) => {
  app.router.post('/dataDictionary/api/page', 'dataDictionary.page');
  app.router.post('/dataDictionary/api/add', jwt, 'dataDictionary.add');
  app.router.delete('/dataDictionary/api/delete', jwt, 'dataDictionary.delete');
  app.router.put('/dataDictionary/api/update', jwt, 'dataDictionary.update');
  app.router.get('/dataDictionary/api/info', 'dataDictionary.info');
};
