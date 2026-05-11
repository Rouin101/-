const db = wx.cloud.database()

Page({

  data: {
    userInfo: null,
    myNotes: [],
    myForumPosts: [],
    activeTab: 'notes',
    loading: true
  },

  onLoad() {
    this.loadAll()
  },

  onPullDownRefresh() {
    console.log('用户触发了下拉刷新')
    
    // 1. 重新调用加载数据的函数
    this.loadAll()
    

  },

  async loadAll() {
    const app = getApp()
    if (!app.globalData.userInfo || !app.globalData.openid) {
      // 1. 保持 loading 状态
      this.setData({ loading: true })
      
      // 2. 提示用户正在初始化（非强制的 toast，不会遮挡页面）
      wx.showToast({
        title: '正在初始化...',
        icon: 'none',
        duration: 2000
      })

      
      return
    }
    
    
    
    this.setData({ loading: true })
    wx.showLoading({ title: '加载中...' })
    wx.stopPullDownRefresh() 
    try {
      
      let userInfo = app.globalData.userInfo
      const currentOpenid = app.globalData.openid

      

      try {
       
        const myScore = userInfo.score || 0
      
        if (myScore > 0) {
          // 2. 核心逻辑：查询 scores 表，统计有多少人的 score 字段大于我的分数
          const countRes = await db.collection('scores')
            .where({
              score: db.command.gt(myScore) // gt = Greater Than (大于)
            })
            .count()
      
          // 3. 计算排名
          userInfo.rank = countRes.total + 1
        } else {
          userInfo.rank = '未上榜'
        }
      
      } catch (err) {
        console.error('查询排名失败', err)
        userInfo.rank = '查询错误'
      }
    

      // 初始化默认值
      let notesRes = { data: [] }
      let forumRes = { data: [] }

      try {
        // 1. 查询 Notes (精简版)
        // 直接使用解构赋值，如果报错则进入 catch
        notesRes = await db.collection('notes')
          .where({ openid: currentOpenid })
          .orderBy('createTime', 'desc')
          .get()

        // 2. 查询 Forum (精简版)
        forumRes = await db.collection('forum')
          .where({ openid: currentOpenid })
          .orderBy('createTime', 'desc')
          .get()

      } catch (err) {
        // 统一在这里捕获错误
        console.warn('数据查询失败:', err)
        // 如果出错，保持上面初始化的空数组即可，或者在这里手动重置
        notesRes = { data: [] }
        forumRes = { data: [] }
      }

      console.log('用户信息:', userInfo)
      console.log('精选帖子数:', notesRes.data.length)
      console.log('论坛帖子数:', forumRes.data.length)

      this.setData({
        userInfo:userInfo,
        myNotes: notesRes.data || [],
        myForumPosts: forumRes.data || [],
        loading: false
      })

      app.globalData.userInfo = userInfo
      wx.hideLoading()

    } catch (err) {
      console.error('加载数据失败:', err)
      this.setData({
        loading: false,
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
      wx.showToast({ title: '加载失败，请返回重试', icon: 'none' })
    }
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab })
  },

  goToNote(e) {
    // 1. 从 dataset 中获取 item 对象
    const item = e.currentTarget.dataset.item
    
    // 2. 拿到 _id (确保数据库里的字段是 _id)
    const noteId = item._id

    // 3. 跳转到详情页，拼接 id 参数
    wx.navigateTo({
      url: '/pages/home-detail/home-detail?id=' + noteId
    })
  },

  goToForum(e) {
    const app = getApp()
    app.globalData.targetPost = e.currentTarget.dataset.item
    wx.switchTab({ url: '/pages/forum/forum' })
  },

  goEditProfile() {
    wx.navigateTo({ url: '/pages/profile-edit/profile-edit' })
  }
})


