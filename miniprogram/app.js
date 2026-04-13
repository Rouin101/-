// app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'cloud1-9g2fived3f8a6082', // 替换成你的环境ID
        traceUser: true,
      })
    }
    
    // 全局存储用户信息（用于发帖和评论）
    this.globalData = {
      userInfo: null
    }
  },
  globalData: {
    userInfo: null
  }
})
