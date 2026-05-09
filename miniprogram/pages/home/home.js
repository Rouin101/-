const db = wx.cloud.database()

Page({
  data: {
    noteList: []
    // 删除 currentDetail
  },

  onLoad: function() {
    this.getNotes()
  },

  onShow: function() {
    this.getNotes()
  },

  onPullDownRefresh: function() {
    this.getNotes().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  getNotes: function() {
    wx.showLoading({ title: '加载中...' })
    return db.collection('notes').orderBy('createTime', 'desc').get().then(res => {
      
      // --- 核心修复代码开始 ---
      // 遍历数据，确保 image 字段是一个数组
      const list = res.data.map(item => {
        // 如果 image 是字符串（比如 "url1,url2"），把它切分成数组
        if (item.image && typeof item.image === 'string') {
          item.image = item.image.split(',')
        }
        // 如果 image 已经是数组，保持不变
        // 如果 image 不存在，保持 undefined（页面会通过 wx:if 隐藏）
        return item
      })
      // --- 核心修复代码结束 ---

      this.setData({ 
        noteList: list 
      })
      wx.hideLoading()
    }).catch(err => {
      wx.hideLoading()
      console.error(err)
    })
  }
  // 删除 showDetail 和 hideDetail 函数
})