App({
  globalData: {
    userInfo: null,
    hasUserInfo: false,
    openid: '',
    envId: 'cloud1-d9gtolotcc12e3953'
  },

  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'cloud1-d9gtolotcc12e3953',
        traceUser: true
      })
    }
    this.getOpenid()
  },

  getOpenid: async function () {
    wx.cloud.callFunction({
      name: 'quickstartFunctions',
      config: { env: this.globalData.envId },
      data: { type: 'getOpenId' }
    }).then(resp => {
      if (resp.result && resp.result.openid) {
        this.globalData.openid = resp.result.openid
        this.getUserInfo()
      } else {
        console.error('获取OpenID失败:', resp)
        this.globalData.hasUserInfo = false
      }
    }).catch(e => {
      console.error('获取OpenID云函数调用失败:', e)
      this.globalData.hasUserInfo = false
    })
  },

  getUserInfo: function () {
    if (!this.globalData.openid) {
      this.globalData.hasUserInfo = false
      return
    }

    const db = wx.cloud.database()
    // 同时查询 openid 或 _openid 字段
    db.collection('users').where(
      db.command.or([
        { openid: this.globalData.openid },
        { _openid: this.globalData.openid }
      ])
    ).get().then(res => {
      if (res.data.length > 0) {
        this.globalData.userInfo = res.data[0]
        this.globalData.hasUserInfo = true
        console.log('用户已存在:', this.globalData.userInfo)
      } else {
        // 新用户，自动创建
        console.log('开始创建新用户，openid:', this.globalData.openid)
        db.collection('users').add({
          data: {
            openid: this.globalData.openid,
            nickname: '微信用户',
            avatar: '/images/default-avatar.png',
            bio: '',
            score: 0,
            createTime: db.serverDate()
          }
        }).then(addRes => {
          console.log('新用户创建成功，ID:', addRes._id)
          db.collection('users').doc(addRes._id).get().then(newUserRes => {
            this.globalData.userInfo = newUserRes.data
            this.globalData.hasUserInfo = true
            console.log('新用户创建成功:', this.globalData.userInfo)
          }).catch(err => {
            console.error('加载新用户失败:', err)
            this.globalData.hasUserInfo = false
          })
        }).catch(err => {
          console.error('创建用户失败:', err)
          this.globalData.hasUserInfo = false
        })
      }
    }).catch(err => {
      console.error('查询用户失败:', err)
      this.globalData.hasUserInfo = false
    })
  }
})
