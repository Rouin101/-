const db = wx.cloud.database()

Page({
  data: {
    title: '',
    content: '',
    tempFilePath: '' // 暂时只支持单图，如需多图改为数组 []
  },

  // 监听标题输入
  onTitleInput: function(e) {
    this.setData({ title: e.detail.value })
  },

  // 监听内容输入
  onContentInput: function(e) {
    this.setData({ content: e.detail.value })
  },

  // 选择图片
  chooseImage: function() {
    wx.chooseMedia({
      count: 1, // 这里设置为1，如果需要多图发布需改为9并修改逻辑
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          tempFilePath: res.tempFiles[0].tempFilePath
        })
      }
    })
  },

  // 删除图片
  deleteImage: function() {
    this.setData({ tempFilePath: '' })
  },

  // 取消按钮：返回上一页
  goBack: function() {
    wx.navigateBack({ delta: 1 })
  },

  // 确认发布
  confirmPublish: function() {
    const { title, content, tempFilePath } = this.data

    // 1. 基础校验
    if (!title.trim()) {
      wx.showToast({ title: '标题不能为空', icon: 'none' })
      return
    }
    if (!tempFilePath) {
      wx.showToast({ title: '请至少添加一张图片', icon: 'none' })
      return
    }

    wx.showLoading({ title: '发布中...', mask: true })

    // 2. 上传图片到云存储
    const fileName = Date.now() + '_' + Math.floor(Math.random() * 1000) + '.jpg'
    wx.cloud.uploadFile({
      cloudPath: `notes_images/${fileName}`,
      filePath: tempFilePath,
      success: (uploadRes) => {
        // 3. 上传成功，保存数据到数据库
        this.saveToDatabase(uploadRes.fileID, title, content)
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({ title: '图片上传失败', icon: 'none' })
        console.error(err)
      }
    })
  },

  // 保存到数据库
  saveToDatabase: function(fileID, title, content) {
    db.collection('notes').add({
      data: {
        title: title,
        content: content,
        image: fileID,
        avatar: '/images/default-avatar.png', // 这里的头像可以后续改为获取用户信息
        nickname: '我',
        likes: 0,
        createTime: db.serverDate()
      }
    }).then(() => {
      wx.hideLoading()
      wx.showToast({ title: '发布成功' })
      
      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        wx.navigateBack({ delta: 1 })
      }, 1500)
      
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({ title: '发布失败', icon: 'none' })
      console.error(err)
    })
  }
})