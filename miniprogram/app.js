App({
  globalData: {
    userInfo: null,
    hasUserInfo: false,
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
      
      if (resp.result && resp.result._openid) {
        const user_openid = resp.result._openid
        this.getUserInfo(user_openid)
      
      } else {
        console.error('获取OpenID失败:', resp)
        this.globalData.hasUserInfo = false
      }
    }).catch(e => {
      console.error('获取OpenID云函数调用失败:', e)
      this.globalData.hasUserInfo = false
    })
  },

  getUserInfo: function (current_openid) {
    if (!current_openid) {
      this.globalData.hasUserInfo = false
      return
    }

    const db = wx.cloud.database()
    
    db.collection('users').where(
      { _openid: current_openid }
    ).get().then(res => {
      if (res.data.length > 0) {
        //老用户查记录直接登录
        this.globalData.userInfo = res.data[0]
        this.globalData.hasUserInfo = true
        console.log("老用户登录成功")
      } else {
        // 新用户，手动创建数据，异步存储
        const newUserInfo = {
          
          nickname: '微信用户',
          avatar: '/images/default-avatar.png',
          bio: '这个人很懒，还没有简介',
          createTime: db.serverDate() 
        }
        
        db.collection('users').add({
          data: newUserInfo
        }).then(addRes => {
          console.log("新用户创建成功")
        }).catch(err => {
          console.error('加载新用户失败:', err)
          this.globalData.hasUserInfo = false
        })

        //无论数据库写入是否完成，先带着数据进入
        this.globalData.userInfo = newUserInfo
        this.globalData.hasUserInfo = true
      }
    console.log(this.globalData) 

    }).catch(err => {
      console.error('查询用户失败:', err)
      this.globalData.hasUserInfo = false
    })
  }
})
    
  
        
        
        
        
        
        
        
        
        
        
          
           
          
      
      
            
            
          
