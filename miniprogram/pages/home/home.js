const db = wx.cloud.database()

Page({
  data: {
    noteList: []
  },

  onLoad: function() {
    this.getNotes()
  },
    
  onShow:function(){
    this.getNotes().then(() => {
      wx.stopPullDownRefresh()
    })
  },
    
  onPullDownRefresh: function() {
    wx.stopPullDownRefresh()
    this.getNotes().then(() => {
      
    })
  },



  getNotes: function() {
    wx.showLoading({ title: '加载中...' })
    
    // 1. 调用云函数 
    wx.cloud.callFunction({
      name: 'home_getData', 
      data: {} 
    }).then(res => {
      console.log('云函数返回的数据：', res.result)

      // 2. 判断 code 是否为 0 (成功)
      if (res.result.code === 0) {
        // 3. 直接拿到 data 赋值
        // 注意：云函数返回的结构是 { code: 0, message: '...', data: [...] }
        // 所以我们要取 res.result.data
        this.setData({
          noteList: res.result.data
        })
      } else {
        // 如果云函数里报了错
        wx.showToast({
          title: res.result.message || '加载失败',
          icon: 'none'
        })
      }
      wx.hideLoading()
        
      
    }).catch(err => {
      // 4. 捕获系统级错误（比如云函数不存在、网络断了）
      wx.hideLoading()
      console.error('调用云函数失败：', err)
      wx.showToast({
        title: '系统错误',
        icon: 'none'
      })
    })
  }
 
})