// pages/forum-detail/forum-detail.js
Page({
  data: {
    post: {},
    replies: []
  },

  onLoad(options) {
    const postId = options.id // 或者 options.id，看你列表页传参用的哪个字段名
    if (!postId) return

    wx.showLoading({ title: '加载中...' })

    // 直接调用云函数获取处理好的数据
    wx.cloud.callFunction({
      name: 'forum_getDetail',
      data: { postId: postId }
    }).then(res => {
      wx.hideLoading()
      if (res.result.code === 0) {
        this.setData({
          post: res.result.data.post,
          replies: res.result.data.replies
        })
      } else {
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error(err)
      wx.showToast({ title: '网络错误', icon: 'none' })
    })
  }
})