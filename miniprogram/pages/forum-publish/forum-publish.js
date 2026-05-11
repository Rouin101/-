const db = wx.cloud.database();
const coll = db.collection("forum");

Page({
  data: {
    title: "",
    content: ""
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({ delta: 1 })
  },

  // 接收标题输入
  onTitleInput(e) {
    this.setData({ title: e.detail.value })
  },

  // 接收内容输入
  onContentInput(e) {
    this.setData({ content: e.detail.value })
  },

  // 提交发布
  async submitPost() {
    let { title, content } = this.data;
    content = content.trim();
    
    if (!content) {
      return wx.showToast({ title: "内容不能为空", icon: "none" });
    }

    wx.showLoading({ title: "发布中..." });

    try {
      await coll.add({
        data: {
          title: title.trim(), // 如果没填标题就是空字符串
          author: "用户", // 后续可以换成真实的用户信息
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