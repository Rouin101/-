const db = wx.cloud.database()
//data
Page({
  data: {
    userInfo: null,
    myNotes: [],
    myForumPosts: [],
    myForumReplies:[],
    activeTab: 'notes',
    forumSubTab:'posts',
    loading: true
  },

  //页面监听
  onLoad() {
    this.loadAll()
  },
 
  
  //刷新
  onPullDownRefresh() {
    console.log('用户触发了下拉刷新')
    // 1. 重新调用加载数据的函数
    this.loadAll()
    wx.stopPullDownRefresh() 
  },
    

  //全局加载主函数
  async loadAll() {
    const app = getApp()
    this.setData({ loading: true })
    wx.showLoading({ title: '加载中...' })
    
    try {
      let userInfo = app.globalData.userInfo
      const currentOpenid = userInfo._openid
      
      //// 计算答题排名
      try {
        const rankRes = await wx.cloud.callFunction({
          name: 'quizFunctions',
          data: { action: 'getMyRank' }
        });
        if (rankRes.result && rankRes.result.success) {
          const { score, rank } = rankRes.result;
          userInfo.score = score || 0;
          // rank 为数字，转成可显示的字符串
          userInfo.rank = rank ? `第${rank}名` : '未上榜';
        } else {
          userInfo.rank = '未排名';
        }
      } catch (err) {
        console.warn('获取排名失败:', err);
        userInfo.rank = '加载失败';
      }
      // 初始化默认值
      let notesRes = { data: [] }
      let forumRes = { data: [] }
      let replyRes = { data: [] }
      
      ////查询三个集合
      try {
        
        // 1. 查询 Notes 
        notesRes = await db.collection('notes')
          .where({ _openid: currentOpenid })
          .orderBy('createTime', 'desc')
          .get()
 
        // 2. 查询 Forum_post (精简版)
        forumRes = await db.collection('forum_post')
          .where({ _openid: currentOpenid })
          .orderBy('createTime', 'desc')
          .get()
        
        // 3. 查询 Forum_reply
        replyRes = await db.collection('forum_reply')
          .where({ _openid: currentOpenid })
          .orderBy('createTime', 'desc')
          .get()

        } catch (err) {
          // 统一在这里捕获错误
          console.warn('数据查询失败:', err)
          // 如果出错，保持上面初始化的空数组即可
          notesRes = { data: [] }
          forumRes = { data: [] }
          replyRes = { data: [] }
        }
       
        this.setData({
          userInfo:userInfo,
          myNotes: notesRes.data || [],
          myForumPosts: forumRes.data || [],
          myForumReplies: replyRes.data || [],
          loading: false
        })
  
        app.globalData.userInfo = userInfo
        wx.hideLoading()
  
      } catch (err) {
        console.error('加载数据失败:', err)
        this.setData({
          loading: false,
          userInfo: {
            _id: 'temp_user',
            nickname: '用户',
            avatar: '/images/default-avatar.png',
            bio: '加载失败，请返回重试',
            score: 0
          },
          myNotes: [],
          myForumPosts: [],
          myForumReplies:[]
        })
        wx.hideLoading()
        wx.showToast({ title: '加载失败，请返回重试', icon: 'none' })
      }
    },

    // 一级tab切换
    switchTab(e) {
      this.setData({ activeTab: e.currentTarget.dataset.tab })
    },
      
    // 新增：切换论坛二级 Tab
    switchForumSubTab(e) {
      this.setData({ forumSubTab: e.currentTarget.dataset.tab })
    },

    goToNote(e) {
      // 1. 从 dataset 中获取 item 对象
      const item = e.currentTarget.dataset.item
      // 2. 拿到 _id (确保数据库里的字段是 _id)
      const noteId = item._id
      // 3. 跳转到详情页，拼接 id 参数
      wx.navigateTo({
        url: '/pages/home-detail/home-detail?id=' + noteId
      })
    },
  
    goToForum(e) {
      const item = e.currentTarget.dataset.item
      const NoteId = item._id
      wx.navigateTo({url: '/pages/forum-detail/forum-detail?id=' + NoteId})
    },
      
    goEditProfile() {
      wx.navigateTo({ url: '/pages/profile-edit/profile-edit' })
    },
      
    // 删除精选帖子
    deleteNote(e) {
      const id = e.currentTarget.dataset.id;
      wx.showModal({
        title: '提示',
        content: '确定要删除这篇帖子吗？删除后无法恢复。',
        confirmColor: '#ff4d4f', // 确认按钮设为红色，起到警示作用
        success: (res) => {
          if (res.confirm) {
            wx.showLoading({ title: '删除中...' });
            const db = wx.cloud.database();
            // ⚠️ 请替换为你真实的精选帖子集合名
            db.collection('notes').doc(id).remove({
              success: () => {
                wx.hideLoading();
                wx.showToast({ title: '删除成功', icon: 'success' });
                // 删除成功后，重新调用你原本加载数据的方法刷新页面
                this.loadAll(); 
              },
              fail: (err) => {
                wx.hideLoading();
                console.error("删除失败", err);
                wx.showToast({ title: '删除失败，请检查权限', icon: 'none' });
              }
            });
          }
        }
      });
    },
  
    // 删除论坛帖子
    deleteForum(e) {
      const id = e.currentTarget.dataset.id;
      wx.showModal({
        title: '提示',
        content: '确定要删除这条论坛发布吗？',
        confirmColor: '#ff4d4f',
        success: (res) => {
          if (res.confirm) {
            wx.showLoading({ title: '删除中...' });
            const db = wx.cloud.database();
            
            db.collection('forum_post').doc(id).remove({
              success: () => {
                wx.hideLoading();
                wx.showToast({ title: '删除成功', icon: 'success' });
                // 删除成功后，重新调用你原本加载数据的方法刷新页面
                this.loadAll();
              },
              fail: (err) => {
                wx.hideLoading();
                console.error("删除失败", err);
                wx.showToast({ title: '删除失败，请检查权限', icon: 'none' });
              }
            });
          }
        }
      });
    },
    
    deleteReply(e){
      const id = e.currentTarget.dataset.id;
      wx.showModal({
        title: '提示',
        content: '确定要删除这条回复吗？',
        confirmColor: '#ff4d4f',
        success: (res) => {
          if (res.confirm) {
            wx.showLoading({ title: '删除中...' });
            const db = wx.cloud.database();
            
            db.collection('forum_reply').doc(id).remove({
              success: () => {
                wx.hideLoading();
                wx.showToast({ title: '删除成功', icon: 'success' });
                // 删除成功后，重新调用你原本加载数据的方法刷新页面
                this.loadAll();
              },
              fail: (err) => {
                wx.hideLoading();
                console.error("删除失败", err);
                wx.showToast({ title: '删除失败，请检查权限', icon: 'none' });
              }
            });
          }
        }
      });
    },

    async replygoToForum(e){
      const item = e.currentTarget.dataset.item
      const Id = item._id
      const db = wx.cloud.database();
      const res = await db.collection('forum_reply').doc(Id).get()
      const NoteId = res.data.postId
      wx.navigateTo({url: '/pages/forum-detail/forum-detail?id=' + NoteId})
    }
    
  })
    
    
    
  
  
  
  
  
   
   

         


      



