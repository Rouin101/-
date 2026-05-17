const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { postId } = event // 前端传入的帖子 _id
  
  const wxContext = cloud.getWXContext()
  const OPENID = wxContext.OPENID
  try {
    // 1. 权限校验：先查出这个帖子，看看是不是当前用户发的
    const postRes = await db.collection('forum_post').doc(postId).get()
    if (!postRes.data) {
      return { code: -1, message: '帖子不存在' }
    }
    
    
    if (postRes.data._openid !== OPENID) {
      return { code: -2, message: '无权删除他人帖子' }
    }

    // 2. 删除该帖子下的所有评论/回复
    // 假设你的评论集合名叫 'comments'，并且评论里用 postId 字段关联了帖子
    await db.collection('forum_reply').where({
      postId: postId
    }).remove()

    // 3. 删除帖子本身
    await db.collection('forum_post').doc(postId).remove()

    return { code: 0, message: '删除成功' }

  } catch (err) {
    console.error('删除失败', err)
    return { code: -3, message: '系统错误，删除失败' }
  }
}