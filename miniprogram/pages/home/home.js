const db = wx.cloud.database()

Page({
  data: {
    noteList: []
  },

  onLoad: function() {
    this.getNotes()
  },
  
  //start
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

   // --- 修改点：点击 + 号，先弹出输入框 ---
   chooseAndUpload: function() {
    // 1. 先弹出输入标题的框
    wx.showModal({
      title: '发布新笔记',
      placeholderText: '请输入标题...', // 只有基础库2.15.0以上支持
      editable: true, // 允许输入
      confirmText: '下一步',
      success: (res) => {
        if (res.confirm && res.content) {
          // 用户输入了标题，存到 data 里，然后去选图
          this.setData({ tempTitle: res.content })
          this.selectImage() 
        } else if (res.confirm && !res.content) {
          wx.showToast({ title: '标题不能为空', icon: 'none' })
        }
      }
    })
  },

// --- 新增：选图逻辑 ---
selectImage: function() {
  wx.chooseMedia({
    count: 1,
    mediaType: ['image'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempFilePath = res.tempFiles[0].tempFilePath
      const title = this.data.tempTitle // 拿到刚才输入的标题
      
      // 拿到标题和图片后，执行上传
      this.uploadAndSave(tempFilePath, title)
    },
    fail: (err) => {
      // 用户取消选图，不做处理
    }
  })
},

// --- 修改：上传并保存 (把 title 传进来) ---
uploadAndSave: function(filePath, title) {
  wx.showLoading({ title: '发布中...', mask: true })
  
  const fileName = Date.now() + '_' + Math.floor(Math.random() * 1000) + '.jpg'
  
  wx.cloud.uploadFile({
    cloudPath: `notes_images/${fileName}`,
    filePath: filePath,
    success: (uploadRes) => {
      this.saveToDatabase(uploadRes.fileID, title)
    },
    fail: (err) => {
      wx.hideLoading()
      wx.showToast({ title: '上传失败', icon: 'none' })
    }
  })
},

  // --- 修改：保存到数据库 (接收 title 参数) ---
  saveToDatabase: function(fileID, title) {
    const defaultAvatar = '/images/default-avatar.png'; 

    db.collection('notes').add({
      data: {
        title: title, // 使用用户输入的标题
        image: fileID,
        avatar: defaultAvatar, 
        nickname: '我',
        likes: 0,
        createTime: db.serverDate()
      }
    }).then(() => {
      wx.hideLoading()
      wx.showToast({ title: '发布成功' })
      this.getNotes() // 刷新列表
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({ title: '发布失败', icon: 'none' })
    })
  }
})