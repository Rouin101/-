const db = wx.cloud.database();
const coll = db.collection("forum");

Page({
  data: {
    
    postList: []
  },

  onLoad() {
    this.getPostList();
  },

  onShow:function(){
    
    this.getPostList()
  },
  
  onPullDownRefresh() {
    console.log('用户触发了下拉刷新')
    
    // 1. 重新调用加载数据的函数
    this.getPostList()
    
  },
  
  // 获取并格式化帖子列表
  async getPostList() {
    try {
      let res = await coll.orderBy("createTime", "desc").get();
      let list = res.data.map(item => {
        return {
          ...item,
          // 把时间对象变成正常字符串
          createTime: item.createTime ? new Date(item.createTime).toLocaleString() : ""
        };
      });
      this.setData({ postList: list });
    } catch (err) {
      console.error("加载失败", err);
    }
    
  },

  // 1. 跳转到发帖页面
  goToPublish() {
    wx.navigateTo({
      url: '/pages/forum-publish/forum-publish' 
    })
  },

  // 2. 跳转到回复页面，并带上帖子ID和作者名
  goToReply(e) {
    const { postid, author } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/forum-reply/forum-reply?postId=${postid}&author=${author}` // 请确保这里是你回复页面的真实路径
    })
  }
})