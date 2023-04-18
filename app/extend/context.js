'use strict';

module.exports = {
  /**
   * @description 根据当前请求token，返回对应用户详情
   */
  async getCurrentUserInfo() {
    const token = this.request.header.authorization;
    if (!token) {
      return null;
    }
    const smallUserInfo = this.app.jwt.verify(token.split(' ')[1], this.app.config.jwt.secret);
    const userInfo = await this.service.cache.redis.get(smallUserInfo.userId);
    return userInfo;
  },

  /**
   * @description 使用时必须加 await
   * @param {Promise} servicePromise
   */
  async returnService(servicePromise) {
    const [ error, data ] = await this.wapperError(servicePromise);

    if (error) {
      const status = error.status || 500;
      this.status = status;
      this.body = {
        status,
        msg: error.message || error,
      };
    } else {
      this.body = {
        status: 200,
        data,
      };
    }

    return this.body;
  },

  /**
   * @description 中文当作两个长度
   * @param {String} str 需测量的字符串
   */
  getStrLen(str) {
    if (str == null) return 0;
    if (typeof str !== 'string') {
      str = str + '';
    }
    // eslint-disable-next-line no-control-regex
    return str.replace(/[^\x00-\xff]/g, '01').length;
  },

  wapperError(promise) {
    return promise
      .then(data => {
        return [ undefined, data ];
      })
      .catch(err => [ err ]);
  },
};
