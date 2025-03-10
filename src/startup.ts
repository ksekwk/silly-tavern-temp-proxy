import { VSCodeSimulator } from './vscode-simulator';
import { RequestInterceptor } from './request-interceptor';
import { DetectionAvoidance } from './detection-avoidance';
import { WebSocketSimulator } from './websocket-simulator';
import { ProcessSimulator } from './process-simulator';
import { FileSystemSimulator } from './filesystem-simulator';

/**
 * 初始化环境以模拟 VS Code
 */
export async function initializeEnvironment() {
  try {
    console.log('初始化 VS Code 模拟环境...');
    
    // 应用 VS Code 环境模拟
    const vsCodeSimulator = VSCodeSimulator.getInstance();
    vsCodeSimulator.mockVSCodeAPI();
    
    // 设置请求拦截
    const requestInterceptor = new RequestInterceptor();
    requestInterceptor.patchFetch();
    
    // 应用所有检测规避技术
    DetectionAvoidance.applyAll();
    
    // 启动 WebSocket 模拟服务器
    const wsSimulator = WebSocketSimulator.getInstance();
    await wsSimulator.startMockServer();
    wsSimulator.patchWebSocket();
    
    // 模拟进程信息
    const processSimulator = ProcessSimulator.getInstance();
    processSimulator.simulateVSCodeProcess();
    processSimulator.setupProcessDetectionEvasion();
    
    // 模拟文件系统
    const fsSimulator = FileSystemSimulator.getInstance();
    fsSimulator.createVSCodeDirectoryStructure();
    fsSimulator.patchFileSystemOperations();
    
    // 模拟扩展主机进程
    mockExtensionHost();
    
    console.log('VS Code 环境初始化成功');
    return true;
  } catch (error) {
    console.error('初始化 VS Code 环境失败:', error);
    return false;
  }
}

/**
 * 模拟 VS Code 扩展主机进程
 */
function mockExtensionHost() {
  // 创建假的 process.send 方法
  if (!process.send) {
    process.send = function(message: any) {
      // 忽略消息或者记录日志以便调试
      if (process.env.DEBUG) {
        console.log('扩展主机消息:', message);
      }
      return true;
    };
  }
  
  // 模拟扩展主机 IPC
  process.env.VSCODE_IPC_HOOK_EXTHOST = `/tmp/vscode-ipc-${Math.random().toString(36).substring(2)}.sock`;
  
  // 模拟 VS Code 的 electron remote
  (global as any).require = function(module: string) {
    if (module === 'electron') {
      return {
        remote: {
          app: {
            getPath: (name: string) => {
              const paths: Record<string, string> = {
                'userData': `${process.cwd()}/.vscode-user-data`,
                'appData': `${process.cwd()}/.vscode-app-data`,
                'temp': `${process.cwd()}/.vscode-temp`
              };
              return paths[name] || '';
            },
            getName: () => 'Code',
            getVersion: () => '1.86.0'
          }
        }
      };
    }
    
    // 对于其他模块，使用真实的 require（如果可用）
    if (typeof globalThis.require !== 'undefined') {
      return globalThis.require(module);
    }
    throw new Error(`找不到模块 '${module}'`);
  };
}