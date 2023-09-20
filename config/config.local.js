'use strict';

module.exports = () => {
  /**
   * @type {Egg.EggAppConfig}
   **/
  const config = (exports = {});

  config.cos = {
    bucket: 'yamanesi-1258339807',
    region: 'ap-guangzhou',
  };

  return {
    ...config,
  };
};
