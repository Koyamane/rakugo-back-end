'use strict';

module.exports = app => {
  const { mongoose } = app;

  const dataSchema = new mongoose.Schema(
    {
      order: Number,
      key: {
        type: String || Number,
        require: true,
      },
      value: String || Number || Boolean,
      valueZh: String || Number || Boolean,
      valueEn: String || Number || Boolean,
      valueJa: String || Number || Boolean,
    },
    { versionKey: false, _id: false }
  );

  const dataDictionarySchema = new mongoose.Schema(
    {
      id: {
        type: String,
        unique: true,
        require: true,
        default: () => app.createUuid(9, 10),
      },
      createdId: { type: String, require: true },
      createdName: { type: String, require: true },
      createdDate: { type: Date, default: () => new Date() },
      updateDate: { type: Date, default: () => new Date() },
      status: {
        type: String,
        validate: str => {
          return [ 'EFFECTIVE', 'INVALID' ].includes(str);
        },
        default: 'EFFECTIVE',
      },
      title: { type: String, default: '', require: true },
      key: { type: String, default: '', require: true, unique: true },
      description: { type: String, default: '' },
      datas: [ dataSchema ],
    },
    { versionKey: false }
  );

  return mongoose.model('DataDictionary', dataDictionarySchema);
};
