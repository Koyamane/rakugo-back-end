'use strict';

module.exports = (app, jwt) => {
  app.router.post('/follow/api/page/watchers', 'follow.getWatcherList');
  app.router.get('/follow/api/follow/status', 'follow.getUserFollowStatus');
  app.router.put('/follow/api/follow', jwt, 'follow.follow');
};
