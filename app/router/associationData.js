'use strict';

module.exports = (app, jwt) => {
  app.router.post('/associationData/api/page', 'associationData.associationDataList');
  app.router.put('/associationData/api/like', jwt, 'associationData.likeAssociationData');
  app.router.get('/associationData/api/info', 'associationData.associationDataInfo');
};
