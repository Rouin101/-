const db = wx.cloud.database();
const coll = db.collection("forum");

Page({
  data: {
    postContent: "",
    replyContent: "",
    postList: [],
    showReplyModal: false,
    currentReplyPostId: "",
    replyingToCommentIndex: -1,
    openid: ""
  },

  onLoad() {
    this.getOpenid();
    this.getPostList();
  },

  getOpenid() {
    let that = this;
    wx.cloud.callFunction({
      name: "getOpenid",
      success: res => {
        that.setData({ openid: res.result.openid });
      }
    });
  },

  async getPostList() {
    try {
      let res = await coll.orderBy("createTime", "desc").get();
      let list = res.data.map(item => ({
        ...item,
        createTime: item.createTime ? new Date(item.createTime).toLocaleString() : "",
        replies: item.replies || []
      }));
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
          replies: [],
          _openid: this.data.openid
        }
      });
      wx.showToast({ title: "发布成功" });
      this.setData({ postContent: "" });
      this.getPostList();
    } catch (err) {
      wx.showToast({ title: "发布失败", icon: "none" });
    }
  },

  openReplyModal(e) {
    this.setData({
      showReplyModal: true,
      currentReplyPostId: e.currentTarget.dataset.postid,
      replyingToCommentIndex: -1,
      replyContent: ""
    });
  },

  openReplyToComment(e) {
    this.setData({
      showReplyModal: true,
      currentReplyPostId: e.currentTarget.dataset.postid,
      replyingToCommentIndex: e.currentTarget.dataset.index,
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
    let idx = this.data.replyingToCommentIndex;

    if (!content) {
      wx.showToast({ title: "回复不能为空", icon: "none" });
      return;
    }

    try {
      let newReply;
      if (idx >= 0) {
        const post = this.data.postList.find(p => p._id === postId);
        newReply = {
          author: "用户",
          content: `回复@${post.replies[idx].author}：${content}`
        };
      } else {
        newReply = { author: "用户", content: content };
      }

      let list = this.data.postList;
      let index = list.findIndex(i => i._id === postId);
      if (index !== -1) {
        if (!list[index].replies) list[index].replies = [];
        list[index].replies.push(newReply);
        this.setData({ postList: list });
      }

      await coll.doc(postId).update({
        data: { replies: db.command.push(newReply) }
      });

      wx.showToast({ title: "回复成功" });
      this.setData({ showReplyModal: false });
    } catch (err) {
      console.error(err);
      wx.showToast({ title: "回复失败", icon: "none" });
    }
  },

  // ==========================================
  // ✅ 终极修复：只有自己 + 有openid才能删
  // ==========================================
  async deletePost(e) {
    const id = e.currentTarget.dataset.id;
    const openid = this.data.openid;

    try {
      const doc = await coll.doc(id).get();
      const data = doc.data;

      // 无openid的老帖子 → 禁止删除（最关键）
      if (!data._openid) {
        wx.showToast({ title: "无法删除此帖子", icon: "none" });
        return;
      }

      // 不是自己发的 → 禁止删
      if (data._openid !== openid) {
        wx.showToast({ title: "只能删自己的帖子", icon: "none" });
        return;
      }

      // 是自己发的 → 才能删
      wx.showModal({
        title: "确认删除",
        success: async (res) => {
          if (res.confirm) {
            await coll.doc(id).remove();
            wx.showToast({ title: "删除成功" });
            this.getPostList();
          }
        }
      });

    } catch (err) {
      wx.showToast({ title: "删除失败", icon: "none" });
    }
  }
});

    wx.showModal({
      title: "确认删除",
      success: async (res) => {
        if (res.confirm) {
          try {
            await coll.doc(id).remove();
            wx.showToast({ title: "删除成功" });
            this.getPostList();
          } catch (err) {
            wx.showToast({ title: "删除失败", icon: "none" });
          }
        }
      }
    });
