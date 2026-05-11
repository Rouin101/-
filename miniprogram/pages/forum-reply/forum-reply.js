const db = wx.cloud.database();
const coll = db.collection("forum");

Page({
  data: { postId: "", author: "", replyContent: "" },

  onLoad(options) {
    // 接收上个页面传过来的帖子ID和作者名
    this.setData({
      postId: options.postId,
      author: options.author
    })
  },

  onInput(e) { this.setData({ replyContent: e.detail.value }) },

  async submitReply() {
    let content = this.data.replyContent.trim();
    let postId = this.data.postId;
    if (!content) return wx.showToast({ title: "回复不能为空", icon: "none" });

    const app = getApp()
    const userInfo = app.globalData.userInfo

    try {
      let res = await coll.doc(postId).get();
      let replies = res.data.replies || [];
      replies.push({
        avatar: userInfo.avatar,
        author: userInfo.nickname, 
        content: content
      });

      await coll.doc(postId).update({ data: { replies } });
      
      wx.showToast({ title: "回复成功" });
      setTimeout(() => wx.navigateBack({ delta: 1 }), 1500); // 成功后返回帖子详情页/列表页
    } catch (err) {
      console.error("回复失败", err);
    }
  }
})