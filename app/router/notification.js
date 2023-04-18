'use strict';

module.exports = (app, jwt) => {
  app.router.post('/notification/api/page', 'notification.notificationList');
  app.router.post('/notification/api/add', jwt, 'notification.addNotification');
  app.router.delete('/notification/api/delete', jwt, 'notification.deleteNotification');
  app.router.put('/notification/api/update', jwt, 'notification.updateNotification');
  app.router.get('/notification/api/info', 'notification.notificationInfo');
};
