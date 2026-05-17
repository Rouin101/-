const db = wx.cloud.database();
const coll = db.collection("forum_post");

Page({
  data: {
    
    postList: [],
    
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
    wx.stopPullDownRefresh()
  },
  
  // 获取并格式化帖子列表
  async getPostList() {
    wx.showLoading({ title: '加载中...' })
    
    wx.cloud.callFunction({
      name: 'forum_getData'
    }).then(res => {
      wx.hideLoading()
      if (!res.result.code) {
        // 云函数返回的 data 里，每一条帖子都已经自带了 replies 数组
        this.setData({
          postList: res.result.data
        })
      } else {
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error(err)
    })
    
  },

  // 1. 跳转到发帖页面
  goToPublish() {
    wx.navigateTo({
      url: '/pages/forum-publish/forum-publish' 
    })
  },

  // 2. 跳转到回复页面，并带上帖子ID和作者名
  goToReply(e) {
    const { postid, nickname } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/forum-reply/forum-reply?postId=${postid}&nickname=${nickname}` 
    })
  }
})