const db = wx.cloud.database()

Page({

  data: {
    userInfo: null,

    nickname: '',

    avatar: '',

    bio: ''
  },

  // 页面加载
  onLoad() {
    this.loadUserInfo()
  },

  // 加载用户信息
  loadUserInfo() {
    wx.showLoading({
      title: '加载中'
    })

    const db = wx.cloud.database()

    // 方案1：如果之前已经有全局的 userInfo，直接使用
    const app = getApp()
    if (app.globalData && app.globalData.userInfo && app.globalData.userInfo._id) {
      wx.hideLoading()
      const userInfo = app.globalData.userInfo
      this.setData({
        userInfo: userInfo,
        nickname: userInfo.nickname || '',
        avatar: userInfo.avatar || '/images/default-avatar.png',
        bio: userInfo.bio || ''
      })
      return
    }

    // 方案2：查询users集合中的第一条记录（假设用户只有一条记录）
    db.collection('users')
      .limit(1)
      .get()
      .then(res => {
        wx.hideLoading()

        if (res.data.length > 0) {
          const userInfo = res.data[0]
          this.setData({
            userInfo: userInfo,
            nickname: userInfo.nickname || '',
            avatar: userInfo.avatar || '/images/default-avatar.png',
            bio: userInfo.bio || ''
          })
          
          // 更新全局变量
          app.globalData.userInfo = userInfo
        } else {
          // 创建新用户
          this.createNewUser()
        }
      })
      .catch(err => {
        wx.hideLoading()
        console.error('查询用户失败:', err)
        
        // 即使失败也允许用户编辑
        this.setData({
          userInfo: {
            _id: 'temp_' + Date.now(),
            nickname: '',
            avatar: '/images/default-avatar.png',
            bio: ''
          },
          nickname: '',
          avatar: '/images/default-avatar.png',
          bio: ''
        })

        wx.showToast({
          title: '提示：使用临时用户编辑',
          icon: 'none'
        })
      })
  },

  // 创建新用户
  createNewUser() {
    const db = wx.cloud.database()

    db.collection('users')
      .add({
        data: {
          nickname: '',
          avatar: '',
          bio: '',
          createTime: db.serverDate()
        }
      })
      .then(res => {
        const userInfo = {
          _id: res._id,
          nickname: '',
          avatar: '',
          bio: '',
          createTime: db.serverDate()
        }

        this.setData({
          userInfo: userInfo,
          nickname: '',
          avatar: '/images/default-avatar.png',
          bio: ''
        })

        // 更新全局变量
        const app = getApp()
        app.globalData.userInfo = userInfo

        wx.showToast({
          title: '新用户已创建',
          icon: 'success'
        })
      })
      .catch(err => {
        console.error('创建用户失败:', err)
        wx.showToast({
          title: '创建用户失败：' + err.errMsg,
          icon: 'none'
        })
      })
  },

  // 输入昵称
  onNicknameInput(e) {

    this.setData({
      nickname: e.detail.value
    })
  },

  // 输入简介
  onBioInput(e) {

    this.setData({
      bio: e.detail.value
    })
  },

  // 选择头像
  chooseAvatar() {

    wx.chooseMedia({
      count: 1,

      mediaType: ['image'],

      success: res => {

        // 用户取消
        if (!res.tempFiles.length) {
          return
        }

        const filePath =
          res.tempFiles[0].tempFilePath

        wx.showLoading({
          title: '上传中'
        })

        // 云路径
        const cloudPath =
          'avatars/' +
          Date.now() +
          '-' +
          Math.floor(Math.random() * 10000) +
          '.png'

        // 上传文件
        wx.cloud.uploadFile({

          cloudPath,

          filePath,

          success: uploadRes => {

            this.setData({
              avatar: uploadRes.fileID
            })

            wx.hideLoading()

            wx.showToast({
              title: '上传成功'
            })
          },

          fail: err => {

            console.error(err)

            wx.hideLoading()

            wx.showToast({
              title: '上传失败',
              icon: 'none'
            })
          }
        })
      },

      fail: err => {

        console.error(err)
      }
    })
  },

  // 保存资料
  saveProfile() {

    const {
      userInfo,
      nickname,
      avatar,
      bio
    } = this.data

    // 昵称不能为空
    if (!nickname || !nickname.trim()) {

      wx.showToast({
        title: '昵称不能为空',
        icon: 'none'
      })

      return
    }

    // 昵称长度限制
    if (nickname.trim().length > 20) {
      wx.showToast({
        title: '昵称不超过20个字符',
        icon: 'none'
      })
      return
    }

    // 简介长度限制
    if (bio && bio.length > 100) {
      wx.showToast({
        title: '简介不超过100个字符',
        icon: 'none'
      })
      return
    }

    // 没有 userInfo
    if (!userInfo) {
      wx.showToast({
        title: '用户信息未加载',
        icon: 'none'
      })
      return
    }

    if (!userInfo._id) {
      wx.showToast({
        title: '用户ID异常，请返回重试',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '保存中'
    })

    db.collection('users')

      .doc(userInfo._id)

      .update({

        data: {
          nickname: nickname.trim(),
          avatar,
          bio: bio || '',
          updateTime: db.serverDate()
        }
      })

      .then(() => {

        wx.hideLoading()

        wx.showToast({
          title: '保存成功'
        })

        // 更新全局
        const app = getApp()

        app.globalData.userInfo = {
          ...userInfo,

          nickname: nickname.trim(),

          avatar,

          bio: bio || ''
        }

        // 返回上一页
        setTimeout(() => {

          wx.navigateBack()

        }, 800)
      })

      .catch(err => {

        console.error(err)

        wx.hideLoading()

        wx.showToast({
          title: '保存失败: ' + (err.message || '未知错误'),
          icon: 'none'
        })
      })
  }
})