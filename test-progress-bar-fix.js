/**
 * 测试进度条修复效果的脚本
 */

// 创建测试环境
function createTestEnvironment() {
    console.log('创建测试环境...');
    
    // 模拟DOM元素
    const mockElements = {
        progressOverlay: {
            getBoundingClientRect: () => ({ left: 0, width: 1000 }),
            addEventListener: (event, handler) => console.log(`监听器已添加: ${event}`)
        },
        audioPlayer: {
            duration: undefined, // 模拟duration未加载的情况
            currentTime: 0,
            readyState: 0,
            addEventListener: (event, handler) => {
                console.log(`音频监听器已添加: ${event}`);
                // 模拟loadedmetadata事件
                if (event === 'loadedmetadata') {
                    setTimeout(() => {
                        console.log('模拟loadedmetadata事件触发');
                        mockElements.audioPlayer.duration = 180; // 3分钟
                        mockElements.audioPlayer.readyState = 1;
                        handler();
                    }, 100);
                }
            },
            removeEventListener: (event, handler) => console.log(`音频监听器已移除: ${event}`),
            load: () => {
                console.log('音频load()方法被调用');
                // 模拟元数据加载
                setTimeout(() => {
                    mockElements.audioPlayer.duration = 180;
                    mockElements.audioPlayer.readyState = 1;
                }, 50);
            }
        },
        progressMask: {
            style: { width: '0%' }
        },
        currentTimeEl: {
            textContent: '0:00'
        }
    };
    
    return mockElements;
}

// 模拟MusicPlayer的相关方法
function createMockPlayer(elements) {
    return {
        audioPlayer: elements.audioPlayer,
        progressOverlay: elements.progressOverlay,
        progressMask: elements.progressMask,
        currentTimeEl: elements.currentTimeEl,
        isDraggingProgress: false,
        
        formatTime: (seconds) => {
            const minutes = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
        },
        
        showError: (message) => {
            console.log(`错误提示: ${message}`);
        },
        
        // 新的修复后的方法
        handleProgressDown: function(event) {
            if (!this.audioPlayer || !this.progressOverlay) return;
            this.isDraggingProgress = true;
            this.seekByEvent(event);
        },
        
        seekByEvent: function(event) {
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
        },
        
        performSeek: function(event) {
            if (!this.audioPlayer || !this.progressOverlay || !this.audioPlayer.duration) return;
            
            const rect = this.progressOverlay.getBoundingClientRect();
            const clientX = event.clientX || 500; // 模拟点击位置
            const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
            const newTime = ratio * this.audioPlayer.duration;
            
            console.log(`定位到: ${this.formatTime(newTime)} (${(ratio * 100).toFixed(1)}%)`);
            
            this.audioPlayer.currentTime = newTime;
            if (this.progressMask) this.progressMask.style.width = `${ratio * 100}%`;
            this.currentTimeEl.textContent = this.formatTime(newTime);
        }
    };
}

// 运行测试
async function runTests() {
    console.log('======= 进度条修复测试开始 =======\n');
    
    // 测试1: 模拟本地音频文件（duration未加载）
    console.log('测试1: 模拟本地音频文件进度条点击（duration未加载）');
    const elements1 = createTestEnvironment();
    const player1 = createMockPlayer(elements1);
    
    // 模拟用户点击进度条中间位置
    const clickEvent1 = { clientX: 500 };
    console.log('模拟用户点击进度条中间位置...');
    player1.handleProgressDown(clickEvent1);
    
    // 等待元数据加载完成
    await new Promise(resolve => setTimeout(resolve, 200));
    console.log(`最终音频位置: ${player1.formatTime(player1.audioPlayer.currentTime)}`);
    console.log(`进度条宽度: ${player1.progressMask.style.width}\n`);
    
    // 测试2: 模拟duration已加载的情况
    console.log('测试2: 模拟远程音频文件进度条点击（duration已加载）');
    const elements2 = createTestEnvironment();
    elements2.audioPlayer.duration = 240; // 4分钟，预先加载
    elements2.audioPlayer.readyState = 1;
    const player2 = createMockPlayer(elements2);
    
    // 模拟用户点击进度条75%位置
    const clickEvent2 = { clientX: 750 };
    console.log('模拟用户点击进度条75%位置...');
    player2.handleProgressDown(clickEvent2);
    
    console.log(`最终音频位置: ${player2.formatTime(player2.audioPlayer.currentTime)}`);
    console.log(`进度条宽度: ${player2.progressMask.style.width}\n`);
    
    // 测试3: 模拟无效duration的情况
    console.log('测试3: 模拟音频文件加载失败的情况');
    const elements3 = createTestEnvironment();
    elements3.audioPlayer.duration = NaN;
    elements3.audioPlayer.readyState = 2;
    const player3 = createMockPlayer(elements3);
    
    const clickEvent3 = { clientX: 300 };
    console.log('模拟用户点击进度条...');
    player3.handleProgressDown(clickEvent3);
    
    console.log('======= 测试完成 =======');
}

// 如果是在Node.js环境中运行
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runTests };
    
    // 直接运行测试
    runTests().catch(console.error);
} else {
    // 在浏览器中运行
    window.runProgressBarTests = runTests;
    console.log('测试函数已加载，请在浏览器控制台中运行: runProgressBarTests()');
}
