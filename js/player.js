/**
 * 音乐播放器核心逻辑
 */
class MusicPlayer {
    constructor() {
        this.initializeElements();
        this.initializeState();
        this.bindEvents();
    }

    initializeElements() {
        // 音频元素
        this.audioPlayer = document.getElementById('audio-player');
        
        // 播放控制
        this.playPauseBtn = document.getElementById('play-pause-btn');
        this.playIcon = document.getElementById('play-icon');
        this.pauseIcon = document.getElementById('pause-icon');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        
        // 进度控制
        this.progressBar = null; // 已移除原生range控件
        this.progressFill = null; // 已移除旧的fill元素
        this.waveCanvas = document.getElementById('waveCanvas');
        this.waveCtx = null; // 不再绘制波浪线
        this.progressMask = document.getElementById('progress');
        this.progressOverlay = document.getElementById('progress-overlay');
        this.currentTimeEl = document.getElementById('current-time');
        this.totalDurationEl = document.getElementById('total-duration');
        
        // 歌曲信息
        this.songTitleEl = document.getElementById('song-title');
        this.songArtistEl = document.getElementById('song-artist');
        this.playerContainer = document.getElementById('player-container');
        
        // 音量控制
        this.volumeBtn = document.getElementById('volume-btn');
        this.volumeSlider = document.getElementById('volume-slider');
        this.volumeHighIcon = document.getElementById('volume-high-icon');
        this.volumeMuteIcon = document.getElementById('volume-mute-icon');
        
        // 歌词和播放列表
        this.lyricsBtn = document.getElementById('lyrics-btn');
        this.lyricsContainer = document.getElementById('lyrics-container');
        this.lyricsContent = document.getElementById('lyrics-content');
        this.playlistBtn = document.getElementById('playlist-btn');
        this.playlistOverlay = document.getElementById('playlist-overlay');
        this.playlistContainer = document.getElementById('playlist-container');
        this.closePlaylistBtn = document.getElementById('close-playlist-btn');
        
        // 音频频谱
        this.spectrumContainer = document.getElementById('audio-spectrum-container');
        this.spectrumCanvas = document.getElementById('audio-spectrum-canvas');
        this.spectrumCtx = this.spectrumCanvas.getContext('2d');
        this.spectrumToggleBtn = document.getElementById('spectrum-toggle-btn');
        this.spectrumOnIcon = document.getElementById('spectrum-on-icon');
        this.spectrumOffIcon = document.getElementById('spectrum-off-icon');
    }

    initializeState() {
        this.isPlaying = false;
        this.currentSongIndex = 0;
        this.lastVolume = 0.7;
        this.areLyricsVisible = false;
        this.playlist = [];
        this.isInitialized = false;
        
        // 播放模式设置
        this.playMode = 'sequential'; // 'sequential', 'shuffle', 'repeat-one', 'repeat-all'
        this.shuffleHistory = [];
        this.userPreferences = this.loadUserPreferences();
        
        // 设置初始音量
        this.audioPlayer.volume = 0.7;
        this.volumeSlider.value = 0.7;
        
        // 音频频谱分析器相关状态
        this.audioContext = null;
        this.analyser = null;
        this.audioSource = null;
        this.frequencyData = null;
        this.animationId = null;
        this.isSpectrumActive = false;
        this.isSpectrumEnabled = true; // 频谱开关状态
        
        // 进度拖拽状态
        this.isDraggingProgress = false;
    }

    bindEvents() {
        // 播放控制事件
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.prevBtn.addEventListener('click', () => this.prevSong());
        this.nextBtn.addEventListener('click', () => this.nextSong());
        
        // 音频事件
        this.audioPlayer.addEventListener('timeupdate', () => this.updateProgress());
        this.audioPlayer.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audioPlayer.addEventListener('ended', () => this.handleSongEnd());
        this.audioPlayer.addEventListener('error', (e) => this.handleAudioError(e));
        
        // 进度条事件（全屏容器点击/拖拽定位进度）
        if (this.progressOverlay) {
            console.log('Progress overlay found, binding events');
            this.progressOverlay.addEventListener('mousedown', (e) => {
                console.log('Mouse down on progress overlay');
                this.handleProgressDown(e);
            });
            this.progressOverlay.addEventListener('mousemove', (e) => this.handleProgressMove(e));
            document.addEventListener('mouseup', () => this.handleProgressUp());
            // 触摸支持
            this.progressOverlay.addEventListener('touchstart', (e) => this.handleProgressDown(e), { passive: true });
            this.progressOverlay.addEventListener('touchmove', (e) => this.handleProgressMove(e), { passive: true });
            document.addEventListener('touchend', () => this.handleProgressUp(), { passive: true });
        } else {
            console.error('Progress overlay not found!');
        }
        
        // 音量控制事件
        this.volumeBtn.addEventListener('click', () => this.toggleMute());
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e));
        
        // 歌词和播放列表事件
        this.lyricsBtn.addEventListener('click', () => this.toggleLyrics());
        this.playlistBtn.addEventListener('click', () => this.togglePlaylist());
        this.closePlaylistBtn.addEventListener('click', () => this.togglePlaylist());
        
        // 频谱开关事件
        this.spectrumToggleBtn.addEventListener('click', () => this.toggleSpectrum());
        
        // 播放模式切换事件
        this.bindPlayModeEvents();
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    /**
     * 初始化播放器，加载数据
     */
    async initialize() {
        try {
            this.showLoading(true);
            
            // 确保数据管理器已初始化
            if (!window.dataManager.isReady()) {
                const success = await window.dataManager.initialize();
                if (!success) {
                    throw new Error('数据管理器初始化失败');
                }
            }
            
            // 加载播放列表
            this.playlist = window.dataManager.getAllSongs();
            
            if (this.playlist.length === 0) {
                throw new Error('播放列表为空');
            }
            
            // 加载第一首歌曲
            await this.loadSong(0);
            
            // 渲染播放列表
            this.renderPlaylist();
            
            this.isInitialized = true;
            this.showLoading(false);
            
            // 初始化频谱开关图标状态
            this.updateSpectrumToggleIcon();
            
            console.log('播放器初始化完成，共加载', this.playlist.length, '首歌曲');
            
        } catch (error) {
            console.error('播放器初始化失败:', error);
            this.showError('播放器初始化失败: ' + error.message);
            this.showLoading(false);
        }

        // 初始化全屏遮罩尺寸
        this.setupProgressWaveCanvas();
    }

    /**
     * 加载指定歌曲
     */
    async loadSong(index) {
        if (index < 0 || index >= this.playlist.length) {
            console.warn('歌曲索引超出范围:', index);
            return;
        }

        this.currentSongIndex = index;
        const song = this.playlist[index];
        
        try {
            // 更新音频源
            this.audioPlayer.src = song.audioSrc;
            
            // 更新歌曲信息
            this.songTitleEl.textContent = song.title;
            this.songArtistEl.textContent = song.artist;
            
            // 更新背景图片
            this.changeBackground(song.imageSrc);
            
            // 更新歌词
            this.lyricsContent.textContent = song.lyrics || '暂无歌词';
            
            // 尝试自动播放（如果用户已经与页面交互过）
            if (this.isPlaying) {
                try {
                    await this.audioPlayer.play();
                    this.updatePlayButton(true);
                } catch (error) {
                    console.log('自动播放失败，需要用户交互:', error);
                    this.updatePlayButton(false);
                    this.isPlaying = false;
                }
            }
            
            // 更新播放列表显示
            this.updatePlaylistDisplay();
            
            console.log('歌曲加载完成:', song.title);
            
        } catch (error) {
            console.error('加载歌曲失败:', error);
            this.showError('加载歌曲失败: ' + error.message);
        }
    }

    /**
     * 播放音频
     */
    async playAudio() {
        try {
            await this.audioPlayer.play();
            this.isPlaying = true;
            this.updatePlayButton(true);
            
            // 启动频谱动画（如果频谱开关开启）
            if (this.isSpectrumEnabled) {
                this.startSpectrumAnimation();
            }
        } catch (error) {
            console.error('播放失败:', error);
            this.showError('播放失败，请检查音频文件');
        }
    }

    /**
     * 暂停音频
     */
    pauseAudio() {
        this.audioPlayer.pause();
        this.isPlaying = false;
        this.updatePlayButton(false);
        
        // 停止频谱动画
        this.stopSpectrumAnimation();
    }

    /**
     * 切换播放/暂停
     */
    togglePlayPause() {
        if (!this.isInitialized) {
            console.warn('播放器尚未初始化');
            return;
        }

        if (this.isPlaying) {
            this.pauseAudio();
        } else {
            this.playAudio();
        }
    }

    /**
     * 上一首
     */
    prevSong() {
        if (!this.isInitialized) return;
        
        const newIndex = (this.currentSongIndex - 1 + this.playlist.length) % this.playlist.length;
        this.loadSong(newIndex);
    }

    /**
     * 下一首
     */
    nextSong() {
        if (!this.isInitialized) return;
        
        const newIndex = (this.currentSongIndex + 1) % this.playlist.length;
        this.loadSong(newIndex);
    }

    /**
     * 更新播放进度
     */
    updateProgress() {
        if (this.audioPlayer.duration) {
            const progressPercent = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
            if (this.progressMask) this.progressMask.style.width = `${progressPercent}%`;
            this.currentTimeEl.textContent = this.formatTime(this.audioPlayer.currentTime);
        }
    }

    /**
     * 设置播放进度
     */
    handleProgressDown(event) {
        if (!this.audioPlayer || !this.progressOverlay) return;
        this.isDraggingProgress = true;
        this.seekByEvent(event);
    }

    handleProgressMove(event) {
        if (!this.isDraggingProgress) return;
        this.seekByEvent(event);
    }

    handleProgressUp() {
        this.isDraggingProgress = false;
    }

    seekByEvent(event) {
        if (!this.audioPlayer || !this.progressOverlay) return;
        
        // 检查音频是否有有效的duration
        if (!this.audioPlayer.duration || isNaN(this.audioPlayer.duration) || this.audioPlayer.duration <= 0) {
            // 如果duration还没加载，尝试等待并重试
            console.log('音频duration还未加载，等待元数据...');
            
            // 设置一个监听器，等待loadedmetadata事件
            const onMetadataLoaded = () => {
                this.audioPlayer.removeEventListener('loadedmetadata', onMetadataLoaded);
                if (this.audioPlayer.duration && this.audioPlayer.duration > 0) {
                    console.log('元数据已加载，重新执行seekByEvent');
                    this.performSeek(event);
                }
            };
            
            // 如果元数据还没加载，添加监听器
            if (this.audioPlayer.readyState < 1) {
                this.audioPlayer.addEventListener('loadedmetadata', onMetadataLoaded);
                // 触发元数据加载
                this.audioPlayer.load();
            } else {
                // 可能是其他问题，显示提示
                this.showError('音频文件元数据加载失败，请稍后重试');
            }
            return;
        }
        
        this.performSeek(event);
    }

    /**
     * 执行实际的进度定位
     */
    performSeek(event) {
        if (!this.audioPlayer || !this.progressOverlay || !this.audioPlayer.duration) return;
        
        const rect = this.progressOverlay.getBoundingClientRect();
        const clientX = (event.touches && event.touches.length) ? event.touches[0].clientX : event.clientX;
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const newTime = ratio * this.audioPlayer.duration;
        
        console.log(`定位到: ${this.formatTime(newTime)} (${(ratio * 100).toFixed(1)}%)`);
        
        this.audioPlayer.currentTime = newTime;
        if (this.progressMask) this.progressMask.style.width = `${ratio * 100}%`;
        this.currentTimeEl.textContent = this.formatTime(newTime);
    }

    /**
     * 更新总时长显示
     */
    updateDuration() {
        if (this.audioPlayer.duration) {
            this.totalDurationEl.textContent = this.formatTime(this.audioPlayer.duration);
        }
    }

    /**
     * 切换静音
     */
    toggleMute() {
        if (this.audioPlayer.volume > 0) {
            this.lastVolume = this.audioPlayer.volume;
            this.audioPlayer.volume = 0;
            this.volumeSlider.value = 0;
            this.updateVolumeIcon(false);
        } else {
            this.audioPlayer.volume = this.lastVolume;
            this.volumeSlider.value = this.lastVolume;
            this.updateVolumeIcon(true);
        }
    }

    /**
     * 设置音量
     */
    setVolume(e) {
        this.audioPlayer.volume = e.target.value;
        this.updateVolumeIcon(this.audioPlayer.volume > 0);
    }

    /**
     * 切换歌词显示
     */
    toggleLyrics() {
        this.areLyricsVisible = !this.areLyricsVisible;
        this.lyricsContainer.classList.toggle('active');
    }

    /**
     * 切换频谱动画显示
     */
    toggleSpectrum() {
        this.isSpectrumEnabled = !this.isSpectrumEnabled;
        
        if (this.isSpectrumEnabled) {
            // 如果当前正在播放，启动频谱动画
            if (this.isPlaying) {
                this.startSpectrumAnimation();
            }
        } else {
            // 停止频谱动画
            this.stopSpectrumAnimation();
        }
        
        // 更新图标显示
        this.updateSpectrumToggleIcon();
    }

    /**
     * 切换播放列表显示
     */
    togglePlaylist() {
        this.playlistOverlay.classList.toggle('active');
    }

    /**
     * 渲染播放列表
     */
    renderPlaylist() {
        this.playlistContainer.innerHTML = '';
        
        this.playlist.forEach((song, index) => {
            const songElement = document.createElement('div');
            songElement.className = `playlist-item ${index === this.currentSongIndex ? 'active' : ''}`;
            songElement.innerHTML = `
                <div class="song-info">
                    <div class="song-title">${song.title}</div>
                    <div class="song-artist">${song.artist}</div>
                </div>
            `;
            songElement.addEventListener('click', () => {
                this.loadSong(index);
                this.togglePlaylist();
            });
            this.playlistContainer.appendChild(songElement);
        });
    }

    /**
     * 更新播放列表显示
     */
    updatePlaylistDisplay() {
        const items = this.playlistContainer.querySelectorAll('.playlist-item');
        items.forEach((item, index) => {
            item.classList.toggle('active', index === this.currentSongIndex);
        });
    }

    /**
     * 更新播放按钮状态
     */
    updatePlayButton(isPlaying) {
        if (isPlaying) {
            this.playIcon.classList.add('hidden');
            this.pauseIcon.classList.remove('hidden');
        } else {
            this.playIcon.classList.remove('hidden');
            this.pauseIcon.classList.add('hidden');
        }
    }

    /**
     * 更新音量图标
     */
    updateVolumeIcon(hasVolume) {
        if (hasVolume) {
            this.volumeHighIcon.classList.remove('hidden');
            this.volumeMuteIcon.classList.add('hidden');
        } else {
            this.volumeHighIcon.classList.add('hidden');
            this.volumeMuteIcon.classList.remove('hidden');
        }
    }

    /**
     * 更新频谱开关图标
     */
    updateSpectrumToggleIcon() {
        if (this.isSpectrumEnabled) {
            this.spectrumOnIcon.classList.remove('hidden');
            this.spectrumOffIcon.classList.add('hidden');
        } else {
            this.spectrumOnIcon.classList.add('hidden');
            this.spectrumOffIcon.classList.remove('hidden');
        }
    }

    /**
     * 更换背景图片
     */
    changeBackground(imageUrl) {
        if (!imageUrl) return;
        
        const tempImg = new Image();
        tempImg.src = imageUrl;
        tempImg.onload = () => {
            this.playerContainer.style.opacity = '0';
            setTimeout(() => {
                this.playerContainer.style.backgroundImage = `url('${imageUrl}')`;
                this.playerContainer.style.opacity = '1';
            }, 500);
        };
        tempImg.onerror = () => {
            console.warn('背景图片加载失败:', imageUrl);
        };
    }

    /**
     * 处理歌曲结束
     */
    handleSongEnd() {
        console.log('歌曲播放结束，准备播放下一首');
        
        // 记录用户偏好
        this.recordUserPreference(this.currentSongIndex);
        
        // 根据播放模式决定下一首
        const nextIndex = this.getNextSongIndex();
        
        if (nextIndex !== null) {
            this.loadSong(nextIndex);
            // 自动播放下一首
            setTimeout(() => {
                this.playAudio();
            }, 100);
        } else {
            // 播放列表结束
            this.pauseAudio();
            this.audioPlayer.currentTime = 0;
            this.stopSpectrumAnimation();
            this.showPlaylistEndMessage();
        }
    }

    /**
     * 处理音频错误
     */
    handleAudioError(e) {
        console.error('音频播放错误:', e);
        this.showError('音频播放出错，请检查文件路径');
        this.pauseAudio();
    }

    /**
     * 处理键盘快捷键
     */
    handleKeyboard(e) {
        if (!this.isInitialized) return;
        
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.prevSong();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextSong();
                break;
            case 'KeyL':
                e.preventDefault();
                this.toggleLyrics();
                break;
            case 'KeyP':
                e.preventDefault();
                this.togglePlaylist();
                break;
            case 'KeyS':
                e.preventDefault();
                this.toggleSpectrum();
                break;
            case 'KeyM':
                e.preventDefault();
                this.cyclePlayMode();
                break;
            case 'KeyR':
                e.preventDefault();
                this.toggleRepeatMode();
                break;
        }
    }

    /**
     * 格式化时间
     */
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    /**
     * 显示加载状态
     */
    showLoading(show) {
        document.body.classList.toggle('loading', show);
    }

    /**
     * 显示错误信息
     */
    showError(message) {
        // 创建错误提示元素
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.textContent = message;
        
        // 添加到页面
        document.body.appendChild(errorEl);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (errorEl.parentNode) {
                errorEl.parentNode.removeChild(errorEl);
            }
        }, 3000);
    }

    /**
     * 绑定播放模式切换事件
     */
    bindPlayModeEvents() {
        // 查找播放模式按钮（如果存在）
        const modeButtons = document.querySelectorAll('[data-play-mode]');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.playMode;
                this.setPlayMode(mode);
            });
        });
    }

    /**
     * 设置播放模式
     */
    setPlayMode(mode) {
        const validModes = ['sequential', 'shuffle', 'repeat-one', 'repeat-all'];
        if (!validModes.includes(mode)) {
            console.warn('无效的播放模式:', mode);
            return;
        }

        this.playMode = mode;
        this.updatePlayModeUI();
        this.saveUserPreferences();
        
        console.log('播放模式已切换为:', this.getPlayModeDisplayName(mode));
    }

    /**
     * 获取播放模式显示名称
     */
    getPlayModeDisplayName(mode) {
        const modeNames = {
            'sequential': '顺序播放',
            'shuffle': '随机播放',
            'repeat-one': '单曲循环',
            'repeat-all': '列表循环'
        };
        return modeNames[mode] || mode;
    }

    /**
     * 更新播放模式UI
     */
    updatePlayModeUI() {
        // 移除所有模式按钮的active状态
        const modeButtons = document.querySelectorAll('[data-play-mode]');
        modeButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.playMode === this.playMode) {
                btn.classList.add('active');
            }
        });
    }

    /**
     * 获取下一首歌曲索引
     */
    getNextSongIndex() {
        if (this.playlist.length === 0) return null;

        switch (this.playMode) {
            case 'sequential':
                return this.getNextSequentialIndex();
            case 'shuffle':
                return this.getNextShuffleIndex();
            case 'repeat-one':
                return this.currentSongIndex; // 重复当前歌曲
            case 'repeat-all':
                return this.getNextRepeatAllIndex();
            default:
                return this.getNextSequentialIndex();
        }
    }

    /**
     * 顺序播放模式 - 获取下一首索引
     */
    getNextSequentialIndex() {
        const nextIndex = this.currentSongIndex + 1;
        return nextIndex < this.playlist.length ? nextIndex : null;
    }

    /**
     * 随机播放模式 - 获取下一首索引
     */
    getNextShuffleIndex() {
        if (this.playlist.length <= 1) return this.currentSongIndex;

        // 避免连续播放同一首歌
        let nextIndex;
        do {
            nextIndex = Math.floor(Math.random() * this.playlist.length);
        } while (nextIndex === this.currentSongIndex && this.playlist.length > 1);

        // 记录随机播放历史
        this.shuffleHistory.push(nextIndex);
        if (this.shuffleHistory.length > 10) {
            this.shuffleHistory.shift();
        }

        return nextIndex;
    }

    /**
     * 列表循环模式 - 获取下一首索引
     */
    getNextRepeatAllIndex() {
        const nextIndex = this.currentSongIndex + 1;
        return nextIndex < this.playlist.length ? nextIndex : 0; // 循环到第一首
    }

    /**
     * 智能推荐下一首歌曲
     */
    getRecommendedNextSong() {
        if (this.playlist.length <= 1) return this.currentSongIndex;

        // 基于用户偏好的推荐算法
        const recommendations = this.calculateRecommendations();
        
        // 根据播放模式调整推荐
        if (this.playMode === 'shuffle') {
            // 随机播放时，增加推荐权重
            return this.selectFromRecommendations(recommendations, 0.7);
        } else {
            // 顺序播放时，保持顺序但考虑推荐
            return this.selectFromRecommendations(recommendations, 0.3);
        }
    }

    /**
     * 计算歌曲推荐分数
     */
    calculateRecommendations() {
        const recommendations = [];
        
        this.playlist.forEach((song, index) => {
            if (index === this.currentSongIndex) {
                recommendations.push({ index, score: 0 }); // 当前歌曲不推荐
                return;
            }

            let score = 0;
            
            // 基于用户偏好评分
            const preference = this.userPreferences[index] || 0;
            score += preference * 0.4;
            
            // 基于播放频率评分
            const playCount = this.userPreferences[`playCount_${index}`] || 0;
            score += Math.min(playCount * 0.1, 0.3); // 最高0.3分
            
            // 基于相似度评分（如果有标签信息）
            if (song.tags && this.playlist[this.currentSongIndex].tags) {
                const similarity = this.calculateTagSimilarity(
                    song.tags, 
                    this.playlist[this.currentSongIndex].tags
                );
                score += similarity * 0.2;
            }
            
            // 基于艺术家相似度
            if (song.artist === this.playlist[this.currentSongIndex].artist) {
                score += 0.1;
            }
            
            recommendations.push({ index, score });
        });
        
        // 按分数排序
        recommendations.sort((a, b) => b.score - a.score);
        return recommendations;
    }

    /**
     * 从推荐列表中选择歌曲
     */
    selectFromRecommendations(recommendations, recommendationWeight) {
        if (Math.random() < recommendationWeight && recommendations.length > 0) {
            // 使用推荐
            const topRecommendations = recommendations.slice(0, 3);
            const randomIndex = Math.floor(Math.random() * topRecommendations.length);
            return topRecommendations[randomIndex].index;
        } else {
            // 使用默认逻辑
            return this.getNextSongIndex();
        }
    }

    /**
     * 计算标签相似度
     */
    calculateTagSimilarity(tags1, tags2) {
        if (!tags1 || !tags2 || tags1.length === 0 || tags2.length === 0) {
            return 0;
        }
        
        const set1 = new Set(tags1.map(tag => tag.toLowerCase()));
        const set2 = new Set(tags2.map(tag => tag.toLowerCase()));
        
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        return intersection.size / union.size;
    }

    /**
     * 记录用户偏好
     */
    recordUserPreference(songIndex) {
        if (!this.userPreferences[songIndex]) {
            this.userPreferences[songIndex] = 0;
        }
        
        // 增加偏好分数
        this.userPreferences[songIndex] += 1;
        
        // 记录播放次数
        const playCountKey = `playCount_${songIndex}`;
        this.userPreferences[playCountKey] = (this.userPreferences[playCountKey] || 0) + 1;
        
        // 保存偏好
        this.saveUserPreferences();
    }

    /**
     * 加载用户偏好
     */
    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('musicPlayer_preferences');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.warn('加载用户偏好失败:', error);
            return {};
        }
    }

    /**
     * 保存用户偏好
     */
    saveUserPreferences() {
        try {
            localStorage.setItem('musicPlayer_preferences', JSON.stringify(this.userPreferences));
        } catch (error) {
            console.warn('保存用户偏好失败:', error);
        }
    }

    /**
     * 显示播放列表结束消息
     */
    showPlaylistEndMessage() {
        const message = this.playMode === 'repeat-all' ? 
            '播放列表已循环完成' : '播放列表已播放完毕';
        
        // 创建提示元素
        const endMessageEl = document.createElement('div');
        endMessageEl.className = 'playlist-end-message';
        endMessageEl.innerHTML = `
            <div class="message-content">
                <h3>${message}</h3>
                <p>感谢您的聆听！</p>
                <button onclick="this.parentElement.parentElement.remove()">确定</button>
            </div>
        `;
        
        document.body.appendChild(endMessageEl);
        
        // 5秒后自动移除
        setTimeout(() => {
            if (endMessageEl.parentNode) {
                endMessageEl.parentNode.removeChild(endMessageEl);
            }
        }, 5000);
    }

    /**
     * 获取当前播放模式
     */
    getCurrentPlayMode() {
        return this.playMode;
    }

    /**
     * 获取播放统计信息
     */
    getPlayStats() {
        const totalPlays = Object.keys(this.userPreferences)
            .filter(key => key.startsWith('playCount_'))
            .reduce((sum, key) => sum + (this.userPreferences[key] || 0), 0);
        
        const favoriteSongs = Object.keys(this.userPreferences)
            .filter(key => !key.startsWith('playCount_'))
            .map(key => ({
                index: parseInt(key),
                preference: this.userPreferences[key]
            }))
            .sort((a, b) => b.preference - a.preference)
            .slice(0, 5);
        
        return {
            totalPlays,
            favoriteSongs,
            currentMode: this.playMode,
            playlistLength: this.playlist.length
        };
    }

    /**
     * 循环切换播放模式
     */
    cyclePlayMode() {
        const modes = ['sequential', 'shuffle', 'repeat-one', 'repeat-all'];
        const currentIndex = modes.indexOf(this.playMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        this.setPlayMode(modes[nextIndex]);
        
        // 显示模式切换提示
        this.showModeChangeNotification(modes[nextIndex]);
    }

    /**
     * 切换重复模式
     */
    toggleRepeatMode() {
        if (this.playMode === 'repeat-one') {
            this.setPlayMode('sequential');
        } else if (this.playMode === 'repeat-all') {
            this.setPlayMode('sequential');
        } else {
            this.setPlayMode('repeat-one');
        }
        
        this.showModeChangeNotification(this.playMode);
    }

    /**
     * 显示模式切换通知
     */
    showModeChangeNotification(mode) {
        const notificationEl = document.createElement('div');
        notificationEl.className = 'mode-notification';
        notificationEl.innerHTML = `
            <div class="notification-content">
                <span class="mode-icon">${this.getModeIcon(mode)}</span>
                <span class="mode-text">${this.getPlayModeDisplayName(mode)}</span>
            </div>
        `;
        
        document.body.appendChild(notificationEl);
        
        // 2秒后自动移除
        setTimeout(() => {
            if (notificationEl.parentNode) {
                notificationEl.parentNode.removeChild(notificationEl);
            }
        }, 2000);
    }

    /**
     * 获取播放模式图标
     */
    getModeIcon(mode) {
        const icons = {
            'sequential': '▶️',
            'shuffle': '🔀',
            'repeat-one': '🔂',
            'repeat-all': '🔁'
        };
        return icons[mode] || '▶️';
    }

    /**
     * 初始化音频分析器
     */
    initializeAudioAnalyser() {
        try {
            // 创建音频上下文
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 创建分析器节点
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.8;
            
            // 创建音频源
            this.audioSource = this.audioContext.createMediaElementSource(this.audioPlayer);
            this.audioSource.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            // 初始化频率数据数组
            this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
            
            // 设置Canvas尺寸
            this.setupCanvas();
            
            console.log('音频分析器初始化成功');
            
        } catch (error) {
            console.warn('音频分析器初始化失败:', error);
            this.audioContext = null;
        }
    }

    /**
     * 设置Canvas尺寸
     */
    setupCanvas() {
        const container = this.spectrumContainer;
        const canvas = this.spectrumCanvas;
        
        // 获取容器的实际尺寸
        const rect = container.getBoundingClientRect();
        
        // 设置Canvas的显示尺寸
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        
        // 设置Canvas的实际像素尺寸（考虑设备像素比）
        const devicePixelRatio = window.devicePixelRatio || 1;
        canvas.width = rect.width * devicePixelRatio;
        canvas.height = rect.height * devicePixelRatio;
        
        // 缩放上下文以匹配设备像素比
        this.spectrumCtx.scale(devicePixelRatio, devicePixelRatio);
    }

    /**
     * 初始化进度波形Canvas大小
     */
    setupProgressWaveCanvas() {
        if (!this.waveCanvas || !this.waveCtx) return;
        const rect = this.waveCanvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.waveCanvas.width = Math.max(1, Math.floor(rect.width * dpr));
        this.waveCanvas.height = Math.max(1, Math.floor(rect.height * dpr));
        this.waveCtx.setTransform(1, 0, 0, 1, 0, 0);
        this.waveCtx.scale(dpr, dpr);
    }

    /**
     * 开始频谱动画
     */
    startSpectrumAnimation() {
        if (!this.audioContext) {
            this.initializeAudioAnalyser();
        }
        
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.isSpectrumActive = true;
        this.spectrumContainer.classList.add('active');
        this.drawSpectrum();
    }

    /**
     * 使用 requestAnimationFrame 绘制简单波形动画背景
     */
    startProgressWaveAnimation() { /* 已移除波浪动画 */ }

    /**
     * 停止频谱动画
     */
    stopSpectrumAnimation() {
        this.isSpectrumActive = false;
        this.spectrumContainer.classList.remove('active');
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // 清空Canvas
        this.clearCanvas();
    }

    /**
     * 绘制频谱动画
     */
    drawSpectrum() {
        if (!this.isSpectrumActive || !this.analyser) {
            return;
        }

        // 获取频率数据
        this.analyser.getByteFrequencyData(this.frequencyData);
        
        // 清空Canvas
        this.clearCanvas();
        
        // 绘制频谱柱状图
        this.drawBars();
        
        // 继续动画
        this.animationId = requestAnimationFrame(() => this.drawSpectrum());
    }

    /**
     * 清空Canvas
     */
    clearCanvas() {
        const canvas = this.spectrumCanvas;
        this.spectrumCtx.clearRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
    }

    /**
     * 绘制频谱柱状图
     */
    drawBars() {
        const canvas = this.spectrumCanvas;
        const ctx = this.spectrumCtx;
        const canvasWidth = canvas.width / (window.devicePixelRatio || 1);
        const canvasHeight = canvas.height / (window.devicePixelRatio || 1);
        
        // 频谱柱的数量（取频率数据的一部分，避免过于密集）
        const barCount = Math.min(64, this.frequencyData.length);
        const barWidth = canvasWidth / barCount;
        const barSpacing = barWidth * 0.1; // 10%的间距
        const actualBarWidth = barWidth - barSpacing;
        
        // 设置绘制样式
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        // 绘制每个频谱柱
        for (let i = 0; i < barCount; i++) {
            // 获取频率数据（归一化到0-1）
            const frequency = this.frequencyData[i] / 255;
            
            // 计算柱子高度（添加一些随机跳动效果）
            const baseHeight = frequency * canvasHeight * 0.8;
            const jumpEffect = Math.random() * frequency * canvasHeight * 0.1;
            const barHeight = Math.max(2, baseHeight + jumpEffect);
            
            // 计算柱子位置
            const x = i * barWidth + barSpacing / 2;
            const y = canvasHeight - barHeight;
            
            // 绘制柱子（添加圆角效果）
            this.drawRoundedBar(ctx, x, y, actualBarWidth, barHeight);
        }
    }

    /**
     * 绘制圆角柱状图
     */
    drawRoundedBar(ctx, x, y, width, height) {
        const radius = Math.min(width / 4, 2);
        
        ctx.beginPath();
        ctx.moveTo(x + radius, y + height);
        ctx.lineTo(x + radius, y + radius);
        ctx.arcTo(x, y, x + width, y, radius);
        ctx.lineTo(x + width - radius, y);
        ctx.arcTo(x + width, y, x + width, y + radius, radius);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x, y + height);
        ctx.closePath();
        ctx.fill();
    }

    /**
     * 处理窗口尺寸变化
     */
    handleResize() {
        if (this.spectrumCanvas) {
            this.setupCanvas();
        }
        this.setupProgressWaveCanvas();
    }
}

// 初始化播放器
document.addEventListener('DOMContentLoaded', async () => {
    console.log('正在初始化音乐播放器...');
    
    // 创建播放器实例
    window.musicPlayer = new MusicPlayer();
    
    // 初始化播放器
    await window.musicPlayer.initialize();
    
    // 监听窗口大小变化
    window.addEventListener('resize', () => {
        if (window.musicPlayer) {
            window.musicPlayer.handleResize();
        }
    });
});