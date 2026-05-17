// 云函数 forum_getDetail/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const postId = event.postId

  try {
    // 1. 查帖子主体
    const postRes = await db.collection('forum_post').doc(postId).get()
    
    // 2. 查该帖子的所有回复（云函数里最多可获取100条，且时间会自动转成字符串）
    const replyRes = await db.collection('forum_reply').where({
      postId: postId
    }).get()

    // 3. 把两部分数据拼在一起返回给前端
    return {
      code: 0,
      data: {
        post: postRes.data,
        replies: replyRes.data
      }
    }
  } catch (err) {
    console.error(err)
    return { code: -1, msg: '获取详情失败' }
  }
}