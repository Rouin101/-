// cloudfunctions/getPostList/index.js
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV 
})
const db = cloud.database()
const $ = db.command.aggregate // 引入聚合操作符

exports.main = async (event, context) => {
  try {
    // 使用聚合管道进行联表查询
    const res = await db.collection('forum_post') // 1. 从帖子表（forum）开始查
      .aggregate()
      // 2. 左连接回复表（forum_reply）：把帖子的 _id 和回复的 postId 匹配起来
      .lookup({
        from: 'forum_reply',
        localField: '_id',
        foreignField: 'postId',
        as: 'replyList', // 匹配到的回复会放在 replyList 数组里
      })
      // 3. 按时间倒序排序（最新的帖子在最上面）
      .sort({
        createTime: -1
      })
      // 4. 结束聚合，返回结果
      .end()

    return {
      success: true,
      data: res.list
    }
  } catch (err) {
    console.error('获取帖子列表失败', err)
    return {
      success: false,
      err
    }
  }
}