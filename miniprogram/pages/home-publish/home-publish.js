const db = wx.cloud.database()

Page({
  data: {
    title: '',
    content: '',
    tempFilePaths: [] // 必须是数组
  },

  onTitleInput: function(e) {
    this.setData({ title: e.detail.value })
  },

  onContentInput: function(e) {
    this.setData({ content: e.detail.value })
  },

  chooseImage: function() {
    // 使用箭头函数确保 this 指向正确
    wx.chooseMedia({
      count: 9,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        // 1. 提取新图片的路径
        const newFiles = res.tempFiles.map(file => file.tempFilePath)
        
        // 2. 合并旧图片和新图片
        const allFiles = this.data.tempFilePaths.concat(newFiles)
        
        // 3. 更新数据
        this.setData({
          tempFilePaths: allFiles
        })
        
        console.log('图片已添加，当前数量:', allFiles.length)
      },
      fail: (err) => {
        console.error('选择失败:', err)
      }
    })
  },

  deleteImage: function(e) {
    const index = e.currentTarget.dataset.index
    const files = this.data.tempFilePaths
    files.splice(index, 1)
    this.setData({ tempFilePaths: files })
  },

  goBack: function() {
    wx.navigateBack({ delta: 1 })
  },

  confirmPublish: function() {
    const { title, content, tempFilePaths } = this.data

    if (!title.trim()) {
      wx.showToast({ title: '标题不能为空', icon: 'none' })
      return
    }
    if (tempFilePaths.length === 0) {
      wx.showToast({ title: '请至少添加一张图片', icon: 'none' })
      return
    }

    wx.showLoading({ title: '发布中...', mask: true })

    // 批量上传
    const uploadTasks = tempFilePaths.map(path => {
      const fileName = Date.now() + '_' + Math.random() + '.jpg'
      return wx.cloud.uploadFile({
        cloudPath: `notes_images/${fileName}`,
        filePath: path
      }).then(res => res.fileID)
    })

    Promise.all(uploadTasks).then(fileIDs => {
      this.saveToDatabase(fileIDs, title, content)
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({ title: '上传失败', icon: 'none' })
      console.error(err)
    })
  },

saveToDatabase: function(fileIDs, title, content) {
    const app = getApp()
    const userInfo = app.globalData.userInfo
    db.collection('notes').add({
      data: {
        title: title,
        content: content,
        images: fileIDs,
        avatar: userInfo?.avatar || '/images/default-avatar.png',
        nickname: userInfo?.nickname || '我',
        likes: 0,
        openid: app.globalData.openid,
        createTime: db.serverDate()
      }
    }).then(() => {
      wx.hideLoading()
      wx.showToast({ title: '发布成功' })
      setTimeout(() => { wx.navigateBack({ delta: 1 }) }, 1500)
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({ title: '发布失败', icon: 'none' })
      console.error(err)
    })
  }
})