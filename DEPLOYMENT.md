# 🚀 Vercel部署指南

## 📋 项目概述
这是一个包含7首歌曲的音乐播放器项目，具有自动播放、进度条控制等功能。

## 🛠️ 部署步骤

### 1. 安装Vercel CLI
```bash
npm install -g vercel
```

### 2. 登录Vercel账户
```bash
vercel login
```

### 3. 部署项目
```bash
# 首次部署
vercel

# 生产环境部署
vercel --prod
```

### 4. 自动部署（推荐）
- 将代码推送到GitHub
- 在Vercel控制台连接GitHub仓库
- 启用自动部署

## 📁 项目结构
```
moment-music-blog-v1/
├── index.html              # 主页面
├── assets/                 # 静态资源
│   ├── audio/             # 音频文件
│   ├── images/            # 图片文件
│   └── lyrics/            # 歌词文件
├── css/                   # 样式文件
├── js/                    # JavaScript文件
├── data/                  # 数据文件
├── vercel.json           # Vercel配置
└── package.json          # 项目配置
```

## ⚙️ 配置说明

### vercel.json配置
- **静态文件处理**: 自动处理所有静态资源
- **缓存优化**: 音频文件设置1年缓存
- **路由规则**: 支持SPA路由
- **音频优化**: 设置Accept-Ranges支持范围请求

### 性能优化
- ✅ 音频文件CDN缓存
- ✅ 图片文件压缩和缓存
- ✅ 静态资源优化
- ✅ 全球边缘网络分发

## 🌐 部署后访问
部署成功后，你将获得：
- 生产环境URL: `https://your-app.vercel.app`
- 预览环境URL: `https://your-app-git-main.vercel.app`

## 🔧 故障排除

### 常见问题
1. **音频文件无法播放**
   - 检查文件路径是否正确
   - 确认音频文件格式支持

2. **进度条功能异常**
   - 部署后问题应该自动解决
   - 本地文件元数据加载问题在CDN环境下不存在

3. **自动播放被阻止**
   - 现代浏览器需要用户交互才能自动播放
   - 这是正常的安全机制

## 📞 技术支持
如有问题，请检查：
1. Vercel部署日志
2. 浏览器控制台错误
3. 网络请求状态

---
*最后更新: 2024年8月*
