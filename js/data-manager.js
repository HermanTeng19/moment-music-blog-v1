/**
 * 数据管理器 - 负责加载和管理音乐数据
 */
class DataManager {
    constructor() {
        this.playlist = null;
        this.songs = new Map();
        this.lyrics = new Map();
        this.isInitialized = false;
    }

    /**
     * 初始化数据管理器，加载播放列表
     */
    async initialize() {
        try {
            await this.loadPlaylist();
            await this.loadAllSongs();
            this.isInitialized = true;
            console.log('数据管理器初始化完成');
            return true;
        } catch (error) {
            console.error('数据管理器初始化失败:', error);
            return false;
        }
    }

    /**
     * 加载播放列表配置
     */
    async loadPlaylist() {
        try {
            const response = await fetch('data/playlist.json');
            if (!response.ok) {
                throw new Error(`加载播放列表失败: ${response.status}`);
            }
            this.playlist = await response.json();
            console.log('播放列表加载完成:', this.playlist.name);
        } catch (error) {
            console.error('加载播放列表出错:', error);
            throw error;
        }
    }

    /**
     * 加载所有歌曲数据
     */
    async loadAllSongs() {
        if (!this.playlist || !this.playlist.songs) {
            throw new Error('播放列表未加载或为空');
        }

        const loadPromises = this.playlist.songs.map(songId => this.loadSong(songId));
        await Promise.all(loadPromises);
        console.log(`成功加载 ${this.songs.size} 首歌曲`);
    }

    /**
     * 加载单首歌曲数据
     */
    async loadSong(songId) {
        try {
            const response = await fetch(`data/songs/${songId}.json`);
            if (!response.ok) {
                throw new Error(`加载歌曲 ${songId} 失败: ${response.status}`);
            }
            const songData = await response.json();
            this.songs.set(songId, songData);
            
            // 预加载歌词
            await this.loadLyrics(songId, songData.lyricsSrc);
            
            return songData;
        } catch (error) {
            console.error(`加载歌曲 ${songId} 出错:`, error);
            throw error;
        }
    }

    /**
     * 加载歌词文件
     */
    async loadLyrics(songId, lyricsSrc) {
        try {
            const response = await fetch(lyricsSrc);
            if (response.ok) {
                const lyricsText = await response.text();
                this.lyrics.set(songId, lyricsText);
            } else {
                console.warn(`歌词文件 ${lyricsSrc} 加载失败`);
                this.lyrics.set(songId, '暂无歌词');
            }
        } catch (error) {
            console.warn(`加载歌词 ${songId} 出错:`, error);
            this.lyrics.set(songId, '歌词加载失败');
        }
    }

    /**
     * 获取播放列表信息
     */
    getPlaylistInfo() {
        return this.playlist;
    }

    /**
     * 获取所有歌曲数据（转换为数组格式）
     */
    getAllSongs() {
        if (!this.playlist || !this.playlist.songs) {
            return [];
        }
        
        return this.playlist.songs.map(songId => {
            const song = this.songs.get(songId);
            const lyrics = this.lyrics.get(songId) || '';
            
            return {
                id: song.id,
                title: song.title,
                artist: song.artist,
                audioSrc: song.audioSrc,
                imageSrc: song.backgroundSrc, // 使用背景图作为主图
                coverSrc: song.coverSrc || song.backgroundSrc, // 如果没有封面，使用背景图
                lyrics: lyrics,
                duration: song.duration || '未知',
                album: song.album || '',
                genre: song.genre || '',
                tags: song.tags || [],
                description: song.description || ''
            };
        }).filter(song => song); // 过滤掉无效数据
    }

    /**
     * 根据ID获取歌曲数据
     */
    getSongById(songId) {
        const song = this.songs.get(songId);
        if (!song) return null;
        
        const lyrics = this.lyrics.get(songId) || '';
        
        return {
            id: song.id,
            title: song.title,
            artist: song.artist,
            audioSrc: song.audioSrc,
            imageSrc: song.backgroundSrc,
            coverSrc: song.coverSrc || song.backgroundSrc,
            lyrics: lyrics,
            duration: song.duration || '未知',
            album: song.album || '',
            genre: song.genre || '',
            tags: song.tags || [],
            description: song.description || ''
        };
    }

    /**
     * 根据索引获取歌曲数据
     */
    getSongByIndex(index) {
        if (!this.playlist || !this.playlist.songs) {
            return null;
        }
        
        const songId = this.playlist.songs[index];
        return songId ? this.getSongById(songId) : null;
    }

    /**
     * 获取歌曲总数
     */
    getSongCount() {
        return this.playlist ? this.playlist.songs.length : 0;
    }

    /**
     * 检查是否已初始化
     */
    isReady() {
        return this.isInitialized;
    }

    /**
     * 搜索歌曲（根据标题、艺术家、标签等）
     */
    searchSongs(query) {
        const allSongs = this.getAllSongs();
        const lowerQuery = query.toLowerCase();
        
        return allSongs.filter(song => {
            return song.title.toLowerCase().includes(lowerQuery) ||
                   song.artist.toLowerCase().includes(lowerQuery) ||
                   (song.album && song.album.toLowerCase().includes(lowerQuery)) ||
                   (song.genre && song.genre.toLowerCase().includes(lowerQuery)) ||
                   (song.tags && song.tags.some(tag => tag.toLowerCase().includes(lowerQuery)));
        });
    }

    /**
     * 获取统计信息
     */
    getStats() {
        return {
            totalSongs: this.getSongCount(),
            totalDuration: '未知',
            genres: [],
            playlistName: this.playlist?.name || '未知播放列表'
        };
    }
}

// 创建全局数据管理器实例
window.dataManager = new DataManager();