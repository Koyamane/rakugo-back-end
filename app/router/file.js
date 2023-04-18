'use strict';

module.exports = (app, jwt) => {
  app.router.post('/file/api/upload', jwt, 'file.uploadFile');
  app.router.post('/file/api/update', jwt, 'file.updateFile');
  app.router.delete('/file/api/delete', jwt, 'file.deleteFile');
  // app.router.get('/file/api/url', 'file.fileUrl');
};
