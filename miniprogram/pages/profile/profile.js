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

  onShow() {
    this.loadAll()
  },

  async loadAll() {
    this.setData({ loading: true })
    wx.showLoading({ title: '加载中...' })

    try {
      const app = getApp()
      let userInfo = app.globalData.userInfo
      const currentOpenid = app.globalData.openid

      if (!userInfo) {
        const userRes = await db.collection('users').limit(1).get().catch(err => {
          console.error('查询用户失败:', err)
          return { data: [] }
        })

        if (userRes.data.length > 0) {
          userInfo = userRes.data[0]
        } else {
          const newUser = {
            nickname: '新用户',
            avatar: '/images/default-avatar.png',
            bio: '这个人很懒，还没有简介',
            score: 0,
            createTime: db.serverDate()
          }
          try {
            const addRes = await db.collection('users').add({ data: newUser })
            userInfo = { ...newUser, _id: addRes._id }
          } catch (err) {
            console.error('创建用户失败:', err)
            userInfo = { ...newUser, _id: 'temp_' + Date.now() }
          }
        }
      }

      // 计算答题排名
      try {
        const scoresRes = await db.collection('scores').orderBy('score', 'desc').get()
        const scoreList = scoresRes.data || []
        let userRank = '未排名'
        for (let i = 0; i < scoreList.length; i++) {
          if (scoreList[i]._openid === currentOpenid || scoreList[i].openid === currentOpenid) {
            userRank = i + 1
            break
          }
        }
        userInfo.rank = userRank
      } catch (err) {
        console.warn('查询排名失败:', err)
        userInfo.rank = '未排名'
      }

      app.globalData.userInfo = userInfo

      let notesRes = { data: [] }
      let forumRes = { data: [] }

      try {
        notesRes = await db.collection('notes')
          .where({ openid: currentOpenid })
          .orderBy('createTime', 'desc')
          .get()
          .catch(err => {
            console.warn('查询精选帖子失败:', err)
            return { data: [] }
          })
        console.log('查询条件 - openid:', currentOpenid)
        console.log('查询结果 - 精选帖子:', notesRes.data)
      } catch (err) {
        console.warn('精选帖子查询异常:', err)
        notesRes = { data: [] }
      }

      try {
        forumRes = await db.collection('forum')
          .where({ openid: currentOpenid })
          .orderBy('createTime', 'desc')
          .get()
          .catch(err => {
            console.warn('查询论坛帖子失败:', err)
            return { data: [] }
          })
        console.log('查询结果 - 论坛帖子:', forumRes.data)
      } catch (err) {
        console.warn('论坛帖子查询异常:', err)
        forumRes = { data: [] }
      }

      console.log('用户信息:', userInfo)
      console.log('精选帖子数:', notesRes.data.length)
      console.log('论坛帖子数:', forumRes.data.length)

      this.setData({
        userInfo,
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
    const app = getApp()
    app.globalData.targetNote = e.currentTarget.dataset.item
    wx.switchTab({ url: '/pages/home/home' })
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