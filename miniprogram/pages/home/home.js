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
    this.getNotes().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  getNotes: function() {
    wx.showLoading({ title: '加载中...' })
    return db.collection('notes').orderBy('createTime', 'desc').get().then(res => {
      
      
      // 遍历数据，确保 images 字段是一个数组
      const list = res.data.map(item => {
        // 如果 images 是字符串（比如 "url1,url2"），把它切分成数组
        if (item.images && typeof item.images === 'string') {
          item.images = item.images.split(',')
        }
        // 如果 images 已经是数组，保持不变
        // 如果 images 不存在，保持 undefined（页面会通过 wx:if 隐藏）
        return item
      })
      

      this.setData({ 
        noteList: list 
      })
      wx.hideLoading()
    }).catch(err => {
      wx.hideLoading()
      console.error(err)
    })
  }
 
})