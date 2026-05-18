// timeline.js
Page({
  data: {
    timelineData: [],
    currentChapter: 'departure',
    chapterLabelVisible: false,
    chapterLabelText: '',
    chapterLabelSub: '',
    chapterIndicatorOpacity: 0,
    showChapterTransition: false,
    transitionTitle: '',
    transitionQuote: '',
    transitionGradient: '',
    scrollTop: 0,
    isLoading: true,
    parityHintVisible: false,
    parityReversed: false,
    vizData: {
      papers: 100,
      awards: 20,
      nobelNominations: 23,
      students: 50
    },
    showDetail: false,
    detailData: {}
  },

  // 非数据字段
  _particleSystem: null,
  _starSystem: null,
  _dataVizDrawn: false,
  _animationId: null,
  _starAnimationId: null,
  _lastTime: 0,
  _scrollTimer: null,
  _scrollEndTimer: null,
  _gyroData: { x: 0, y: 0 },
  _touchPos: { x: 0.5, y: 0.5 },
  _chapterZones: [],
  _parityCardIndex: -1,
  _rafCanvas: null,
  _loadingTimer: null,
  _intersectionObserver: null,

  _requestAnimationFrame(cb) {
    if (this._rafCanvas && this._rafCanvas.requestAnimationFrame) {
      return this._rafCanvas.requestAnimationFrame(cb);
    }
    return setTimeout(cb, 16);
  },

  _cancelAnimationFrame(id) {
    if (this._rafCanvas && this._rafCanvas.cancelAnimationFrame) {
      this._rafCanvas.cancelAnimationFrame(id);
    } else {
      clearTimeout(id);
    }
  },

  onLoad() {
    this.initTimelineData();
    this.setupChapterZones();
    this._parityCardIndex = this.data.timelineData.findIndex(item => item.year === '1957');
  },

  onReady() {
    const query = wx.createSelectorQuery();
    query.select('#particleCanvas').node().exec((res) => {
      if (res[0]) {
        this._rafCanvas = res[0].node;
        this._initAll();
      } else {
        console.warn('粒子画布初始化失败');
      }
    });
    this._initIntersectionObserver();
  },

  _initAll() {
    try {
      this.initParticleSystemFullscreen();
      this.initStarCanvas();
      this.drawDataVisualization();
      this.startRenderLoop();
      this.initGyroscope();
    } catch (e) {
      console.error('初始化出错：', e);
    }
    this.setData({ isLoading: false });
    this._loadingTimer = setTimeout(() => {
      if (this.data.isLoading) this.setData({ isLoading: false });
    }, 2000);
  },

  onUnload() {
    if (this._animationId) this._cancelAnimationFrame(this._animationId);
    if (this._starAnimationId) this._cancelAnimationFrame(this._starAnimationId);
    if (this._loadingTimer) clearTimeout(this._loadingTimer);
    if (this._scrollTimer) clearTimeout(this._scrollTimer);
    if (this._scrollEndTimer) clearTimeout(this._scrollEndTimer);
    if (this._intersectionObserver) this._intersectionObserver.disconnect();
    if (this._particleSystem) this._particleSystem.destroy();
    wx.stopGyroscope && wx.stopGyroscope();
  },

  // ========== 数据初始化 ==========
  initTimelineData() {
    const rawData = [
      { year: "1912", title: "生于江苏太仓", image: "", description: "1912年5月31日，吴健雄出生于江苏省太仓县浏河镇的书香门第。父亲吴仲裔提倡男女平等，创办明德学校，为她后来的求学之路奠定了开明基础。", chapter: 'departure' },
      { year: "1923", title: "离家求学", image: "", description: "11岁的吴健雄离开家乡太仓，前往苏州第二女子师范学校学习。这是她独立求学生涯的开端，在校期间成绩优异，培养了严谨的治学态度。", chapter: 'departure' },
      { year: "1930", title: "进入中央大学", image: "/images/timeline/3.jpg", description: "吴健雄考入国立中央大学（现南京大学）数学系，后转物理系。师从施士元等教授，在物理学领域展露卓越才华。", chapter: 'departure' },
      { year: "1934", title: "大学毕业", image: "/images/timeline/5.jpg", description: "吴健雄毕业于国立中央大学物理系。毕业后先后在浙江大学任物理系助教，后进入中央研究院物理研究所工作，开始了她的科研生涯。", chapter: 'departure' },
      { year: "1936", title: "远渡重洋赴美留学", image: "/images/timeline/6.jpg", description: "吴健雄离开中国前往美国加州大学伯克利分校深造，师从物理学巨匠欧内斯特·劳伦斯和塞格雷，开启核物理研究生涯。", chapter: 'quest' },
      { year: "1944", title: "参与曼哈顿计划", image: "", description: "吴健雄以外国籍科学家身份加入哥伦比亚大学战时研究部门，参与曼哈顿计划，致力于解决核反应堆链式反应的关键问题，为原子弹研制做出重要贡献。", chapter: 'quest' },
      { year: "1945", title: "战后科学声誉崛起", image: "/images/timeline/1.jpg", description: "二战结束后，吴健雄因曼哈顿计划中的卓越贡献受到学界广泛认可。她以非美国籍身份参与最高机密项目的经历被传为佳话，研究也开始从战时应用转向基础物理探索，为日后β衰变研究奠定基础。", chapter: 'quest' },

      { year: "1950", title: "β衰变领域权威", image: "", description: "20世纪50年代，吴健雄在哥伦比亚大学进行一系列精确的β衰变实验，成为该领域的世界级权威。她以极高的实验精度和创新能力，为弱相互作用研究奠定了坚实基础。", chapter: 'peak' },
      { year: "1957", title: "宇称不守恒实验验证", image: "/images/timeline/4.jpg", description: "1957年，吴健雄通过精密的β衰变实验，验证了宇称不守恒理论。这一颠覆性发现彻底改写了物理学基本定律，帮助李政道和杨振宁获得诺贝尔奖。吴健雄虽未获奖，但被公认为'核物理女王'。", chapter: 'peak' },
      { year: "1958", title: "获普林斯顿大学名誉博士", image: "", description: "1958年，吴健雄获得普林斯顿大学名誉博士学位，成为普林斯顿大学历史上第一位获得名誉博士学位的女性。同年，她还当选为美国国家科学院院士。", chapter: 'peak' },
      { year: "1963", title: "验证费曼-盖尔曼理论", image: "", description: "1963年，吴健雄完成另一项里程碑实验——矢量流守恒假说的精确验证，进一步巩固了她作为实验物理学大师的地位。", chapter: 'peak' },
      { year: "1973", title: "首次回中国大陆", image: "", description: "1973年，61岁的吴健雄与丈夫袁家骝一起回国访问，受到周恩来总理亲切接见。这是她离开祖国37年后首次归来，此后她多次回国讲学，推动中美科学交流。", chapter: 'return' },
      { year: "1975", title: "担任美国物理学会会长", image: "/images/timeline/7.jpg", description: "吴健雄当选美国物理学会会长，成为该学会首位女性会长。同年获得美国国家科学勋章，这是美国科学界最高荣誉。", chapter: 'return' },
      { year: "1978", title: "获沃尔夫物理学奖", image: "", description: "1978年，吴健雄获得首届沃尔夫物理学奖。该奖项通常被视为诺贝尔奖的风向标，表彰她在宇称不守恒等方面的开创性实验成就。", chapter: 'return' },
      { year: "1990", title: "担任中国科学院院士", image: "", description: "吴健雄被授予中国科学院外籍院士称号，国际编号2752号小行星被命名为'吴健雄星'，以表彰其卓越科学成就。", chapter: 'eternity' },
      { year: "1997", title: "逝世与永恒铭记", image: "", description: "1997年2月16日，吴健雄在纽约病逝，享年84岁。遵照遗愿，骨灰归葬家乡太仓，墓园设计灵感来自她的物理实验。她留下的科学精神与家国情怀长存。", chapter: 'eternity' }
    ];

    const timelineData = rawData.map((item) => ({
      ...item,
      _nodeActive: false,
      _visible: false
    }));
    this.setData({ timelineData });
  },

  setupChapterZones() {
    this._chapterZones = [
      { id: 'departure', name: '启程', sub: '1912-1936', startPercent: 0, endPercent: 0.28, gradient: 'linear-gradient(135deg, #1a2a4a, #0d1528)', quote: '从江南水乡到世界舞台' },
      { id: 'quest', name: '求索', sub: '1936-1950', startPercent: 0.28, endPercent: 0.44, gradient: 'linear-gradient(135deg, #1a3a5c, #0d1a30)', quote: '在异国他乡追寻科学之光' },
      { id: 'peak', name: '巅峰', sub: '1950-1975', startPercent: 0.44, endPercent: 0.66, gradient: 'linear-gradient(135deg, #3a1a4a, #1a0d28)', quote: '以实验之剑劈开物理新纪元' },
      { id: 'return', name: '归乡', sub: '1973-1990', startPercent: 0.66, endPercent: 0.85, gradient: 'linear-gradient(135deg, #2a3a2a, #151d15)', quote: '科学无国界，科学家有祖国' },
      { id: 'eternity', name: '永恒', sub: '1997-永远', startPercent: 0.85, endPercent: 1.0, gradient: 'linear-gradient(135deg, #1a1a3a, #0a0a1a)', quote: '化作星辰，照亮后来者的路' }
    ];
  },

  // ========== 全屏粒子系统（优化性能版本） ==========
  initParticleSystemFullscreen() {
    const query = wx.createSelectorQuery();
    query.select('#particleCanvas').node().exec((res) => {
      if (!res[0]) return;
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const dpr = wx.getSystemInfoSync().pixelRatio || 2;
      const systemInfo = wx.getSystemInfoSync();
      const width = systemInfo.windowWidth;
      const height = systemInfo.windowHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      // 优化后的粒子系统：减少粒子数量，取消阴影，连线距离阈值缩小
      class PerformanceParticleSystem {
        constructor(canvas, ctx, width, height, options = {}) {
          this.canvas = canvas;
          this.ctx = ctx;
          this.width = width;
          this.height = height;
          this.count = options.count || 140;   // 减少到140
          this.particles = [];
          this.mouseX = width / 2;
          this.mouseY = height / 2;
          this.gyroX = 0;
          this.gyroY = 0;
          this.init();
        }

        init() {
          for (let i = 0; i < this.count; i++) {
            this.particles.push(this.createParticle());
          }
        }

        createParticle() {
          return {
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
            radius: Math.random() * 2.0 + 0.8,
            alpha: Math.random() * 0.6 + 0.3,
            life: Math.random() * 400 + 200,
            maxLife: 600,
            hue: Math.random() < 0.2 ? 45 + Math.random() * 15 : 200 + Math.random() * 40,
            dataType: Math.random() < 0.15 ? 'gold' : 'normal'
          };
        }

        update(dt) {
          for (let p of this.particles) {
            // 陀螺仪影响系数降低
            p.vx += this.gyroX * 0.004;
            p.vy += this.gyroY * 0.004;
            // 触摸引力（仅当距离小于100）
            const dx = this.mouseX - p.x;
            const dy = this.mouseY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100 && dist > 0) {
              const force = 0.015 / (dist * 0.02 + 0.2);
              p.vx += dx * force * 0.02;
              p.vy += dy * force * 0.02;
            }
            p.vx *= 0.998;
            p.vy *= 0.998;
            p.x += p.vx;
            p.y += p.vy;
            // 边界环绕
            if (p.x < -30) p.x = this.width + 30;
            if (p.x > this.width + 30) p.x = -30;
            if (p.y < -30) p.y = this.height + 30;
            if (p.y > this.height + 30) p.y = -30;

            p.life--;
            if (p.life <= 0) {
              Object.assign(p, this.createParticle());
              p.life = p.maxLife;
            }
          }
        }

        draw() {
          const ctx = this.ctx;
          ctx.clearRect(0, 0, this.width, this.height);
          // 优化连线：距离阈值缩小到65，减少循环次数
          for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
              const p1 = this.particles[i];
              const p2 = this.particles[j];
              const dx = p1.x - p2.x;
              const dy = p1.y - p2.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 65) {
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                const alphaLine = 0.1 * (1 - dist / 65);
                ctx.strokeStyle = `rgba(100, 160, 230, ${alphaLine})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
              }
            }
          }
          // 绘制粒子（取消shadowBlur以提升性能）
          for (let p of this.particles) {
            const alpha = p.alpha * (p.life / p.maxLife);
            if (p.dataType === 'gold') {
              ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
            } else {
              ctx.fillStyle = `hsla(${p.hue}, 70%, 65%, ${alpha})`;
            }
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        render(dt) {
          this.update(dt);
          this.draw();
        }

        reverseFlow() {
          for (let p of this.particles) {
            p.vx = -p.vx;
            p.vy = -p.vy;
          }
        }

        setGyro(x, y) {
          this.gyroX = x;
          this.gyroY = y;
        }

        setMouse(x, y) {
          this.mouseX = Math.min(this.width, Math.max(0, x));
          this.mouseY = Math.min(this.height, Math.max(0, y));
        }

        destroy() {
          this.particles = [];
        }
      }

      this._particleSystem = new PerformanceParticleSystem(canvas, ctx, width, height, { count: 140 });
      // 窗口大小变化适配
      wx.onWindowResize((res) => {
        const newWidth = res.windowWidth;
        const newHeight = res.windowHeight;
        this._particleSystem.width = newWidth;
        this._particleSystem.height = newHeight;
        canvas.width = newWidth * dpr;
        canvas.height = newHeight * dpr;
        ctx.scale(dpr, dpr);
        this._particleSystem.ctx = ctx;
        this._particleSystem.canvas = canvas;
      });
    });
  },

  // 底部闪烁星空（装饰，保持原样）
  initStarCanvas() {
    const query = wx.createSelectorQuery();
    query.select('#starCanvas').node().exec((res) => {
      if (!res[0]) return;
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const dpr = wx.getSystemInfoSync().pixelRatio || 2;
      const systemInfo = wx.getSystemInfoSync();
      const width = systemInfo.windowWidth;
      const height = 120;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      const stars = [];
      const starCount = 100; // 减少星星数量
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.5 + 0.5,
          alpha: Math.random(),
          speed: Math.random() * 0.015 + 0.005
        });
      }
      const animate = () => {
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);
        for (let s of stars) {
          s.alpha += s.speed;
          if (s.alpha > 1 || s.alpha < 0.2) s.speed *= -1;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha * 0.7})`;
          ctx.fill();
        }
        this._starAnimationId = this._requestAnimationFrame(animate);
      };
      animate();
    });
  },

  // 数据可视化柱状图（性能优化：仅绘制一次）
  drawDataVisualization() {
    const query = wx.createSelectorQuery();
    query.select('#dataVizCanvas').node().exec((res) => {
      if (!res[0]) return;
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const dpr = wx.getSystemInfoSync().pixelRatio || 2;
      const w = 300, h = 200;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);

      const { papers, awards, nobelNominations, students } = this.data.vizData;
      const barData = [
        { label: '论文', value: papers, max: 110, color: '#FFD700' },
        { label: '奖项', value: awards, max: 40, color: '#FF6B6B' },
        { label: '诺奖提名', value: nobelNominations, max: 46, color: '#4ECDC4' },
        { label: '学者', value: students, max: 75, color: '#C484E8' }
      ];
      const barWidth = 50, gap = 18;
      const startX = (w - (barWidth + gap) * barData.length + gap) / 2;
      const baseY = h - 30;
      ctx.clearRect(0, 0, w, h);
      barData.forEach((item, i) => {
        const x = startX + i * (barWidth + gap);
        const barHeight = (item.value / item.max) * 140;
        const y = baseY - barHeight;
        ctx.fillStyle = this._darkenColor(item.color, 0.6);
        ctx.beginPath();
        ctx.moveTo(x + barWidth, y);
        ctx.lineTo(x + barWidth + 8, y - 8);
        ctx.lineTo(x + barWidth + 8, baseY - 8);
        ctx.lineTo(x + barWidth, baseY);
        ctx.fill();
        ctx.fillStyle = this._lightenColor(item.color, 0.3);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 8, y - 8);
        ctx.lineTo(x + barWidth + 8, y - 8);
        ctx.lineTo(x + barWidth, y);
        ctx.fill();
        const gradient = ctx.createLinearGradient(x, y, x, baseY);
        gradient.addColorStop(0, item.color);
        gradient.addColorStop(1, this._darkenColor(item.color, 0.4));
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(item.value, x + barWidth / 2, y - 14);
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = '11px sans-serif';
        ctx.fillText(item.label, x + barWidth / 2, baseY + 16);
      });
    });
  },

  _darkenColor(hex, factor) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.floor(r * factor)}, ${Math.floor(g * factor)}, ${Math.floor(b * factor)})`;
  },

  _lightenColor(hex, factor) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.min(255, Math.floor(r + (255 - r) * factor))}, ${Math.min(255, Math.floor(g + (255 - g) * factor))}, ${Math.min(255, Math.floor(b + (255 - b) * factor))})`;
  },

  // 动画循环
  startRenderLoop() {
    const loop = (time) => {
      try {
        const dt = this._lastTime ? (time - this._lastTime) / 1000 : 0.016;
        this._lastTime = time;
        if (this._particleSystem) this._particleSystem.render(dt);
      } catch (e) {
        console.error('动画循环出错：', e);
      }
      this._animationId = this._requestAnimationFrame(loop);
    };
    this._animationId = this._requestAnimationFrame(loop);
  },

  // 陀螺仪
  initGyroscope() {
    wx.startGyroscope({
      interval: 'game',
      success: () => {
        wx.onGyroscopeChange((res) => {
          this._gyroData = {
            x: Math.max(-1, Math.min(1, res.x * 2)),  // 降低敏感度
            y: Math.max(-1, Math.min(1, res.y * 2))
          };
          if (this._particleSystem) this._particleSystem.setGyro(this._gyroData.x, this._gyroData.y);
        });
      },
      fail: () => console.log('陀螺仪不可用')
    });
  },

  // 滚动与章节交互
  onTimelineScroll(e) {
    const scrollTop = e.detail.scrollTop;
    const scrollHeight = e.detail.scrollHeight || 6000;
    const viewHeight = wx.getSystemInfoSync().windowHeight;
    const scrollPercent = scrollTop / (scrollHeight - viewHeight);
    this.updateChapterByScroll(scrollPercent);
    this.updateParityHint(scrollPercent);
    if (this._scrollTimer) clearTimeout(this._scrollTimer);
    this._scrollTimer = setTimeout(() => {
      this.setData({ chapterIndicatorOpacity: scrollTop > 400 ? 0.85 : 0 });
    }, 200);
    if (this._scrollEndTimer) clearTimeout(this._scrollEndTimer);
    this._scrollEndTimer = setTimeout(() => {
      this.updateNodeActive();
    }, 150);
    
  },

  updateNodeActive() {
    const query = wx.createSelectorQuery();
    query.selectAll('.timeline-card-wrapper').boundingClientRect((rects) => {
      if (!rects || rects.length === 0) return;
      const viewHeight = wx.getSystemInfoSync().windowHeight;
      const timelineData = this.data.timelineData;
      let changed = false;
      rects.forEach((rect, index) => {
        if (index >= timelineData.length) return;
        const cardCenter = rect.top + rect.height / 2;
        const dist = Math.abs(cardCenter - viewHeight / 2);
        const isNearCenter = dist < viewHeight * 0.25;
        if (timelineData[index]._nodeActive !== isNearCenter) {
          timelineData[index]._nodeActive = isNearCenter;
          changed = true;
        }
      });
      if (changed) this.setData({ timelineData: [...timelineData] });
    }).exec();
  },

  updateChapterByScroll(scrollPercent) {
    let activeChapter = 'departure';
    for (let zone of this._chapterZones) {
      if (scrollPercent >= zone.startPercent && scrollPercent <= zone.endPercent) {
        activeChapter = zone.id;
        break;
      }
    }
    if (activeChapter !== this.data.currentChapter) {
      const zone = this._chapterZones.find(z => z.id === activeChapter);
      this.setData({
        currentChapter: activeChapter,
        chapterLabelVisible: true,
        chapterLabelText: zone ? zone.name : '',
        chapterLabelSub: zone ? zone.sub : ''
      });
      if (this._chapterLabelTimer) clearTimeout(this._chapterLabelTimer);
      this._chapterLabelTimer = setTimeout(() => {
        this.setData({ chapterLabelVisible: false });
      }, 3000);
    }
  },

  updateParityHint(scrollPercent) {
    const visible = scrollPercent >= 0.48 && scrollPercent <= 0.58;
    if (visible !== this.data.parityHintVisible) {
      this.setData({ parityHintVisible: visible });
    }
  },

  // 触摸交互（粒子受触摸影响）
  onCanvasTouchStart(e) {
    const touch = e.touches[0];
    const x = touch.x, y = touch.y;
    if (this._particleSystem) this._particleSystem.setMouse(x, y);
  },

  onCanvasTouchMove(e) {
    const touch = e.touches[0];
    const x = touch.x, y = touch.y;
    if (this._particleSystem) this._particleSystem.setMouse(x, y);
  },

  onCanvasTouchEnd() {
    if (this._particleSystem) this._particleSystem.setMouse(this._particleSystem.width / 2, this._particleSystem.height / 2);
  },

  onScrollTouchStart() {},
  onScrollTouchEnd() {},

  // 粒子流反转彩蛋（宇称不守恒）
  onParityTap() {
    if (!this._particleSystem) return;
    const reversed = !this.data.parityReversed;
    this.setData({ parityReversed: reversed });
    this._particleSystem.reverseFlow();
    wx.vibrateShort({ type: 'medium' });
    wx.showToast({
      title: reversed ? '粒子流已反转 🔄 宇称不守恒' : '粒子流恢复正向',
      icon: 'none',
      duration: 1500
    });
  },

  onCardTap(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.timelineData[index];
    if (!item) return;
    this.setData({
      showDetail: true,
      detailData: {
        year: item.year,
        title: item.title,
        description: item.description,
        image: item.image || ''
      }
    });
  },

  closeDetail() {
    this.setData({ showDetail: false });
  },

  preventMove() { return false; },
  stopPropagation(e) { return; },

  _initIntersectionObserver() {
    this._intersectionObserver = wx.createIntersectionObserver(this, { observeAll: true });
    this._intersectionObserver.relativeTo('.timeline-scroll').observe('.timeline-card-wrapper', (res) => {
      if (res.intersectionRatio > 0) {
        const index = res.dataset.index;
        if (index !== undefined && this.data.timelineData[index] && !this.data.timelineData[index]._visible) {
          const timelineData = this.data.timelineData;
          timelineData[index]._visible = true;
          this.setData({ timelineData: [...timelineData] });
        }
      }
    });
  }
});