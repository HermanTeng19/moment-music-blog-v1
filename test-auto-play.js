/**
 * 自动播放下一首功能测试脚本
 * 用于验证播放模式、智能推荐和用户偏好学习功能
 */

class AutoPlayTester {
    constructor() {
        this.testResults = [];
        this.player = null;
    }

    /**
     * 运行所有测试
     */
    async runAllTests() {
        console.log('🚀 开始自动播放功能测试...\n');
        
        // 等待播放器初始化
        await this.waitForPlayer();
        
        // 运行测试用例
        await this.testPlayModes();
        await this.testUserPreferences();
        await this.testSmartRecommendations();
        await this.testAutoPlayBehavior();
        await this.testKeyboardShortcuts();
        
        // 输出测试结果
        this.printTestResults();
    }

    /**
     * 等待播放器初始化
     */
    async waitForPlayer() {
        console.log('⏳ 等待播放器初始化...');
        
        return new Promise((resolve) => {
            const checkPlayer = () => {
                if (window.musicPlayer && window.musicPlayer.isInitialized) {
                    this.player = window.musicPlayer;
                    console.log('✅ 播放器已初始化');
                    resolve();
                } else {
                    setTimeout(checkPlayer, 100);
                }
            };
            checkPlayer();
        });
    }

    /**
     * 测试播放模式功能
     */
    async testPlayModes() {
        console.log('\n📋 测试播放模式功能...');
        
        const modes = ['sequential', 'shuffle', 'repeat-one', 'repeat-all'];
        const testCases = [
            {
                name: '顺序播放模式',
                mode: 'sequential',
                currentIndex: 0,
                expectedNext: 1
            },
            {
                name: '随机播放模式',
                mode: 'shuffle',
                currentIndex: 0,
                expectedNext: 'random'
            },
            {
                name: '单曲循环模式',
                mode: 'repeat-one',
                currentIndex: 2,
                expectedNext: 2
            },
            {
                name: '列表循环模式',
                mode: 'repeat-all',
                currentIndex: this.player.playlist.length - 1,
                expectedNext: 0
            }
        ];

        for (const testCase of testCases) {
            try {
                // 设置播放模式
                this.player.setPlayMode(testCase.mode);
                this.player.currentSongIndex = testCase.currentIndex;
                
                // 获取下一首索引
                const nextIndex = this.player.getNextSongIndex();
                
                // 验证结果
                let passed = false;
                if (testCase.expectedNext === 'random') {
                    passed = nextIndex !== testCase.currentIndex && nextIndex >= 0 && nextIndex < this.player.playlist.length;
                } else {
                    passed = nextIndex === testCase.expectedNext;
                }
                
                this.recordTestResult(testCase.name, passed, {
                    expected: testCase.expectedNext,
                    actual: nextIndex,
                    mode: testCase.mode
                });
                
            } catch (error) {
                this.recordTestResult(testCase.name, false, { error: error.message });
            }
        }
    }

    /**
     * 测试用户偏好学习功能
     */
    async testUserPreferences() {
        console.log('\n📋 测试用户偏好学习功能...');
        
        const testCases = [
            {
                name: '记录用户偏好',
                action: () => {
                    const initialPrefs = { ...this.player.userPreferences };
                    this.player.recordUserPreference(0);
                    return this.player.userPreferences[0] > (initialPrefs[0] || 0);
                }
            },
            {
                name: '偏好数据持久化',
                action: () => {
                    const testKey = 'test_preference';
                    this.player.userPreferences[testKey] = 42;
                    this.player.saveUserPreferences();
                    
                    // 重新加载偏好
                    const newPlayer = new MusicPlayer();
                    const loadedPrefs = newPlayer.loadUserPreferences();
                    return loadedPrefs[testKey] === 42;
                }
            },
            {
                name: '播放次数统计',
                action: () => {
                    const initialCount = this.player.userPreferences['playCount_1'] || 0;
                    this.player.recordUserPreference(1);
                    return this.player.userPreferences['playCount_1'] === initialCount + 1;
                }
            }
        ];

        for (const testCase of testCases) {
            try {
                const result = testCase.action();
                this.recordTestResult(testCase.name, result);
            } catch (error) {
                this.recordTestResult(testCase.name, false, { error: error.message });
            }
        }
    }

    /**
     * 测试智能推荐功能
     */
    async testSmartRecommendations() {
        console.log('\n📋 测试智能推荐功能...');
        
        const testCases = [
            {
                name: '推荐算法计算',
                action: () => {
                    const recommendations = this.player.calculateRecommendations();
                    return recommendations.length > 0 && 
                           recommendations.every(rec => typeof rec.index === 'number' && typeof rec.score === 'number');
                }
            },
            {
                name: '标签相似度计算',
                action: () => {
                    const tags1 = ['pop', 'rock', 'electronic'];
                    const tags2 = ['pop', 'jazz', 'electronic'];
                    const similarity = this.player.calculateTagSimilarity(tags1, tags2);
                    return similarity > 0 && similarity <= 1;
                }
            },
            {
                name: '推荐选择逻辑',
                action: () => {
                    const recommendations = [
                        { index: 1, score: 0.8 },
                        { index: 2, score: 0.6 },
                        { index: 3, score: 0.4 }
                    ];
                    const selected = this.player.selectFromRecommendations(recommendations, 1.0);
                    return selected >= 0 && selected < this.player.playlist.length;
                }
            }
        ];

        for (const testCase of testCases) {
            try {
                const result = testCase.action();
                this.recordTestResult(testCase.name, result);
            } catch (error) {
                this.recordTestResult(testCase.name, false, { error: error.message });
            }
        }
    }

    /**
     * 测试自动播放行为
     */
    async testAutoPlayBehavior() {
        console.log('\n📋 测试自动播放行为...');
        
        const testCases = [
            {
                name: '歌曲结束自动播放',
                action: () => {
                    const originalNextSong = this.player.nextSong.bind(this.player);
                    let autoPlayTriggered = false;
                    
                    // 模拟歌曲结束事件
                    this.player.handleSongEnd();
                    
                    // 检查是否触发了自动播放逻辑
                    return this.player.getNextSongIndex() !== null;
                }
            },
            {
                name: '播放列表结束处理',
                action: () => {
                    // 设置为顺序播放模式并模拟播放列表结束
                    this.player.setPlayMode('sequential');
                    this.player.currentSongIndex = this.player.playlist.length - 1;
                    
                    const nextIndex = this.player.getNextSongIndex();
                    return nextIndex === null; // 顺序播放模式下，最后一首后应该返回null
                }
            },
            {
                name: '播放模式切换通知',
                action: () => {
                    const originalShowNotification = this.player.showModeChangeNotification.bind(this.player);
                    let notificationShown = false;
                    
                    this.player.showModeChangeNotification = (mode) => {
                        notificationShown = true;
                        originalShowNotification(mode);
                    };
                    
                    this.player.cyclePlayMode();
                    return notificationShown;
                }
            }
        ];

        for (const testCase of testCases) {
            try {
                const result = testCase.action();
                this.recordTestResult(testCase.name, result);
            } catch (error) {
                this.recordTestResult(testCase.name, false, { error: error.message });
            }
        }
    }

    /**
     * 测试键盘快捷键
     */
    async testKeyboardShortcuts() {
        console.log('\n📋 测试键盘快捷键...');
        
        const testCases = [
            {
                name: '播放模式切换快捷键 (M)',
                action: () => {
                    const originalMode = this.player.getCurrentPlayMode();
                    const event = new KeyboardEvent('keydown', { code: 'KeyM' });
                    this.player.handleKeyboard(event);
                    return this.player.getCurrentPlayMode() !== originalMode;
                }
            },
            {
                name: '重复模式切换快捷键 (R)',
                action: () => {
                    const originalMode = this.player.getCurrentPlayMode();
                    const event = new KeyboardEvent('keydown', { code: 'KeyR' });
                    this.player.handleKeyboard(event);
                    return this.player.getCurrentPlayMode() !== originalMode;
                }
            }
        ];

        for (const testCase of testCases) {
            try {
                const result = testCase.action();
                this.recordTestResult(testCase.name, result);
            } catch (error) {
                this.recordTestResult(testCase.name, false, { error: error.message });
            }
        }
    }

    /**
     * 记录测试结果
     */
    recordTestResult(testName, passed, details = {}) {
        const result = {
            name: testName,
            passed,
            details,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.push(result);
        
        const status = passed ? '✅' : '❌';
        console.log(`${status} ${testName}`);
        
        if (!passed && details.error) {
            console.log(`   错误: ${details.error}`);
        }
    }

    /**
     * 输出测试结果摘要
     */
    printTestResults() {
        console.log('\n📊 测试结果摘要:');
        console.log('='.repeat(50));
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        
        console.log(`总测试数: ${totalTests}`);
        console.log(`通过: ${passedTests} ✅`);
        console.log(`失败: ${failedTests} ❌`);
        console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        
        if (failedTests > 0) {
            console.log('\n❌ 失败的测试:');
            this.testResults
                .filter(r => !r.passed)
                .forEach(r => {
                    console.log(`  - ${r.name}`);
                    if (r.details.error) {
                        console.log(`    错误: ${r.details.error}`);
                    }
                });
        }
        
        console.log('\n🎉 自动播放功能测试完成！');
    }

    /**
     * 获取播放统计信息
     */
    getPlayStats() {
        if (!this.player) {
            console.log('播放器未初始化');
            return null;
        }
        
        return this.player.getPlayStats();
    }
}

// 在页面加载完成后运行测试
document.addEventListener('DOMContentLoaded', () => {
    // 等待一段时间确保播放器完全初始化
    setTimeout(() => {
        const tester = new AutoPlayTester();
        tester.runAllTests();
        
        // 将测试器暴露到全局，方便调试
        window.autoPlayTester = tester;
    }, 2000);
});

// 导出测试器类（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutoPlayTester;
}
