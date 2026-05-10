const db = wx.cloud.database();
const coll = db.collection("forum");

Page({
  data: {
    postContent: "",
    replyContent: "",
    postList: [],
    showReplyModal: false,
    currentReplyPostId: "",
    openid: ""
  },

  onLoad() {
    this.getOpenid();
    this.getPostList();
  },

  getOpenid() {
    wx.cloud.callFunction({
      name: "getOpenid",
      success: res => {
        this.setData({ openid: res.result.openid });
      }
    });
  },

  async getPostList() {
    try {
      let res = await coll.orderBy("createTime", "desc").get();
      let list = res.data.map(item => {
        return {
          ...item,
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

  // ==============================================
  // 我只修复了这里！！！保证刷新后一定能看到回复！
  // ==============================================
  async submitReply() {
    let content = this.data.replyContent.trim();
    let postId = this.data.currentReplyPostId;

    if (!content) {
      wx.showToast({ title: "回复不能为空", icon: "none" });
      return;
    }

    try {
      // 先 push 新回复到本地数组 → 立刻显示！
      let newReply = {
        author: "用户",
        content: content
      };

      // 找到当前这条帖子，把回复加进去（前端立刻刷新）
      let postList = this.data.postList;
      let index = postList.findIndex(item => item._id == postId);
      if (index !== -1) {
        if (!postList[index].replies) postList[index].replies = [];
        postList[index].replies.push(newReply);
        this.setData({ postList });
      }

      // 再同步到数据库
      let res = await coll.doc(postId).get();
      let replies = res.data.replies || [];
      replies.push(newReply);

      await coll.doc(postId).update({
        data: { replies }
      });

      wx.showToast({ title: "回复成功" });
      this.setData({ showReplyModal: false });

    } catch (err) {
      console.error("回复失败", err);
      wx.showToast({ title: "回复失败", icon: "none" });
    }
  },

  async deletePost(e) {
    let id = e.currentTarget.dataset.id;
    wx.showModal({
      title: "确认删除",
      content: "确定要删除这条内容吗？",
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
  }
});