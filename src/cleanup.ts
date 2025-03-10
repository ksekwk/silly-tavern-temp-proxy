/**
 * 资源清理工具
 * 确保应用退出前释放所有资源
 */

import { WebSocketSimulator } from './websocket-simulator';

export class CleanupManager {
  private static isRegistered = false;
  
  /**
   * 注册清理处理程序
   */
  public static register(): void {
    if (this.isRegistered) return;
    
    // 注册进程退出处理程序
    process.on('exit', () => {
      this.performCleanup();
    });
    
    // 捕获中断信号
    process.on('SIGINT', () => {
      console.log('接收到中断信号，正在清理...');
      this.performCleanup().then(() => process.exit(0));
    });
    
    // 捕获终止信号
    process.on('SIGTERM', () => {
      console.log('接收到终止信号，正在清理...');
      this.performCleanup().then(() => process.exit(0));
    });
    
    // 捕获未处理的异常
    process.on('uncaughtException', (error) => {
      console.error('未捕获的异常:', error);
      this.performCleanup().then(() => process.exit(1));
    });
    
    // 捕获未处理的Promise拒绝
    process.on('unhandledRejection', (reason, promise) => {
      console.error('未处理的Promise拒绝:', reason);
      // 不退出，只记录
    });
    
    this.isRegistered = true;
    console.log('清理处理程序已注册');
  }
  
  /**
   * 执行清理操作
   */
  private static async performCleanup(): Promise<void> {
    console.log('正在执行资源清理...');
    
    try {
      // 关闭WebSocket服务器
      const wsSimulator = WebSocketSimulator.getInstance();
      await wsSimulator.stopMockServer();
      
      // 其他清理操作...
      
    } catch (error) {
      console.error('清理过程中发生错误:', error);
    }
  }
}