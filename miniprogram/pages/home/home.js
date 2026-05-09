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
      this.setData({ noteList: res.data })
      wx.hideLoading()
    }).catch(err => {
      wx.hideLoading()
      console.error(err)
    })
  }
  // 删除 showDetail 和 hideDetail 函数
})