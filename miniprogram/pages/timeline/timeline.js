// pages/timeline/timeline.js
Page({
  data: {
    headerImage: "/images/timeline/2.jpg",
    timelineList: [
      {
        year: "1912",
        title: "生于江苏太仓",
        image: "",
        description: "1912年5月31日，吴健雄出生于江苏省太仓县浏河镇的书香门第。父亲吴仲裔提倡男女平等，创办明德学校，为她后来的求学之路奠定了开明基础。"
      },
      {
        year: "1923",
        title: "离家求学",
        image: "",
        description: "11岁的吴健雄离开家乡太仓，前往苏州第二女子师范学校学习。这是她独立求学生涯的开端，在校期间成绩优异，培养了严谨的治学态度。"
      },
      {
        year: "1930",
        title: "进入中央大学",
        image: "/images/timeline/3.jpg",
        description: "吴健雄考入国立中央大学（现南京大学）数学系，后转物理系。师从施士元等教授，在物理学领域展露卓越才华。"
      },
      {
        year: "1934",
        title: "大学毕业",
        image: "/images/timeline/5.jpg",
        description: "吴健雄毕业于国立中央大学物理系。毕业后先后在浙江大学任物理系助教，后进入中央研究院物理研究所工作，开始了她的科研生涯。"
      },
      {
        year: "1936",
        title: "远渡重洋赴美留学",
        image: "/images/timeline/6.jpg",
        description: "吴健雄离开中国前往美国加州大学伯克利分校深造，师从物理学巨匠欧内斯特·劳伦斯和塞格雷，开启核物理研究生涯。"
      },
      {
        year: "1944",
        title: "参与曼哈顿计划",
        image: "",
        description: "吴健雄以外国籍科学家身份加入哥伦比亚大学战时研究部门，参与曼哈顿计划，致力于解决核反应堆链式反应的关键问题，为原子弹研制做出重要贡献。"
      },
      {
        year: "1945",
        title: "登上时代周刊",
        image: "/images/timeline/1.jpg",
        description: "1945年，吴健雄登上美国《时代》周刊封面，成为该刊封面人物。作为曼哈顿计划中唯一的华裔女科学家，她在核物理领域的突破性贡献被全球瞩目，被誉为'解锁原子时代的女性先驱'。《时代》周刊以'CHIEN-SHIUNG WU (1945)'为题，记录了她对物理学及二战进程的深远影响。"
      },
      {
        year: "1950",
        title: "β衰变领域权威",
        image: "",
        description: "20世纪50年代，吴健雄在哥伦比亚大学进行一系列精确的β衰变实验，成为该领域的世界级权威。她以极高的实验精度和创新能力，为弱相互作用研究奠定了坚实基础。"
      },
      {
        year: "1957",
        title: "宇称不守恒实验验证",
        image: "/images/timeline/4.jpg",
        description: "1957年，吴健雄通过精密的β衰变实验，验证了宇称不守恒理论。实验示意图展示了钻-60核在镜面反射前后β射线的传播方向变化，这一颠覆性发现彻底改写了物理学基本定律，帮助李政道和杨振宁获得诺贝尔奖。吴健雄虽未获奖，但被公认为'核物理女王'。"
      },
      {
        year: "1958",
        title: "获普林斯顿大学名誉博士",
        image: "",
        description: "1958年，吴健雄获得普林斯顿大学名誉博士学位，成为普林斯顿大学历史上第一位获得名誉博士学位的女性。同年，她还当选为美国国家科学院院士，这是美国科学界的最高荣誉之一。"
      },
      {
        year: "1963",
        title: "验证费曼-盖尔曼理论",
        image: "",
        description: "1963年，吴健雄完成另一项里程碑实验——矢量流守恒假说的精确验证，进一步巩固了她作为实验物理学大师的地位。这一成果对粒子物理学的发展产生了深远影响。"
      },
      {
        year: "1973",
        title: "首次回中国大陆",
        image: "",
        description: "1973年，61岁的吴健雄与丈夫袁家骝一起回国访问，受到周恩来总理亲切接见。这是她离开祖国37年后首次归来，此后她多次回国讲学，推动中美科学交流。"
      },
      {
        year: "1975",
        title: "担任美国物理学会会长",
        image: "/images/timeline/7.jpg",
        description: "吴健雄当选美国物理学会会长，成为该学会首位女性会长。同年获得美国国家科学勋章，这是美国科学界最高荣誉。"
      },
      {
        year: "1978",
        title: "获沃尔夫物理学奖",
        image: "",
        description: "1978年，吴健雄获得首届沃尔夫物理学奖。该奖项通常被视为诺贝尔奖的风向标，表彰她在宇称不守恒等方面的开创性实验成就，进一步确立了她在物理学史上的崇高地位。"
      },
      {
        year: "1990",
        title: "担任中国科学院院士",
        image: "",
        description: "吴健雄被授予中国科学院外籍院士称号，国际编号2752号小行星被命名为'吴健雄星'，以表彰其卓越科学成就。"
      },
      {
        year: "1997",
        title: "逝世与永恒铭记",
        image: "",
        description: "1997年2月16日，吴健雄在纽约病逝，享年84岁。遵照遗愿，骨灰归葬家乡太仓，墓园设计灵感来自她的物理实验。她留下的科学精神与家国情怀长存。"
      }
    ],
    showModal: false,
    currentEvent: {
      year: '',
      title: '',
      description: '',
      image: ''
    },
    pageScrollLock: false
  },

  onTapEvent: function(e) {
    const eventData = e.currentTarget.dataset.event;
    
    // 保存当前滚动位置并禁止页面滚动
    const query = wx.createSelectorQuery();
    query.selectViewport().scrollOffset();
    query.exec((res) => {
      if (res && res[0]) {
        this.setData({
          showModal: true,
          currentEvent: eventData,
          pageScrollLock: true,
          scrollTop: res[0].scrollTop
        });
      } else {
        this.setData({
          showModal: true,
          currentEvent: eventData,
          pageScrollLock: true,
          scrollTop: 0
        });
      }
    });
  },

  onCloseModal: function() {
    const savedScrollTop = this.data.scrollTop;
    
    this.setData({
      showModal: false,
      pageScrollLock: false
    });
    
    // 等待弹窗关闭动画完成后再恢复滚动位置
    setTimeout(() => {
      if (savedScrollTop > 0) {
        wx.pageScrollTo({
          scrollTop: savedScrollTop,
          duration: 0
        });
      }
    }, 100);
  },

  onImageError: function(e) {
    console.log('❌ 图片加载失败:', e.currentTarget.dataset.src);
  },

  onLoad: function(options) {
    console.log("时间线页面加载");
  },

  // 阻止背景滚动
  preventTouchMove: function(e) {
    if (this.data.showModal) {
      return false;
    }
  },

  stopPropagation: function(e) {
    return;
  }
})