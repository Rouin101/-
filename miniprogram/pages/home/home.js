const db = wx.cloud.database()

Page({
  data: {
    noteList: []
  },

  onLoad: function() {
    this.getNotes()
    
  },

  onShow: function() {
    // 当从发布页面返回时，onShow 会被触发，这里重新拉取列表
    this.getNotes()
  },
  // 下拉刷新时重新获取数据
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
  },

  // 详情页逻辑保持不变
  showDetail: function(e) {
    const item = e.currentTarget.dataset.item
    this.setData({ currentDetail: item })
  },

  hideDetail: function() {
    this.setData({ currentDetail: null })
  }
})