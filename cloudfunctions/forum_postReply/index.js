// cloudfunctions/addReply/index.js
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV 
})
const db = cloud.database()

exports.main = async (event, context) => {
  //先查用户信息
  const wxContext = cloud.getWXContext()
  const _openid = wxContext.OPENID
  const userRes = await db.collection('users').where({_openid: _openid}).limit(1).get()
  const userInfo = userRes.data[0]
  const nickname = userInfo.nickname
  const avatar = userInfo.avatar
 

  try {
    // 获取前端传过来的帖子ID、回复内容、作者名等
    const { postId, content } = event
    
    // 向 replies 集合中插入一条新的回复记录
    const res = await db.collection('forum_reply').add({
      data: {
        postId: postId,          // 关联的帖子ID
        content: content,        // 回复的具体内容
        nickname: nickname,          // 回复人的名字
        avatar: avatar,  
        _openid: _openid, 
        createTime: db.serverDate() // 使用服务器当前时间
      }
    })

    return {
      success: true,
      msg: '回复成功',
      id: res._id // 返回新插入的回复记录ID
    }
  } catch (err) {
    console.error('回复失败', err)
    return {
      success: false,
      msg: '回复失败',
      err
    }
  }
}