// cloudfunctions/submitPost/index.js
const cloud = require('wx-server-sdk')
// 初始化云函数环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV 
})
const db = cloud.database()

exports.main = async (event, context) => {
  const { content } = event


  try {
    const wxContext = cloud.getWXContext()
    const _openid = wxContext.OPENID
    //先查用户信息
    const userRes = await db.collection('users').where({_openid: _openid}).limit(1).get()
    
    const userInfo = userRes.data[0]
    

    const res = await db.collection('forum_post').add({
      data: {
        _openid: userInfo._openid,
        avatar: userInfo.avatar,
        nickname: userInfo.nickname,
        content: content,
        createTime: db.serverDate(), 
      }
    })
    return { code: 0, id: res._id }
  } catch (err) {
    console.error('云函数发帖失败', err)
    return { code: -1 , err }
  }
        
        
}