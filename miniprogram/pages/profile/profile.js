const db = wx.cloud.database()

Page({

  data: {
    // 用户信息
    userInfo: null,

    // 我的精选帖子
    myNotes: [],

    // 我的论坛帖子
    myForumPosts: [],

    // 当前 tab
    activeTab: 'notes',

    // 加载状态
    loading: true
  },

  // 页面加载
  onLoad() {
    this.loadAll()
  },

  // 页面显示
  onShow() {
    this.loadAll()
  },

  // 加载数据
  async loadAll() {

    this.setData({
      loading: true
    })

    wx.showLoading({
      title: '加载中...'
    })

    try {
      // 优先使用全局 userInfo
      const app = getApp()
      let userInfo = app.globalData.userInfo

      // 如果没有全局 userInfo，从数据库获取
      if (!userInfo) {
        const userRes = await db.collection('users')
          .limit(1)
          .get()
          .catch(err => {
            console.error('查询用户失败:', err)
            return { data: [] }
          })

        if (userRes.data.length > 0) {
          userInfo = userRes.data[0]
        } else {
          // 如果没有用户，创建一个默认用户
          const newUser = {
            nickname: '新用户',
            avatar: '/images/default-avatar.png',
            bio: '这个人很懒，还没有简介',
            score: 0,
            createTime: db.serverDate()
          }

          try {
            const addRes = await db.collection('users')
              .add({
                data: newUser
              })

            userInfo = {
              ...newUser,
              _id: addRes._id
            }
          } catch (err) {
            console.error('创建用户失败:', err)
            userInfo = {
              ...newUser,
              _id: 'temp_' + Date.now()
            }
          }
        }
      }

      // 获取用户的帖子和论坛数据
      let notesRes = { data: [] }
      let forumRes = { data: [] }

      // 查询精选帖子
      try {
        notesRes = await db.collection('notes')
          .where({
            userId: userInfo._id
          })
          .orderBy('createTime', 'desc')
          .get()
          .catch(err => {
            console.warn('查询精选帖子失败:', err)
            return { data: [] }
          })
      } catch (err) {
        console.warn('精选帖子查询异常:', err)
        notesRes = { data: [] }
      }

      // 查询论坛帖子
      try {
        forumRes = await db.collection('forum')
          .where({
            userId: userInfo._id
          })
          .orderBy('createTime', 'desc')
          .get()
          .catch(err => {
            console.warn('查询论坛帖子失败:', err)
            return { data: [] }
          })
      } catch (err) {
        console.warn('论坛帖子查询异常:', err)
        forumRes = { data: [] }
      }

      console.log('用户信息:', userInfo)
      console.log('精选帖子:', notesRes.data)
      console.log('论坛帖子:', forumRes.data)

      // 更新页面
      this.setData({
        userInfo,
        myNotes: notesRes.data || [],
        myForumPosts: forumRes.data || [],
        loading: false
      })

      // 保存全局
      app.globalData.userInfo = userInfo

      wx.hideLoading()

    } catch (err) {

      console.error('加载数据失败:', err)

      this.setData({
        loading: false,
        // 使用默认用户信息
        userInfo: {
          _id: 'temp_user',
          nickname: '用户',
          avatar: '/images/default-avatar.png',
          bio: '加载失败，请返回重试',
          score: 0
        },
        myNotes: [],
        myForumPosts: []
      })

      wx.hideLoading()

      wx.showToast({
        title: '加载失败，请返回重试',
        icon: 'none'
      })
    }
  },

  // 切换 tab
  switchTab(e) {

    this.setData({
      activeTab: e.currentTarget.dataset.tab
    })
  },

  // 跳转精选帖子
  goToNote(e) {

    const item = e.currentTarget.dataset.item

    const app = getApp()

    app.globalData.targetNote = item

    wx.switchTab({
      url: '/pages/home/home'
    })
  },

  // 跳转论坛帖子
  goToForum(e) {

    const item = e.currentTarget.dataset.item

    const app = getApp()

    app.globalData.targetPost = item

    wx.switchTab({
      url: '/pages/forum/forum'
    })
  },

  // 编辑资料
  goEditProfile() {

    wx.navigateTo({
      url: '/pages/profile-edit/profile-edit'
    })
  }
})