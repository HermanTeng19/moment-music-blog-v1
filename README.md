# Moment Music Blog V1 - 纯静态音乐播放器

一个基于文件系统的纯静态音乐播放器，支持JSON元数据管理、歌词显示、播放列表和响应式设计。无需后端服务器，直接通过浏览器即可运行。

## 🎵 功能特性

- **🔧 纯静态部署** - 无需后端服务器，直接部署到任何Web服务器
- **📁 文件系统管理** - 所有内容通过文件系统组织，易于维护
- **📋 JSON元数据** - 灵活的数据配置方式，支持丰富的歌曲信息
- **🎶 完整播放控制** - 播放/暂停、上下曲、进度控制、音量调节
- **📜 歌词显示** - 支持歌词文件加载和左对齐显示
- **🖼️ 动态背景** - 根据歌曲自动切换背景图片
- **📱 响应式设计** - 完美适配桌面和移动设备
- **⌨️ 键盘快捷键** - 支持空格、方向键等快捷操作
- **🎨 现代界面** - 美观的用户界面，基于Tailwind CSS
- **🎯 专业图标** - 音频频谱样式的网站图标

## 🚀 快速开始

### 方法一：使用开发服务器（推荐）
```bash
# 启动本地服务器
python3 serve.py

# 在浏览器中访问
open http://localhost:8000
```

### 方法二：直接打开文件
```bash
# 直接在浏览器中打开（可能有CORS限制）
open index.html
```

## 📁 项目结构

```
moment-music-blog-v1/
├── index.html                     # 主播放器页面
├── favicon.svg                    # 网站图标（音频频谱样式）
├── serve.py                       # 本地开发服务器
├── PLAYLIST_UPDATE.md             # 播放列表和界面优化记录
├── USAGE_GUIDE.md                 # 详细使用指南
├── data/                          # 数据文件目录
│   ├── playlist.json              # 播放列表配置
│   └── songs/                     # 歌曲元数据
│       ├── song-001.json          # 歌曲详细信息
│       ├── song-002.json
│       ├── song-003.json
│       ├── song-004.json
│       └── song-005.json
├── assets/                        # 静态资源目录
│   ├── audio/                     # 音频文件（MP3、WAV等）
│   ├── images/
│   │   ├── covers/                # 专辑封面（正方形）
│   │   └── backgrounds/           # 背景图片（16:9）
│   └── lyrics/                    # 歌词文件（TXT格式）
├── js/                            # JavaScript模块
│   ├── data-manager.js            # 数据加载管理器
│   └── player.js                  # 播放器核心逻辑
└── css/
    └── styles.css                 # 自定义样式
```

## ⚡ 添加新歌曲

1. **准备文件**
   ```bash
   # 音频文件
   assets/audio/my-song.mp3
   
   # 图片文件
   assets/images/covers/my-cover.jpg
   assets/images/backgrounds/my-bg.jpg
   
   # 歌词文件
   assets/lyrics/my-song.txt
   ```

2. **创建歌曲配置**
   ```bash
   # 复制并修改现有配置
   cp data/songs/song-001.json data/songs/my-song.json
   ```

3. **更新播放列表**
   ```json
   // data/playlist.json
   {
     "songs": ["song-001", "song-002", "song-003", "song-004", "song-005", "my-song"]
   }
   ```

## 🎹 键盘快捷键

| 按键 | 功能 |
|------|------|
| `空格` | 播放/暂停 |
| `←` | 上一首 |
| `→` | 下一首 |
| `L` | 切换歌词显示 |
| `P` | 打开/关闭播放列表 |

## 📱 浏览器兼容性

- Chrome 60+
- Firefox 60+
- Safari 12+ 
- Edge 79+

## 🔧 技术架构

### 前端技术栈
- **HTML5** - 语义化标记和音频API
- **CSS3** - 现代样式和动画效果
- **JavaScript ES6+** - 模块化架构和异步处理
- **Tailwind CSS** - 实用优先的CSS框架

### 数据管理
- **JSON配置** - 灵活的元数据管理
- **Fetch API** - 异步数据加载
- **文件系统** - 简单的内容组织方式

### 核心模块
- **DataManager** - 负责加载和管理音乐数据
- **MusicPlayer** - 播放器核心逻辑和UI控制
- **CSS样式系统** - 响应式界面和视觉效果

## 📊 数据格式

### 播放列表配置 (playlist.json)
```json
{
  "name": "Moment Music Blog 精选播放列表",
  "songs": ["song-001", "song-002", "song-003", "song-004", "song-005"]
}
```

### 歌曲信息 (song-xxx.json)
```json
{
  "id": "song-001",
  "title": "歌曲标题",
  "artist": "艺术家",
  "audioSrc": "assets/audio/song-001.mp3",
  "coverSrc": "assets/images/covers/cover-001.jpg", 
  "backgroundSrc": "assets/images/backgrounds/bg-001.jpg",
  "lyricsSrc": "assets/lyrics/song-001.txt"
}
```

## 🆕 最新更新

### v1.1.0 - 界面优化和功能增强
- **播放列表优化** - 移除"未知"字段，只显示标题和艺术家信息
- **歌词显示改进** - 歌词文本改为左对齐显示，提升阅读体验
- **网站图标** - 添加音频频谱样式的favicon，解决404错误
- **错误处理改进** - 优化数据加载的错误处理逻辑

### 详细更新记录
查看 [PLAYLIST_UPDATE.md](PLAYLIST_UPDATE.md) 了解完整的修改历史。

## 🛠️ 自定义开发

### 修改样式
编辑 `css/styles.css` 来自定义界面外观。

### 扩展功能
- 在 `js/player.js` 中添加播放器功能
- 在 `js/data-manager.js` 中扩展数据管理逻辑

### 添加新字段
在歌曲JSON中添加自定义字段，然后在JavaScript中处理。

## 🔍 故障排除

查看 [使用指南](USAGE_GUIDE.md) 获取详细的故障排除信息。

## 📄 许可证

本项目采用 MIT 许可证。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**注意**: 请确保使用的音频和图片内容符合版权要求。
