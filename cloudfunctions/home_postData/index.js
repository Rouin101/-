// 云函数入口文件
const cloud = require('wx-server-sdk')


cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  // 1. 获取当前用户的微信上下文信息（包含最可信的 openid）
  const wxContext = cloud.getWXContext()
  const _openid = wxContext.OPENID

  // 2. 提取前端（小程序）传过来的参数
  const {title, content, images} = event

  // 3. 基础校验：防止有人恶意提交空数据
  if (!title || !title.trim()) {
    return { code: -1, message: '标题不能为空' }
  }
  if (images.length === 0){
    return { code: -1, message: '至少上传一张图片' }
  }
  
  try {
    // 4. 向 notes 集合插入一条新记录
    
    //先查用户信息
    const userRes = await db.collection('users').where({_openid: _openid}).limit(1).get()
    const userInfo = userRes.data[0]
    const nickname = userInfo.nickname
    const avatar = userInfo.avatar
    
    
    
    const res = await db.collection('notes').add({
      data: {
        //所属标记
        _openid: userInfo._openid,
        //内容信息
        title: title.trim(),
        content: content.trim(),
        images: images , 
        
        //用户信息
        nickname: nickname ,
        avatar: avatar,
        
        // 使用服务器当前时间，避免用户手机时间不准
        createTime: db.serverDate(), 
        updateTime: db.serverDate()
       
      }
    })
    
    

    // 5. 返回成功，并把新笔记的 _id 返回给前端
    return {
      code: 0,
      message: '上传成功',
      newId: res._id
    }

  } catch (err) {
    // 在云函数的后台日志里打印出最详细的报错堆栈
    console.error('云函数内部发生严重错误：')
    
    // 返回给前端一个包含具体错误信息的提示
    return { 
      code: -1, 
      message: '上传失败：' 
    }
  }
}