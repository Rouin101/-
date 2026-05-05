const db = wx.cloud.database()

Page({
  data: {
    noteList: []
  },

  onLoad: function() {
    this.getNotes()
  },

  // 获取列表
  getNotes: function() {
    wx.showLoading({ title: '加载中...' })
    db.collection('notes')
      .orderBy('createTime', 'desc')
      .get()
      .then(res => {
        this.setData({ noteList: res.data })
        wx.hideLoading()
      })
      .catch(err => {
        console.error('获取失败', err)
        wx.hideLoading()
      })
  },

  // --- 新增：图片加载完成的回调 ---
  // 作用：图片加载完后，触发一次 setData，强制让瀑布流重新计算高度
  // 这样能有效防止图片加载慢导致的布局重叠或闪烁
  onImageLoad: function() {
    // 这里不需要做任何事，只需要触发 setData 即可刷新视图
    // 为了性能，实际项目中可以用防抖，但在这种简单列表里直接刷新即可
    this.setData({ noteList: this.data.noteList });
  },

  // 上传图片逻辑（保持不变）
  chooseAndUpload: function() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        const fileName = Date.now() + '_' + Math.floor(Math.random() * 1000) + '.jpg'
        
        wx.showLoading({ title: '上传中...', mask: true })

        wx.cloud.uploadFile({
          cloudPath: `notes_images/${fileName}`,
          filePath: tempFilePath,
          success: (uploadRes) => {
            const fileID = uploadRes.fileID
            this.saveToDatabase(fileID)
          },
          fail: (err) => {
            wx.hideLoading()
            wx.showToast({ title: '上传失败', icon: 'none' })
          }
        })
      }
    })
  },

  saveToDatabase: function(fileID) {
    db.collection('notes').add({
      data: {
        title: '新发布的笔记',
        image: fileID,
        avatar: 'cloud://your-env-id.xxx/default-avatar.png',
        nickname: '我',
        likes: 0,
        createTime: db.serverDate()
      }
    }).then(() => {
      wx.hideLoading()
      wx.showToast({ title: '发布成功' })
      this.getNotes()
    })
  }
})