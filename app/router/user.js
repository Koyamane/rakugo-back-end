'use strict';

module.exports = (app, jwt) => {
  app.router.post('/user/api/page', 'user.userList');
  app.router.post('/user/api/login', 'user.login');
  app.router.post('/user/api/register', 'user.register');
  app.router.post('/user/api/info', jwt, 'user.userInfo');
  app.router.get('/user/api/logOut', jwt, 'user.logOut');
  app.router.delete('/user/api/delete', jwt, 'user.deleteUser');
  app.router.put('/user/api/update/access', jwt, 'user.updateSomeoneAccess');
  app.router.put('/user/api/current/update', jwt, 'user.updateCurrent');
  app.router.put('/user/api/current/update/passowrd', jwt, 'user.updateCurrentPassword');
  app.router.put('/user/api/avatar/update', jwt, 'user.changeAvatar');
};
