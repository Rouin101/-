// pages/timeline/timeline.js
Page({
  data: {
    activeIndex: -1, // 用于记录当前被点击的索引，-1 表示没有选中任何项
    timelineData: [
      { year: '1912', side: 'left', content: '出生于江苏太仓，祖籍江苏太仓。', showDetail: false },
      { year: '1934', side: 'right', content: '毕业于国立中央大学物理系，获学士学位。', showDetail: false },
      { year: '1936', side: 'left', content: '赴美留学，进入加州大学伯克利分校学习。', showDetail: false },
      { year: '1940', side: 'right', content: '获得物理学博士学位，并在史密斯学院任教。', showDetail: false },
      { year: '1944', side: 'left', content: '参与“曼哈顿计划”，解决原子弹连锁反应难题。', showDetail: false },
      { year: '1957', side: 'right', content: '通过实验证实了弱相互作用中宇称不守恒。', showDetail: false },
      { year: '1958', side: 'left', content: '晋升为哥伦比亚大学教授，当选美国国家科学院院士。', showDetail: false },
      { year: '1975', side: 'right', content: '当选美国物理学会首位女性会长，获国家科学勋章。', showDetail: false },
      { year: '1990', side: 'left', content: '国际编号2752号小行星被命名为“吴健雄星”。', showDetail: false },
      { year: '1997', side: 'right', content: '在纽约病逝，享年85岁，骨灰安葬于故乡太仓。', showDetail: false }
    ]
  },

  // 点击事件处理
  toggleDetail: function(e) {
    const index = e.currentTarget.dataset.index;
    const currentActive = this.data.activeIndex;

    // 如果点击的是已经打开的，就关闭（恢复时间轴状态）
    if (currentActive === index) {
      this.setData({
        activeIndex: -1
      });
    } else {
      // 如果点击的是新的，就打开它
      this.setData({
        activeIndex: index
      });
    }
  }
});