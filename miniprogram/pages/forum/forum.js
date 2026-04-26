const db = wx.cloud.database();
const coll = db.collection("forum");

Page({
  data: {
    postContent: "",
    replyContent: "",
    postList: [],
    showReplyModal: false,
    currentReplyPostId: ""
  },

  onLoad() {
    this.getPostList();
  },

  async getPostList() {
    try {
      let res = await coll.orderBy("createTime", "desc").get();
      let list = res.data.map(item => {
        return {
          ...item,
          // 把时间对象变成正常字符串！！！
          createTime: item.createTime ? new Date(item.createTime).toLocaleString() : ""
        };
      });
      this.setData({ postList: list });
    } catch (err) {
      console.error("加载失败", err);
    }
  },

  onPostInput(e) {
    this.setData({ postContent: e.detail.value });
  },

  async submitPost() {
    let content = this.data.postContent.trim();
    if (!content) {
      wx.showToast({ title: "内容不能为空", icon: "none" });
      return;
    }

    try {
      await coll.add({
        data: {
          author: "用户",
          content: content,
          createTime: db.serverDate(),
          replies: []
        }
      });

      wx.showToast({ title: "发布成功" });
      this.setData({ postContent: "" });
      this.getPostList();
    } catch (err) {
      console.error("发布失败", err);
      wx.showToast({ title: "发布失败", icon: "none" });
    }
  },

  openReplyModal(e) {
    this.setData({
      showReplyModal: true,
      currentReplyPostId: e.currentTarget.dataset.postid,
      replyContent: ""
    });
  },

  closeReplyModal() {
    this.setData({ showReplyModal: false });
  },

  onReplyInput(e) {
    this.setData({ replyContent: e.detail.value });
  },

  async submitReply() {
    let content = this.data.replyContent.trim();
    let postId = this.data.currentReplyPostId;

    if (!content) {
      wx.showToast({ title: "回复不能为空", icon: "none" });
      return;
    }

    try {
      let res = await coll.doc(postId).get();
      let replies = res.data.replies || [];
      replies.push({
        author: "用户",
        content: content
      });

      await coll.doc(postId).update({
        data: { replies }
      });

      wx.showToast({ title: "回复成功" });
      this.setData({ showReplyModal: false });
      this.getPostList();
    } catch (err) {
      console.error("回复失败", err);
      wx.showToast({ title: "回复失败", icon: "none" });
    }
  }
});