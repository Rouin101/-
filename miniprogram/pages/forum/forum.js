const db = wx.cloud.database()
const app = getApp()

Page({
  data: {
    // --- 登录状态 ---
    hasLogin: false,
    userInfo: null,

    // --- 帖子列表 ---
    postList: [],

    // --- 发帖弹窗 ---
    showPostModal: false,
    postTitle: '',
    postContent: '',

    // --- 详情弹窗 ---
    showDetailModal: false,
    currentPostId: '',
    detail: {},
    comments: [],
    commentText: ''
  },

  onLoad() {
    // 1. 页面加载时，检查全局有没有缓存的用户信息
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasLogin: true
      })
    }
    // 2. 加载帖子列表
    this.fetchPosts()
  },

  // --- 核心功能：登录 ---
  handleLogin() {
    if (this.data.hasLogin) return // 已登录则不操作

    wx.getUserProfile({
      desc: '用于完善论坛发帖资料',
      success: (res) => {
        const userInfo = res.userInfo
        // 更新页面状态
        this.setData({
          userInfo: userInfo,
          hasLogin: true
        })
        // 存入全局变量，方便发帖时直接调用
        app.globalData.userInfo = userInfo
        wx.showToast({ title: '登录成功' })
      },
      fail: (err) => {
        console.log(err)
        wx.showToast({ title: '登录已取消', icon: 'none' })
      }
    })
  },

  // --- 数据获取 ---
  fetchPosts() {
    wx.showLoading({ title: '加载中...' })
    db.collection('posts')
      .orderBy('createTime', 'desc')
      .get()
      .then(res => {
        const list = res.data.map(item => {
          let dateStr = '未知时间'
          
          // 【修改点】更稳健的时间处理逻辑
          try {
            if (item.createTime) {
              // 如果是云开发的时间对象
              if (item.createTime.getDate) {
                const date = item.createTime.getDate()
                dateStr = `${date.getMonth() + 1}月${date.getDate()}日`
              } 
              // 如果是字符串（比如你手动在控制台加的）
              else if (typeof item.createTime === 'string') {
                 const date = new Date(item.createTime)
                 dateStr = `${date.getMonth() + 1}月${date.getDate()}日`
              }
            }
          } catch (e) {
            console.error('时间格式化错误', e)
          }
          
          item.createTimeStr = dateStr
          return item
        })
        
        this.setData({ postList: list })
        wx.hideLoading()
      })
      .catch(err => {
        console.error('获取数据失败', err)
        wx.hideLoading()
        wx.showToast({ title: '加载失败，请检查权限', icon: 'none' })
      })
  },

  // --- 发帖逻辑 ---
  openPostModal() {
    if (!this.data.hasLogin) {
      wx.showToast({ title: '请先点击右上角登录', icon: 'none' })
      return
    }
    this.setData({
      showPostModal: true,
      postTitle: '',
      postContent: ''
    })
  },
  closePostModal() {
    this.setData({ showPostModal: false })
  },
  onPostTitleInput(e) { this.setData({ postTitle: e.detail.value }) },
  onPostContentInput(e) { this.setData({ postContent: e.detail.value }) },

  submitPost() {
    if (!this.data.postTitle || !this.data.postContent) {
      return wx.showToast({ title: '内容不能为空', icon: 'none' })
    }

    wx.showLoading({ title: '发布中...' })
    db.collection('posts').add({
      data: {
        title: this.data.postTitle,
        content: this.data.postContent,
        createTime: db.serverDate(),
        userInfo: this.data.userInfo // 使用当前登录用户的信息
      }
    }).then(() => {
      wx.hideLoading()
      this.closePostModal()
      this.fetchPosts() // 刷新列表
      wx.showToast({ title: '发布成功' })
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({ title: '发布失败', icon: 'none' })
      console.error(err)
    })
  },

  // --- 详情与评论逻辑 ---
  openDetailModal(e) {
    const id = e.currentTarget.dataset.id
    this.setData({
      currentPostId: id,
      showDetailModal: true,
      commentText: '',
      detail: {},
      comments: []
    })
    this.loadDetailData(id)
  },
  closeDetailModal() {
    this.setData({ showDetailModal: false })
  },

  loadDetailData(id) {
    // 获取帖子详情
    db.collection('posts').doc(id).get().then(res => {
      this.setData({ detail: res.data })
    })

    // 获取评论
    db.collection('comments')
      .where({ post_id: id })
      .orderBy('createTime', 'asc')
      .get()
      .then(res => {
        this.setData({ comments: res.data })
      })
  },

  onCommentInput(e) { this.setData({ commentText: e.detail.value }) },

  submitComment() {
    if (!this.data.hasLogin) {
      return wx.showToast({ title: '请先登录', icon: 'none' })
    }
    if (!this.data.commentText) {
      return wx.showToast({ title: '内容不能为空', icon: 'none' })
    }

    wx.showLoading({ title: '发送中...' })
    db.collection('comments').add({
      data: {
        post_id: this.data.currentPostId,
        content: this.data.commentText,
        createTime: db.serverDate(),
        userInfo: this.data.userInfo
      }
    }).then(() => {
      wx.hideLoading()
      this.setData({ commentText: '' })
      this.loadDetailData(this.data.currentPostId) // 刷新评论
      wx.showToast({ title: '评论成功' })
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({ title: '发送失败', icon: 'none' })
      console.error(err)
    })
  }
})