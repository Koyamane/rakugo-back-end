'use strict';

module.exports = (app, jwt) => {
  app.router.post('/comment/api/page', 'comment.commentList');
  app.router.get('/comment/api/total/:targetId', 'comment.commentTotal');
  app.router.post('/comment/api/comment', jwt, 'comment.comment');
  app.router.post('/comment/api/like', jwt, 'comment.likeComment');
  app.router.delete('/comment/api/delete', jwt, 'comment.deleteComment');
};
