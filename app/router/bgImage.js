'use strict';

module.exports = (app, jwt) => {
  app.router.post('/bgImage/api/page', 'bgImage.bgImageList');
  app.router.post('/bgImage/api/add', jwt, 'bgImage.addBgImage');
  app.router.delete('/bgImage/api/delete', jwt, 'bgImage.deleteBgImage');
  app.router.put('/bgImage/api/update', jwt, 'bgImage.updateBgImage');
  app.router.get('/bgImage/api/info', 'bgImage.bgImageInfo');
};
