// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 自动识别当前云开发环境
})
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  // 获取小程序端传过来的最新资料
  const { nickname, avatar, bio } = event
  
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 使用云开发的事务，保证所有集合要么全部更新成功，要么全部回滚（保证数据一致性）
    const transaction = await db.startTransaction()
    try {
      // 更新用户主表 (users)
      await transaction.collection('users').where({_openid: openid}).update({
        data: {
          nickname: nickname,
          avatar: avatar ,
          bio: bio ,
          updateTime: db.serverDate()
        }
      })

      // 同步更新笔记集合 (notes)
      await transaction.collection('notes').where({
        _openid: openid
      }).update({
        data: {
          nickname: nickname,
          avatar: avatar ,
          
        }
      })

      // 同步更新论坛集合 
      await transaction.collection('forum_post').where({
        _openid: openid
      }).update({
        data: {
          nickname: nickname,
          avatar: avatar ,
          
        }
      })

      // 同步更新积分集合 (scores)
      await transaction.collection('scores').where({
        _openid: openid
      }).update({
        data: {
          nickName: nickname,
          avatarUrl: avatar,
          updateTime: db.serverDate()
        }
      })
      
      // 同步更新回复集合 
      await transaction.collection('forum_reply').where({
        _openid: openid
      }).update({
        data: {
          nickname: nickname,
          avatar: avatar,
          
        }
      })
      
      // 提交事务
      await transaction.commit()
      
      return {
        code: 200,
        message: '资料及关联数据同步更新成功',
        updatedNickname: nickname
      }

    } catch (err) {
      // 如果中间有任何一步出错，回滚事务
      await transaction.rollback()
      console.error('更新事务失败:', err)
      return {
        code: 500,
        message: '更新失败，数据已回滚',
        error: err
      }
    }

  } catch (err) {
    console.error('云函数执行异常:', err)
    return {
      code: 500,
      message: '服务器内部错误',
      error: err
    }
  }
}
    
    
    
