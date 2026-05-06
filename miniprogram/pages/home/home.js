const db = wx.cloud.database()

Page({
  data: {
    noteList: [],
    currentDetail: null,     // 详情页数据
    showPublishModal: false, // 控制发帖弹窗显示
    tempTitle: '',           // 暂存标题
    tempContent: ''          // 新增：暂存内容
  },

  onLoad: function() {
    this.getNotes()
  },

  getNotes: function() {
    wx.showLoading({ title: '加载中...' })
    db.collection('notes').orderBy('createTime', 'desc').get().then(res => {
      this.setData({ noteList: res.data })
      wx.hideLoading()
    }).catch(err => {
      wx.hideLoading()
    })
  },

  // --- 修改：打开弹窗 ---
  openPublishModal: function() {
    this.setData({
      showPublishModal: true,
      tempTitle: '',      // 打开时清空之前的输入
      tempContent: ''
    })
  },

  // --- 修改：关闭弹窗 ---
  closePublishModal: function() {
    this.setData({
      showPublishModal: false
    })
  },

  // --- 新增：监听标题输入 ---
  onTitleInput: function(e) {
    this.setData({ tempTitle: e.detail.value })
  },

  // --- 新增：监听内容输入 ---
  onContentInput: function(e) {
    this.setData({ tempContent: e.detail.value })
  },

  // --- 修改：确认发布逻辑 ---
  confirmPublish: function() {
    const title = this.data.tempTitle.trim()
    const content = this.data.tempContent.trim()

    if (!title) {
      wx.showToast({ title: '标题不能为空', icon: 'none' })
      return
    }
    // 如果希望内容也是必填，可以解开下面注释
    // if (!content) {
    //   wx.showToast({ title: '内容不能为空', icon: 'none' })
    //   return
    // }

    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.uploadAndSave(tempFilePath, title, content)
      },
      fail: (err) => { console.log(err) }
    })
  },

  // --- 修改：上传并保存 (增加 content 参数) ---
  uploadAndSave: function(filePath, title, content) {
    wx.showLoading({ title: '发布中...', mask: true })
    
    const fileName = Date.now() + '_' + Math.floor(Math.random() * 1000) + '.jpg'
    
    wx.cloud.uploadFile({
      cloudPath: `notes_images/${fileName}`,
      filePath: filePath,
      success: (uploadRes) => {
        this.saveToDatabase(uploadRes.fileID, title, content)
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({ title: '上传失败', icon: 'none' })
      }
    })
  },

  // --- 修改：保存到数据库 ---
  saveToDatabase: function(fileID, title, content) {
    const defaultAvatar = '/images/default-avatar.png'; 

    db.collection('notes').add({
      data: {
        title: title,
        content: content, // 存入内容
        image: fileID,
        avatar: defaultAvatar, 
        nickname: '我',
        likes: 0,
        createTime: db.serverDate()
      }
    }).then(() => {
      wx.hideLoading()
      wx.showToast({ title: '发布成功' })
      this.closePublishModal() // 关闭弹窗
      this.getNotes()          // 刷新列表
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({ title: '发布失败', icon: 'none' })
    })
  },

  // --- 详情页逻辑保持不变 ---
  showDetail: function(e) {
    const item = e.currentTarget.dataset.item
    this.setData({ currentDetail: item })
  },

  hideDetail: function() {
    this.setData({ currentDetail: null })
  }
})