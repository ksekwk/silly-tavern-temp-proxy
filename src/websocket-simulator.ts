/**
 * WebSocket 通信模拟器
 * VS Code 与扩展通常通过 WebSocket 进行通信
 */

import * as WebSocket from 'ws';

export class WebSocketSimulator {
  private static instance: WebSocketSimulator;
  private mockServer?: WebSocket.Server;
  
  private constructor() {}
  
  public static getInstance(): WebSocketSimulator {
    if (!WebSocketSimulator.instance) {
      WebSocketSimulator.instance = new WebSocketSimulator();
    }
    return WebSocketSimulator.instance;
  }
  
  /**
   * 启动模拟 VS Code WebSocket 服务器
   */
  public startMockServer(port: number = 0): Promise<number> {
    return new Promise((resolve, reject) => {
      try {
        this.mockServer = new WebSocket.Server({ port });
        
        this.mockServer.on('connection', (ws) => {
          console.log('Extension WebSocket connected');
          
          // 添加错误处理
          ws.on('error', (error) => {
            console.error('WebSocket connection error:', error);
          });
          
          ws.on('message', (message) => {
            try {
              const data = JSON.parse(message.toString());
              this.handleMessage(ws, data);
            } catch (e) {
              // 记录解析错误但不影响运行
              console.warn('Failed to parse WebSocket message:', e);
            }
          });
        });
        
        this.mockServer.on('error', (err) => {
          console.error('WebSocket server error:', err);
          reject(err);
        });
        
        this.mockServer.on('listening', () => {
          const address = this.mockServer?.address();
          const actualPort = typeof address === 'object' && address ? address.port : 0;
          process.env.VSCODE_WEBSOCKET_PORT = actualPort.toString();
          console.log(`WebSocket模拟服务器启动成功，端口: ${actualPort}`);
          resolve(actualPort);
        });
      } catch (err) {
        console.error('WebSocket服务器启动失败:', err);
        reject(err);
      }
    });
  }
  
  /**
   * 处理接收到的WebSocket消息
   */
  private handleMessage(ws: WebSocket, data: any) {
    try {
      // 根据消息类型返回模拟响应
      if (data.type === 'initialization') {
        ws.send(JSON.stringify({
          type: 'response',
          id: data.id,
          result: {
            version: '1.86.0',
            status: 'ready'
          }
        }));
      } else if (data.type === 'request') {
        ws.send(JSON.stringify({
          type: 'response',
          id: data.id,
          result: { success: true }
        }));
      } else if (data.type === 'ping') {
        ws.send(JSON.stringify({
          type: 'pong',
          id: data.id
        }));
      } else if (data.type === 'getConfig') {
        ws.send(JSON.stringify({
          type: 'response',
          id: data.id,
          result: {
            settings: {
              "editor.fontSize": 14,
              "editor.tabSize": 2,
              "terminal.integrated.defaultProfile.windows": "PowerShell",
              "terminal.integrated.defaultProfile.linux": "bash"
            }
          }
        }));
      } else if (data.type === 'extensionAPI') {
        // 模拟扩展API调用响应
        ws.send(JSON.stringify({
          type: 'response',
          id: data.id,
          result: {
            status: 'success',
            data: {}
          }
        }));
      }
    } catch (error) {
      console.error('处理WebSocket消息时出错:', error);
      try {
        // 尝试发送错误响应
        ws.send(JSON.stringify({
          type: 'error',
          id: data?.id || 'unknown',
          error: 'Internal error processing message'
        }));
      } catch (sendError) {
        // 如果发送错误响应也失败，则忽略
      }
    }
  }
  
  /**
   * 停止模拟服务器
   */
  public stopMockServer(): Promise<void> {
    return new Promise((resolve) => {
      if (this.mockServer) {
        try {
          // 使用setTimeout确保所有连接都有机会关闭
          setTimeout(() => {
            this.mockServer?.close(() => {
              console.log('WebSocket模拟服务器已关闭');
              this.mockServer = undefined;
              resolve();
            });
          }, 100);
        } catch (error) {
          console.warn('关闭WebSocket服务器时出错:', error);
          this.mockServer = undefined;
          resolve();
        }
      } else {
        resolve();
      }
    });
  }
  
  /**
   * 修补全局 WebSocket 实现
   */
  public patchWebSocket(): void {
    // 确保在Node环境中有全局WebSocket可用
    if (typeof global.WebSocket === 'undefined') {
      // 在Node中，可能没有全局WebSocket
      // @ts-ignore - 创建一个模拟的全局WebSocket
      global.WebSocket = WebSocket;
    }
    
    const originalWebSocket = global.WebSocket;
    
    // @ts-ignore - 重定义全局 WebSocket
    global.WebSocket = class MockWebSocket extends originalWebSocket {
      constructor(url: string, protocols?: string | string[]) {
        // 检查是否为VS Code或Sourcegraph特定的URL
        if (url.includes('vscode') || url.includes('sourcegraph')) {
          console.log(`拦截WebSocket连接到: ${url}`);
          
          // 修改URL以使用本地模拟服务器
          const mockUrl = `ws://localhost:${process.env.VSCODE_WEBSOCKET_PORT || '8000'}`;
          console.log(`重定向到本地模拟服务器: ${mockUrl}`);
          
          super(mockUrl, protocols);
          
          // 添加VS Code特有的事件处理
          this.addEventListener('open', () => {
            console.log('VS Code WebSocket连接已打开，发送初始化消息');
            this.send(JSON.stringify({ 
              type: 'initialization', 
              id: Date.now(),
              version: '1.86.0'
            }));
          });
          
          // 添加错误处理
          this.addEventListener('error', (event) => {
            console.warn('VS Code WebSocket连接错误:', event);
          });
          
          // 添加关闭处理
          this.addEventListener('close', (event) => {
            console.log(`VS Code WebSocket连接关闭，代码: ${event.code}, 原因: ${event.reason}`);
            
            // 尝试重新连接
            if (event.code !== 1000) { // 正常关闭不重连
              console.log('尝试重新连接...');
              setTimeout(() => {
                // 这里可以添加重连逻辑
              }, 3000);
            }
          });
        } else {
          // 对于其他WebSocket连接，保持原始行为
          super(url, protocols);
        }
      }
      
      // 重写send方法以记录发送的消息
      send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
        try {
          if (typeof data === 'string' && 
              (data.includes('vscode') || data.includes('sourcegraph'))) {
            console.log(`WebSocket发送消息: ${data.substring(0, 100)}${data.length > 100 ? '...' : ''}`);
          }
          super.send(data);
        } catch (error) {
          console.error('WebSocket发送消息失败:', error);
        }
      }
    };
    
    console.log('WebSocket全局实现已被修补');
  }
  
  /**
   * 添加VS Code特定的WebSocket监听器和事件
   */
  public setupVSCodeEvents(): void {
    try {
      // 模拟VS Code的周期性ping消息
      setInterval(() => {
        if (this.mockServer && this.mockServer.clients.size > 0) {
          this.mockServer.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'ping',
                id: Date.now()
              }));
            }
          });
        }
      }, 30000); // 每30秒发送一次ping
    } catch (error) {
      console.warn('设置VS Code事件时出错:', error);
    }
  }
}