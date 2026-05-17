const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const { text } = event // 接收前端传过来的文本

  try {
    const result = await cloud.openapi.security.msgSecCheck({
      content: text
    })

    // 如果 errCode 为 0，说明内容安全，返回 true；否则返回 false
    if (result.errCode === 0) {
      return true
    } else {
      return false
    }
  } catch (err) {
    console.error('敏感词检测失败', err)
    // 如果接口调用出错（比如网络问题等），为了安全起见，建议返回 false 或在调用端做容错处理
    return false
  }
}