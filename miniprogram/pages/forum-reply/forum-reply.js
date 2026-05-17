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
      // 2. 直接调用你写好的 addReply 云函数
      const res = await wx.cloud.callFunction({
        name: 'forum_postReply',
        data: {
          postId: postId,
          content: content
        }
      });
          

      wx.hideLoading();

      // 3. 根据云函数返回的结果做提示
      if (res.result && res.result.success) {
        wx.showToast({ title: "回复成功", icon: "success" });
        // 延迟返回上一页（通常是帖子详情页，详情页刷新后就能看到你刚发的回复了）
        setTimeout(() => wx.navigateBack({ delta: 1 }), 1500);
      } else {
        wx.showToast({ title: res.result.msg || "回复失败", icon: "none" });
      }
      
    } catch (err) {
      wx.hideLoading();
      console.error("回复失败", err);
      wx.showToast({ title: "网络异常，请重试", icon: "none" });
    }
  },

  goBack(){
    wx.navigateBack()
  }
})