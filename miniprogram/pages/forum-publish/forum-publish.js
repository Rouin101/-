const db = wx.cloud.database();


Page({
  data: {
    
    content: ""
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({ delta: 1 })
  },


  // 接收内容输入
  onContentInput(e) {
    this.setData({ content: e.detail.value })
  },

  // 提交发布
  async submitPost() {
    
    const content = this.data.content.trim()
    if (!content) {
      return wx.showToast({ title: "内容不能为空", icon: "none" });
    }

    wx.showLoading({ title: "发布中..." });

    
    wx.cloud.callFunction({
      name: 'forum_postData',
      data: {
        
        content: content,
      }
        
        
        
    }).then(res => {
      wx.hideLoading()
      if (res.result.code === 0) {
        wx.showToast({ title: '发布成功', icon: 'success' })
        setTimeout(() => { wx.navigateBack({ delta: 1 }) }, 1500)
      } else {
        wx.showToast({ title: res.result.message || '发布失败', icon: 'none' })
      }
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({ title: '系统错误', icon: 'none' })
      console.error(err)
    })
  }

})