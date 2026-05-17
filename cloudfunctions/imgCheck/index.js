const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const { base64Data } = event // 接收前端传来的 base64 字符串
  
  try {
    const result = await cloud.openapi.security.imgSecCheck({
      media: {
        contentType: 'image/png', // 统一指定为 png 或 jpg
        value: Buffer.from(base64Data, 'base64') // 将 base64 转为 Buffer
      }
    })
    
    // 如果 errCode 为 0，说明图片安全
    return result.errCode === 0
  } catch (err) {
    console.error('图片检测报错', err)
    // 打印具体的错误码，方便你排查
    // 87014 是违规，40002/40003/40004 都是格式或大小问题
    return false 
  }
}