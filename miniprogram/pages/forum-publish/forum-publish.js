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


  async submitPost() {
    const content = this.data.content.trim()
  
    // 1. 先检查内容是否为空（可以提前检查，省一次云函数调用）
    if (!content) {
      return wx.showToast({ title: "内容不能为空", icon: "none" });
    }
  
    try {
      // 2. 等待敏感词检测的结果
      // 注意：这里必须加 await，否则代码不会停下来等结果
      const checkRes = await wx.cloud.callFunction({
        name: 'msgCheck',
        data: { text: content }
      })
  
      const isSafe = checkRes.result // 拿到 true 或 false
  
      // 3. 判断是否安全
      if (!isSafe) {
        // 如果不安全，直接提示并终止函数，不再往下执行
        return wx.showToast({ title: '内容含有违规信息', icon: 'none' })
      }
  
      // 4. 只有 isSafe 为 true 时，才会执行到这里
      console.log('内容安全，开始提交...')
      
      wx.showLoading({ title: "发布中..." });
      
      // 执行发布逻辑
      const postRes = await wx.cloud.callFunction({
        name: 'forum_postData',
        data: { content: content }
      })
  
      wx.hideLoading()
      if (postRes.result.code === 0) {
        wx.showToast({ title: '发布成功', icon: 'success' })
        setTimeout(() => { wx.navigateBack({ delta: 1 }) }, 1500)
      } else {
        wx.showToast({ title: postRes.result.message || '发布失败', icon: 'none' })
      }
  
    } catch (err) {
      // 捕获云函数调用失败的情况（比如网络错误）
      wx.hideLoading()
      console.error('检测或发布失败', err)
      wx.showToast({ title: '系统错误', icon: 'none' })
    }
  }

})
    
        
        
        
