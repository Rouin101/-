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
  
  },

  // --- 👇 新增：图片预览功能 👇 ---
  previewImage(e) {
    // 1. 获取点击图片的索引
    const index = e.currentTarget.dataset.index;
    
    // 2. 获取图片列表（这里兼容处理，防止 images 为空导致报错）
    const images = this.data.detailInfo.images || [];

    // 3. 调用微信原生预览接口
    wx.previewImage({
      current: images[index], // 当前显示图片的链接
      urls: images,           // 需要预览的图片链接列表
      success: () => {
        console.log('预览成功');
      }
    });
  }

})