// cloudfunctions/getForumList/index.js
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()
const $ = db.command.aggregate // 引入聚合操作符

exports.main = async (event, context) => {
  try {
    const res = await db.collection('forum_post').aggregate()
      // 1. 按照发帖时间倒序排序（最新的在最上面）
      .sort({
        createTime: -1
      })
      // 2. 联表查询：去 forum_reply 集合里找回复
      .lookup({
        from: 'forum_reply',          // 要关联的集合名（回复表）
        localField: '_id',            // 当前集合（帖子表）的关联字段（帖子ID）
        foreignField: 'postId',       // 目标集合（回复表）的关联字段
        as: 'replies'                 // 查询出来的回复数组，起个名字叫 replies
      })
      // 3. 结束聚合查询
      .end()

    return {
      code:0,
      data: res.list
    }
  } catch (err) {
    console.error('获取帖子列表失败', err)
    return {
      code:-1,
      msg: '获取数据失败',
      err
    }
  }
}