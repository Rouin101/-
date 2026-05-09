// 云函数：quizFunctions
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (action === 'submit') {
    const { nickName, avatarUrl, score } = event
    try {
      await db.collection('scores').add({
        data: {
          openid: openid,
          nickName: nickName || '匿名用户',
          avatarUrl: avatarUrl || '',
          score: score,
          createTime: db.serverDate()
        }
      })
      return { success: true }
    } catch (e) {
      return { success: false, error: e }
    }
  } 
  else if (action === 'getRank') {
    try {
      const res = await db.collection('scores')
        .orderBy('score', 'desc')
        .orderBy('createTime', 'asc')
        .limit(20)
        .get()
      return { success: true, rankList: res.data }
    } catch (e) {
      return { success: false, error: e }
    }
  }
  return { success: false, msg: 'unknown action' }
}