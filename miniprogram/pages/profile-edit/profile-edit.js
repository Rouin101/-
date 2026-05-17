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
      if (app.globalData.userInfo && app.globalData.hasUserInfo) {
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
    if (!userInfo) {
      wx.showToast({ title: '用户信息未加载，请稍后重试', icon: 'none' })
      return
    }

    wx.showLoading({ title: '保存中' })

    // 调用云函数进行更新
    wx.cloud.callFunction({
      name: 'profile_edit',
      data: {
        nickname: nickname.trim(),
        avatar: avatar || '',
        bio: bio || ''
      }
    }).then(res => {
      wx.hideLoading()
      const result = res.result
      console.log(result)
      if (result.code === 200) {
          wx.showToast({ title: '保存成功', icon: 'success' 
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
        
        wx.hideLoading()
        wx.showToast({ title: '未找到用户数据', icon: 'none' })
      }
          
    }).catch(err => {
      console.error('查询用户数据库失败:', err)
      wx.hideLoading()
      wx.showToast({ title: '保存失败: 查询失败', icon: 'none' })
    })
  }


})

          
          
          
        
         
        

    
