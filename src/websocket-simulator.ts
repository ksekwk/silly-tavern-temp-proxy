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
          
          ws.on('message', (message) => {
            try {
              const data = JSON.parse(message.toString());
              // 处理特定消息类型，模拟 VS Code 响应
              this.handleMessage(ws, data);
            } catch (e) {
              // 静默处理解析错误
            }
          });
        });
        
        this.mockServer.on('listening', () => {
          const address = this.mockServer?.address();
          const actualPort = typeof address === 'object' && address ? address.port : 0;
          process.env.VSCODE_WEBSOCKET_PORT = actualPort.toString();
          resolve(actualPort);
        });
        
        this.mockServer.on('error', (err) => {
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }
  
  private handleMessage(ws: WebSocket, data: any) {
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
    }
  }
  
  public stopMockServer(): Promise<void> {
    return new Promise((resolve) => {
      if (this.mockServer) {
        this.mockServer.close(() => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
  
  /**
   * 修补全局 WebSocket 实现
   */
  public patchWebSocket(): void {
    const originalWebSocket = global.WebSocket;
    
    // @ts-ignore - 重定义全局 WebSocket
    global.WebSocket = class MockWebSocket extends originalWebSocket {
      constructor(url: string, protocols?: string | string[]) {
        // 如果是 VS Code 特定的 URL，修改行为
        if (url.includes('vscode') || url.includes('sourcegraph')) {
          // 修改 URL 或使用本地模拟服务器
          const mockUrl = `ws://localhost:${process.env.VSCODE_WEBSOCKET_PORT || '8000'}`;
          super(mockUrl, protocols);
          
          // 添加 VS Code 特有的事件处理
          this.addEventListener('open', () => {
            this.send(JSON.stringify({ type: 'initialization', id: Date.now() }));
          });
        } else {
          // 对于其他 WebSocket 连接，保持原始行为
          super(url, protocols);
        }
      }
    };
  }
}