'use strict';

module.exports = app => {
  const { mongoose } = app;

  const blogSchema = new mongoose.Schema(
    {
      id: {
        type: String,
        unique: true,
        require: true,
        default: () => app.createUuid(11, 10), // 用函数的方法，就不会每次都是固定值了
      },
      createdUser: { type: String, default: '' },
      createdName: { type: String, default: '' },
      createdId: { type: String, default: '' },
      createdAvatar: { type: String, default: '' },
      createdSignature: { type: String, default: '' },
      createdDate: { type: Date, default: () => new Date() },
      approvedDate: { type: Date, default: () => new Date() },
      updateDate: { type: Date, default: () => new Date() },
      editor: {
        type: String,
        validate: str => {
          // 必须全是 RICH_TEXT 和 MARKDOWN
          return [ 'RICH_TEXT', 'MARKDOWN' ].includes(str);
        },
        default: 'RICH_TEXT',
      },
      title: { type: String, default: '', require: true },
      content: { type: String, default: '' },
      mdData: { type: String, default: '' },
      cover: { type: String, default: '' },
      status: {
        type: String,
        validate: str => {
          // 审核通过、拒绝、待审核
          return [ 'APPROVED', 'REJECT', 'REVIEWED' ].includes(str);
        },
        default: 'APPROVED',
      },
      rejectReason: { type: String, default: '' },
      sort: { type: String, default: '', require: true },
      description: { type: String, default: '', require: true },
      tags: {
        type: Array,
        validate: arr => {
          // 必须全是 string
          return arr.every(item => typeof item === 'string');
        },
        default: [],
      },
      reads: { type: Number, min: 0, default: 0 },
      likes: { type: Number, min: 0, default: 0 },
      dislikes: { type: Number, min: 0, default: 0 },
      comments: { type: Number, min: 0, default: 0 },
      collections: { type: Number, min: 0, default: 0 },
    },
    { versionKey: false }
  );

  return mongoose.model('Blog', blogSchema);
};
