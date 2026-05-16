// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 直接查询 notes 集合的所有数据，并按 createTime 倒序排列
    const res = await db.collection('notes')
      .orderBy('createTime', 'desc') // 按创建时间降序（最新的在最上面）
      .get()

    // 返回查询到的所有数据
    return {
      code: 0,
      message: '获取成功',
      data: res.data 
    }
  } catch (err) {
    console.error('查询数据库出错：', err)
    return { code: -1, message: '系统繁忙，查询失败' }
  }
}