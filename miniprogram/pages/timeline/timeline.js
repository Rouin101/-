// miniprogram/pages/timeline/timeline.js

// ============ 粒子系统类（Canvas 2D版本） ============
class ParticleSystem2D {
  constructor(canvas, ctx, options = {}) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.particles = [];
    this.count = options.count || 300;
    this.width = 0;
    this.height = 0;
    this.mouseX = 0;
    this.mouseY = 0;
    this.gyroX = 0;
    this.gyroY = 0;
    this.flowDirection = 1;
    this.init();
  }

  init() {
    this.resize();
    for (let i = 0; i < this.count; i++) {
      this.particles.push(this.createParticle());
    }
  }

  resize() {
    if (this.canvas) {
      const rect = this.canvas.getBoundingClientRect();
      this.width = rect.width || 375;
      this.height = rect.height || 667;
      this.canvas.width = this.width * 2;
      this.canvas.height = this.height * 2;
      this.ctx.scale(2, 2);
    }
  }

  createParticle() {
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      radius: Math.random() * 2.5 + 0.8,
      alpha: Math.random() * 0.7 + 0.3,
      life: Math.random() * 300 + 200,
      maxLife: 500,
      hue: Math.random() < 0.3 ? 45 + Math.random() * 15 : 210 + Math.random() * 40,
      dataType: Math.random() < 0.15 ? 'gold' : 'normal'
    };
  }

  update(dt) {
    const flowForce = 0.25 * this.flowDirection;
    for (let p of this.particles) {
      p.vx += (flowForce + (Math.random() - 0.5) * 0.08) * 0.02;
      p.vy += (Math.random() - 0.5) * 0.02;
      p.vx += this.gyroX * 0.003;
      p.vy += this.gyroY * 0.003;

      const dx = this.mouseX - p.x;
      const dy = this.mouseY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150 && dist > 0) {
        const force = 0.012 / (dist * 0.01 + 0.1);
        p.vx += dx * force * 0.03;
        p.vy += dy * force * 0.03;
      }

      p.vx *= 0.995;
      p.vy *= 0.995;
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -20) p.x = this.width + 20;
      if (p.x > this.width + 20) p.x = -20;
      if (p.y < -20) p.y = this.height + 20;
      if (p.y > this.height + 20) p.y = -20;

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

    for (let p of this.particles) {
      const alpha = p.alpha * (p.life / p.maxLife);
      if (p.dataType === 'gold') {
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.7)';
        ctx.shadowBlur = 8;
      } else {
        ctx.fillStyle = `hsla(${p.hue}, 70%, 65%, ${alpha})`;
        ctx.shadowColor = `hsla(${p.hue}, 70%, 65%, 0.5)`;
        ctx.shadowBlur = 4;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  render(dt) {
    this.update(dt);
    this.draw();
  }

  reverseFlow() {
    this.flowDirection *= -1;
    for (let p of this.particles) {
      p.vx += this.flowDirection * 2.5;
      p.vy += (Math.random() - 0.5) * 1.5;
    }
  }

  setGyro(x, y) {
    this.gyroX = x;
    this.gyroY = y;
  }

  setMouse(x, y) {
    this.mouseX = x;
    this.mouseY = y;
  }

  destroy() {
    this.particles = [];
  }
}

// ============ WebGL着色器 ============
const particleVertexShader = `
  attribute vec2 a_position;
  attribute float a_size;
  attribute float a_alpha;
  attribute vec3 a_color;
  varying float v_alpha;
  varying vec3 v_color;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_gyro;
  uniform vec2 u_touch;
  void main() {
    vec2 pos = a_position;
    pos += u_gyro * 0.02;
    float dist = length(pos - u_touch);
    if (dist < 0.25) {
      float force = (0.25 - dist) * 0.15;
      pos += normalize(pos - u_touch) * force;
    }
    vec2 clipSpace = pos * 2.0 - 1.0;
    gl_Position = vec4(clipSpace.x, -clipSpace.y, 0.0, 1.0);
    gl_PointSize = a_size * (1.0 + sin(u_time * 2.0 + pos.x * 10.0) * 0.3);
    v_alpha = a_alpha;
    v_color = a_color;
  }
`;

const particleFragmentShader = `
  precision mediump float;
  varying float v_alpha;
  varying vec3 v_color;
  uniform float u_time;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float alpha = smoothstep(1.0, 0.0, d) * v_alpha;
    alpha *= 0.7 + 0.3 * sin(u_time * 3.0 + gl_PointCoord.x * 20.0);
    gl_FragColor = vec4(v_color, alpha);
  }
`;

// ============ 页面逻辑 ============
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
  _glContext: null,
  _glProgram: null,
  _glParticles: null,
  _particleSystem2D: null,
  _tributeParticles: null,
  _dataVizDrawn: false,
  _animationId: null,
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
      if (res[0]) this._rafCanvas = res[0].node;
      this._initAll();
      this._initIntersectionObserver();
    });
  },

  _initAll() {
    try {
      this.initWebGLBackground();
      this.initParticleSystem2D();
      this.initTributeParticles();
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
    if (this._loadingTimer) clearTimeout(this._loadingTimer);
    if (this._scrollTimer) clearTimeout(this._scrollTimer);
    if (this._scrollEndTimer) clearTimeout(this._scrollEndTimer);
    if (this._intersectionObserver) this._intersectionObserver.disconnect();
    if (this._glContext) this._glContext = null;
    if (this._particleSystem2D) this._particleSystem2D.destroy();
    if (this._tributeParticles) this._tributeParticles.destroy();
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
      { year: "1945", title: "登上时代周刊", image: "/images/timeline/1.jpg", description: "1945年，吴健雄登上美国《时代》周刊封面，成为该刊封面人物。作为曼哈顿计划中唯一的华裔女科学家，她在核物理领域的突破性贡献被全球瞩目，被誉为'解锁原子时代的女性先驱'。", chapter: 'quest' },
      { year: "1950", title: "β衰变领域权威", image: "", description: "20世纪50年代，吴健雄在哥伦比亚大学进行一系列精确的β衰变实验，成为该领域的世界级权威。她以极高的实验精度和创新能力，为弱相互作用研究奠定了坚实基础。", chapter: 'peak' },
      { year: "1957", title: "宇称不守恒实验验证", image: "/images/timeline/4.jpg", description: "1957年，吴健雄通过精密的β衰变实验，验证了宇称不守恒理论。这一颠覆性发现彻底改写了物理学基本定律，帮助李政道和杨振宁获得诺贝尔奖。吴健雄虽未获奖，但被公认为'核物理女王'。", chapter: 'peak' },
      { year: "1958", title: "获普林斯顿大学名誉博士", image: "", description: "1958年，吴健雄获得普林斯顿大学名誉博士学位，成为普林斯顿大学历史上第一位获得名誉博士学位的女性。同年，她还当选为美国国家科学院院士。", chapter: 'peak' },
      { year: "1963", title: "验证费曼-盖尔曼理论", image: "", description: "1963年，吴健雄完成另一项里程碑实验——矢量流守恒假说的精确验证，进一步巩固了她作为实验物理学大师的地位。这一成果对粒子物理学的发展产生了深远影响。", chapter: 'peak' },
      { year: "1973", title: "首次回中国大陆", image: "", description: "1973年，61岁的吴健雄与丈夫袁家骝一起回国访问，受到周恩来总理亲切接见。这是她离开祖国37年后首次归来，此后她多次回国讲学，推动中美科学交流。", chapter: 'return' },
      { year: "1975", title: "担任美国物理学会会长", image: "/images/timeline/7.jpg", description: "吴健雄当选美国物理学会会长，成为该学会首位女性会长。同年获得美国国家科学勋章，这是美国科学界最高荣誉。", chapter: 'return' },
      { year: "1978", title: "获沃尔夫物理学奖", image: "", description: "1978年，吴健雄获得首届沃尔夫物理学奖。该奖项通常被视为诺贝尔奖的风向标，表彰她在宇称不守恒等方面的开创性实验成就。", chapter: 'return' },
      { year: "1990", title: "担任中国科学院院士", image: "", description: "吴健雄被授予中国科学院外籍院士称号，国际编号2752号小行星被命名为'吴健雄星'，以表彰其卓越科学成就。", chapter: 'eternity' },
      { year: "1997", title: "逝世与永恒铭记", image: "", description: "1997年2月16日，吴健雄在纽约病逝，享年84岁。遵照遗愿，骨灰归葬家乡太仓，墓园设计灵感来自她的物理实验。她留下的科学精神与家国情怀长存。", chapter: 'eternity' }
    ];

    const timelineData = rawData.map((item) => ({
      ...item,
      _nodeActive: false,
      _visible: false   // 用于触发浮现动画
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

  // ========== WebGL 背景 ==========
  initWebGLBackground() {
    const query = wx.createSelectorQuery();
    query.select('#particleCanvas').node().exec((res) => {
      if (!res[0]) return;
      const canvas = res[0].node;
      const gl = canvas.getContext('webgl');
      if (!gl) return;
      this._glContext = gl;

      canvas.width = canvas._width || 375;
      canvas.height = canvas._height || 667;

      const vs = this._compileShader(gl, gl.VERTEX_SHADER, particleVertexShader);
      const fs = this._compileShader(gl, gl.FRAGMENT_SHADER, particleFragmentShader);
      if (!vs || !fs) return;

      const program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      this._glProgram = program;

      const particleCount = 600;
      const positions = new Float32Array(particleCount * 2);
      const sizes = new Float32Array(particleCount);
      const alphas = new Float32Array(particleCount);
      const colors = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount; i++) {
        positions[i * 2] = Math.random();
        positions[i * 2 + 1] = Math.random();
        sizes[i] = Math.random() * 4 + 1.5;
        alphas[i] = Math.random() * 0.5 + 0.3;
        if (Math.random() < 0.2) {
          colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.84; colors[i * 3 + 2] = 0.0;
        } else {
          colors[i * 3] = 0.3 + Math.random() * 0.3;
          colors[i * 3 + 1] = 0.4 + Math.random() * 0.4;
          colors[i * 3 + 2] = 0.7 + Math.random() * 0.3;
        }
      }

      this._glParticles = { positions, sizes, alphas, colors, count: particleCount };

      this._createGLBuffer(gl, program, 'a_position', positions, 2);
      this._createGLBuffer(gl, program, 'a_size', sizes, 1);
      this._createGLBuffer(gl, program, 'a_alpha', alphas, 1);
      this._createGLBuffer(gl, program, 'a_color', colors, 3);

      gl.useProgram(program);
      gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), canvas.width, canvas.height);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    });
  },

  _compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  },

  _createGLBuffer(gl, program, name, data, components) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    const loc = gl.getAttribLocation(program, name);
    if (loc >= 0) {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, components, gl.FLOAT, false, 0, 0);
    }
  },

  // ========== 2D 粒子系统 ==========
  initParticleSystem2D() {
    const query = wx.createSelectorQuery();
    query.select('#overlayCanvas').node().exec((res) => {
      if (!res[0]) return;
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const dpr = wx.getSystemInfoSync().pixelRatio || 2;
      const rect = canvas.getBoundingClientRect();
      canvas.width = (rect.width || 375) * dpr;
      canvas.height = (rect.height || 667) * dpr;
      ctx.scale(dpr, dpr);
      this._particleSystem2D = new ParticleSystem2D(canvas, ctx, { count: 250 });
    });
  },

  initTributeParticles() {
    const query = wx.createSelectorQuery();
    query.select('#tributeCanvas').node().exec((res) => {
      if (!res[0]) return;
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const dpr = wx.getSystemInfoSync().pixelRatio || 2;
      canvas.width = 375 * dpr;
      canvas.height = 250 * dpr;
      ctx.scale(dpr, dpr);
      this._tributeParticles = new ParticleSystem2D(canvas, ctx, { count: 500 });
      this._tributeParticles.particles.forEach(p => {
        p.dataType = 'gold';
        p.hue = 45;
        p.radius = Math.random() * 1.8 + 0.5;
      });
    });
  },

  // ========== 数据可视化 ==========
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

  // ========== 动画循环 ==========
  startRenderLoop() {
    const loop = (time) => {
      try {
        const dt = this._lastTime ? (time - this._lastTime) / 1000 : 0.016;
        this._lastTime = time;

        if (this._glContext && this._glProgram) {
          const gl = this._glContext;
          gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.useProgram(this._glProgram);
          gl.uniform1f(gl.getUniformLocation(this._glProgram, 'u_time'), time / 1000);
          gl.uniform2f(gl.getUniformLocation(this._glProgram, 'u_gyro'), this._gyroData.x, this._gyroData.y);
          gl.uniform2f(gl.getUniformLocation(this._glProgram, 'u_touch'), this._touchPos.x, this._touchPos.y);
          if (this._glParticles) gl.drawArrays(gl.POINTS, 0, this._glParticles.count);
        }

        if (this._particleSystem2D) this._particleSystem2D.render(dt);
        if (this._tributeParticles) this._tributeParticles.render(dt);
      } catch (e) {
        console.error('动画循环出错：', e);
      }
      this._animationId = this._requestAnimationFrame(loop);
    };
    this._animationId = this._requestAnimationFrame(loop);
  },

  // ========== 陀螺仪 ==========
  initGyroscope() {
    wx.startGyroscope({
      interval: 'game',
      success: () => {
        wx.onGyroscopeChange((res) => {
          this._gyroData = {
            x: Math.max(-1, Math.min(1, res.x * 3)),
            y: Math.max(-1, Math.min(1, res.y * 3))
          };
          if (this._particleSystem2D) this._particleSystem2D.setGyro(this._gyroData.x, this._gyroData.y);
          if (this._tributeParticles) this._tributeParticles.setGyro(this._gyroData.x, this._gyroData.y);
        });
      },
      fail: () => console.log('陀螺仪不可用')
    });
  },

  // ========== 滚动与章节 ==========
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
      
      if (changed) {
        this.setData({ timelineData: [...timelineData] });
      }
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

  // ========== 触摸与交互 ==========
  onCanvasTouchStart(e) {
    const touch = e.touches[0];
    this._touchPos = {
      x: touch.x / (wx.getSystemInfoSync().windowWidth || 375),
      y: touch.y / (wx.getSystemInfoSync().windowHeight || 667)
    };
    if (this._particleSystem2D) {
      this._particleSystem2D.setMouse(this._touchPos.x * 375, this._touchPos.y * 667);
    }
  },

  onCanvasTouchMove(e) {
    const touch = e.touches[0];
    this._touchPos = {
      x: touch.x / (wx.getSystemInfoSync().windowWidth || 375),
      y: touch.y / (wx.getSystemInfoSync().windowHeight || 667)
    };
    if (this._particleSystem2D) {
      this._particleSystem2D.setMouse(this._touchPos.x * 375, this._touchPos.y * 667);
    }
    if (this._tributeParticles) {
      this._tributeParticles.setMouse(this._touchPos.x * 375, this._touchPos.y * 250);
    }
  },

  onCanvasTouchEnd() {
    this._touchPos = { x: 0.5, y: 0.5 };
  },

  onScrollTouchStart() {},
  onScrollTouchEnd() {},

  onParityTap() {
    const reversed = !this.data.parityReversed;
    this.setData({ parityReversed: reversed });
    if (this._particleSystem2D) this._particleSystem2D.reverseFlow();
    if (this._tributeParticles) this._tributeParticles.reverseFlow();
    wx.vibrateShort({ type: 'medium' });
    wx.showToast({ title: reversed ? '粒子流已反转 🔄' : '粒子流恢复正向', icon: 'none', duration: 1500 });
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

  preventMove() {
    return false;
  },

  stopPropagation(e) {
    return;
  },

  // ========== 卡片浮现动画（IntersectionObserver） ==========
  _initIntersectionObserver() {
    // 相对于滚动容器 .timeline-scroll 观察 .timeline-card-wrapper 节点
    this._intersectionObserver = wx.createIntersectionObserver(this, { observeAll: true });
    this._intersectionObserver
      .relativeTo('.timeline-scroll')
      .observe('.timeline-card-wrapper', (res) => {
        if (res.intersectionRatio > 0) {
          const index = res.dataset.index;
          if (index !== undefined && this.data.timelineData[index]) {
            const timelineData = this.data.timelineData;
            if (!timelineData[index]._visible) {
              timelineData[index]._visible = true;
              this.setData({ timelineData: [...timelineData] });
              // 变为可见后断开对该节点的监听，节省性能
              // 但 IntersectionObserver 是 observeAll 模式，无法单独断开，可以保留不做处理
            }
          }
        }
      });
  }
});