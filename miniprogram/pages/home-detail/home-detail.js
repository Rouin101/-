const db = wx.cloud.database()

Page({
  data: {
    detailInfo: {}
  },

  onLoad: function(options) {
    // 1. 获取首页传递过来的 id
    const id = options.id
    if (id) {
      this.getDetail(id)
    }
  },

  // 2. 根据 id 查询数据库
  getDetail: function(id) {
    wx.showLoading({ title: '加载中...' })
    db.collection('notes').doc(id).get().then(res => {
      this.setData({
        detailInfo: res.data
      })
      wx.hideLoading()
    }).catch(err => {
      wx.hideLoading()
      console.error(err)
    })
  }
})