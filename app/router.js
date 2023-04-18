'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;

  // 这里不传 app，中间件里面就没有
  const jwt = app.middleware.jwt(app.config.jwt, app);
  const jwtAccess = app.middleware.jwt(app.config.jwt, app, true);

  router.get('/', controller.home.index);
  router.get('/home/api/crsf', controller.home.crsfKey);
  require('./router/blog')(app, jwt);
  require('./router/user')(app, jwt);
  require('./router/file')(app, jwt);
  require('./router/notification')(app, jwt);
  require('./router/associationData')(app, jwt);
  require('./router/collection')(app, jwt);
  require('./router/follow')(app, jwt);
  require('./router/comment')(app, jwt);
  require('./router/dataDictionary')(app, jwtAccess);
};
