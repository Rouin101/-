const db = wx.cloud.database()

Page({
  data: {
    detailInfo: {}
  },

  onLoad: function(options) {
    const id = options.id
    if (id) {
      this.getDetail(id)
    }
  },

  getDetail: function(id) {
    wx.showLoading({ title: '加载中...' })
    db.collection('notes').doc(id).get().then(res => {
      const data = res.data
      
      // 【兼容处理】
      // 如果是旧数据（单图），把它转成数组格式，防止报错
      if (data.image && !data.images) {
        data.images = [data.image]
      }
      
      this.setData({ detailInfo: data })
      wx.hideLoading()
    }).catch(err => {
      wx.hideLoading()
      console.error(err)
    })
  }
})