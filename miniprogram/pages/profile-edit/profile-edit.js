const db = wx.cloud.database()

Page({

  data: {
    userInfo: null,
    nickname: '',
    avatar: '',
    bio: ''
  },

  onLoad() {
    wx.showLoading({ title: '加载中' })
    const app = getApp()

    const checkUserInfo = () => {
      if (app.globalData.userInfo && app.globalData.openid && app.globalData.hasUserInfo) {
        wx.hideLoading()
        const userInfo = app.globalData.userInfo
        this.setData({
          userInfo: userInfo,
          nickname: userInfo.nickname || '',
          avatar: userInfo.avatar || '/images/default-avatar.png',
          bio: userInfo.bio || ''
        })
        console.log('用户信息加载成功:', userInfo)
      } else {
        setTimeout(checkUserInfo, 100)
      }
    }
    checkUserInfo()
  },

  
  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value })
  },

  onBioInput(e) {
    this.setData({ bio: e.detail.value })
  },

  chooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: res => {
        if (!res.tempFiles.length) return
        const filePath = res.tempFiles[0].tempFilePath
        wx.showLoading({ title: '上传中' })
        const cloudPath = 'avatars/' + Date.now() + '-' + Math.floor(Math.random() * 10000) + '.png'

        wx.cloud.uploadFile({
          cloudPath,
          filePath,
          success: uploadRes => {
            this.setData({ avatar: uploadRes.fileID })
            wx.hideLoading()
            wx.showToast({ title: '上传成功' })
          },
          fail: err => {
            console.error(err)
            wx.hideLoading()
            wx.showToast({ title: '上传失败', icon: 'none' })
          }
        })
      },
      fail: err => { console.error(err) }
    })
  },

  saveProfile() {
    const { userInfo, nickname, avatar, bio } = this.data
    const app = getApp()

    if (!nickname || !nickname.trim()) {
      wx.showToast({ title: '昵称不能为空', icon: 'none' })
      return
    }
    if (nickname.trim().length > 20) {
      wx.showToast({ title: '昵称不超过20个字符', icon: 'none' })
      return
    }
    if (bio && bio.length > 100) {
      wx.showToast({ title: '简介不超过100个字符', icon: 'none' })
      return
    }
    if (!userInfo || !app.globalData.openid) {
      wx.showToast({ title: '用户信息未加载，请稍后重试', icon: 'none' })
      return
    }

    wx.showLoading({ title: '保存中' })

    // 用 openid（无下划线）查询，小程序端可以正常使用
    db.collection('users').where({
      openid: app.globalData.openid
    }).get().then(res => {
      console.log('查询用户返回:', res.data.length + '条记录')

      if (res.data.length > 0) {
        const userId = res.data[0]._id
        console.log('找到用户，ID:', userId)

        db.collection('users').doc(userId).update({
          data: {
            nickname: nickname.trim(),
            avatar: avatar || '',
            bio: bio || '',
            updateTime: db.serverDate()
          }
        }).then(() => {
          return db.collection("notes").where({
            openid: app.globalData.openid
          }).update({
            data: {
              nickname: nickname.trim(),  // 同步更新笔记里的昵称
              avatarUrl: avatar || '',    // 同步更新笔记里的头像
              updateTime: db.serverDate()
            }
          })
        }).then(() => {
          return db.collection("forum").where({
            openid: app.globalData.openid
          }).update({
            data: {
              author: nickname.trim(),  // 同步更新论坛里的昵称
              avatarUrl: avatar || '',    // 同步更新论坛里的头像
              updateTime: db.serverDate()
            }
          })
        }).then(() => {
          return db.collection("scores").where({
            openid: app.globalData.openid
          }).update({
            data: {
              nickName: nickname.trim(),  // 同步更新scores里的昵称
              avatarUrl: avatar || '',    // 同步更新scores里的头像
              updateTime: db.serverDate()
            }
          })
        }).then(() => {
          
          wx.hideLoading()
          wx.showToast({ title: '保存成功请刷新' })

          // ----------------- 核心清除缓存逻辑 -----------------
          // 1. 获取全局的页面实例（假设排行榜所在的页面路径是 pages/index/index）
          const pages = getCurrentPages()
          const homePage = pages.find(page => page.route === 'pages/quiz/quiz')
          
          // 2. 如果该页面存在，直接清空它的排行榜缓存
          if (homePage) {
            homePage.setData({
              rankCache: null,
              rankCacheTime: 0
            })
            console.log('排行榜缓存已在编辑资料后清除')
          }
          // --------------------------------------------------


          app.globalData.userInfo = {
            ...app.globalData.userInfo,
            nickname: nickname.trim(),
            avatar: avatar || '',
            bio: bio || ''
          }

          
          
          
          
          setTimeout(() => { wx.navigateBack() }, 800)
        }).catch(err => {
          console.error('更新用户失败:', err)
          wx.hideLoading()
          wx.showToast({ title: '保存失败: ' + (err.errMsg || '未知错误'), icon: 'none' })
        })
      } else {
        // 用openid没找到，尝试直接用_id更新
        if (userInfo._id && !userInfo._id.startsWith('temp_')) {
          db.collection('users').doc(userInfo._id).update({
            data: {
              nickname: nickname.trim(),
              avatar: avatar || '',
              bio: bio || '',
              openid: app.globalData.openid,
              updateTime: db.serverDate()
            }
          }).then(() => {
            wx.hideLoading()
            wx.showToast({ title: '保存成功' })
            app.globalData.userInfo = {
              ...app.globalData.userInfo,
              nickname: nickname.trim(),
              avatar: avatar || '',
              bio: bio || ''
            }
            setTimeout(() => { wx.navigateBack() }, 800)
          }).catch(err => {
            wx.hideLoading()
            wx.showToast({ title: '保存失败', icon: 'none' })
            console.error(err)
          })
        } else {
          wx.hideLoading()
          wx.showToast({ title: '未找到用户数据', icon: 'none' })
        }
      }
    }).catch(err => {
      console.error('查询用户数据库失败:', err)
      wx.hideLoading()
      wx.showToast({ title: '保存失败: 查询失败', icon: 'none' })
    })

    
  }
})
