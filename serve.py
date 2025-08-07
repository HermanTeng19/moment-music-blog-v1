#!/usr/bin/env python3
"""
简单的本地开发服务器 - 用于测试纯静态音乐播放器
解决本地文件CORS访问问题

使用方法：
python3 serve.py

然后在浏览器中访问 http://localhost:8000
"""

import http.server
import socketserver
import os
import sys
from urllib.parse import urlparse

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """支持CORS的HTTP请求处理器"""
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
    
    def log_message(self, format, *args):
        """自定义日志格式"""
        sys.stdout.write("%s - %s\n" % (self.address_string(), format % args))

def start_server(port=8000):
    """启动开发服务器"""
    
    # 确保在项目根目录
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # 检查必要文件是否存在
    required_files = ['index.html', 'data/playlist.json']
    missing_files = []
    
    for file_path in required_files:
        if not os.path.exists(file_path):
            missing_files.append(file_path)
    
    if missing_files:
        print("⚠️ 警告：以下必要文件不存在：")
        for file_path in missing_files:
            print(f"   - {file_path}")
        print()
    
    # 检查音频文件
    audio_dir = 'assets/audio'
    if os.path.exists(audio_dir):
        audio_files = [f for f in os.listdir(audio_dir) if f.endswith(('.mp3', '.wav', '.ogg', '.m4a'))]
        if not audio_files:
            print("⚠️ 警告：未找到音频文件，请将音频文件放入 assets/audio/ 目录")
            print()
    
    # 启动服务器
    try:
        with socketserver.TCPServer(("", port), CORSHTTPRequestHandler) as httpd:
            print("🎵 Moment Music Player 开发服务器")
            print("=" * 50)
            print(f"服务器地址: http://localhost:{port}")
            print(f"项目目录: {os.getcwd()}")
            print("按 Ctrl+C 停止服务器")
            print("=" * 50)
            print()
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n\n服务器已停止")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ 端口 {port} 已被占用，请尝试其他端口：")
            print(f"   python3 serve.py {port + 1}")
        else:
            print(f"❌ 启动服务器失败：{e}")

if __name__ == "__main__":
    # 支持自定义端口
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("❌ 无效的端口号，使用默认端口 8000")
    
    start_server(port)