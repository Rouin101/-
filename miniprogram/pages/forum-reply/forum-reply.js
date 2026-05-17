const db = wx.cloud.database();
const coll = db.collection("forum");

Page({
  data: { postId: "", replyContent: "" },

  onLoad(options) {
    // 接收上个页面传过来的帖子ID和作者名
    this.setData({
      postId: options.postId,
      nickname: options.nickname
    })
  },
      

  onInput(e) { this.setData({ replyContent: e.detail.value }) },

  async submitReply() {
    let content = this.data.replyContent.trim();
    let postId = this.data.postId;
    if (!content) return wx.showToast({ title: "回复不能为空", icon: "none" });

    try {
      // ==========================================
      // 1. 新增：先进行敏感词检测
      // ==========================================
      wx.showLoading({ title: "检测中..." }); // 给用户一个正在检测的反馈
      
      const checkRes = await wx.cloud.callFunction({
        name: 'msgCheck', // 调用你之前写的检测云函数
        data: { text: content }
      });

      // 如果检测不通过，直接拦截
      if (!checkRes.result) {
        wx.hideLoading();
        return wx.showToast({ title: "内容含有违规信息", icon: "none" });
      }

      // ==========================================
      // 2. 检测通过后，再执行原来的提交逻辑
      // ==========================================
      const res = await wx.cloud.callFunction({
        name: 'forum_postReply',
        data: {
          postId: postId,
          content: content
        }
      });

      wx.hideLoading();

      if (res.result && res.result.success) {
        wx.showToast({ title: "回复成功", icon: "success" });
        setTimeout(() => wx.navigateBack({ delta: 1 }), 1500);
      } else {
        wx.showToast({ title: res.result.msg || "回复失败", icon: "none" });
      }

    } catch (err) {
      wx.hideLoading();
      console.error("操作失败", err);
      wx.showToast({ title: "网络异常，请重试", icon: "none" });
    }
  },

  goBack(){
    wx.navigateBack()
  }
})