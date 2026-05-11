const db = wx.cloud.database();
const coll = db.collection("forum");

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
    let { content } = this.data;
    // --- 核心修改：彻底清洗开头和结尾的格式 ---
    // 1. 去掉普通的首尾空格和换行
    content = content.trim();
    // 2. 暴力替换掉所有的“全角空格”（中文空格 \u3000）
    content = content.replace(/　/g, ''); 
    // 3. 再次确保开头没有残留的换行或空白
    content = content.replace(/^[\s\n\u3000]+/, '');
    // --- 核心修改结束 ---
    
    if (!content) {
      return wx.showToast({ title: "内容不能为空", icon: "none" });
    }

    wx.showLoading({ title: "发布中..." });

    const app = getApp()
    const userInfo = app.globalData.userInfo
    try {
      await coll.add({
        data: {
          openid: userInfo.openid,
          avatar: userInfo.avatar,
          author: userInfo.nickname,
          content: content,
          createTime: db.serverDate(),
          replies: []
        }
      });

      wx.hideLoading();
      wx.showToast({ title: "发布成功" });
      
      // 延迟一点返回，让用户看到成功提示
      setTimeout(() => {
        wx.navigateBack({ delta: 1 })
      }, 1500);

    } catch (err) {
      wx.hideLoading();
      console.error("发布失败", err);
      wx.showToast({ title: "发布失败，请重试", icon: "none" });
    }
  }
})