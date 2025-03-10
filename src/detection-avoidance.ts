/**
 * 检测规避工具加强版
 * 添加了更多反检测能力
 */

export class DetectionAvoidance {
  /**
   * 混淆可能被静态分析标记的代码模式
   */
  public static obfuscateCodePatterns(code: string): string {
    // 替换直接引用非 VS Code 环境的代码
    const replacements: [RegExp, string][] = [
      [/process\.env/g, 'globalThis["pro" + "cess"]["en" + "v"]'],
      [/require\(['"](.*)['"]\)/g, 'Function("return require")()(\'$1\')'],
      [/import\s+([^;]*)\s+from\s+['"]([^'"]+)['"]/g, 'const $1 = await import(\'$2\')'],
      [/window\.(?!vscode)/g, 'globalThis'],
      [/global\./g, 'globalThis.']
    ];
    
    let result = code;
    for (const [pattern, replacement] of replacements) {
      result = result.replace(pattern, replacement as string);
    }
    
    return result;
  }
  
  /**
   * 为对象创建代理以拦截可能用于环境检测的属性访问
   */
  public static createSecureProxy<T extends object>(target: T, name: string): T {
    return new Proxy(target, {
      get(obj, prop) {
        // 防止控制台日志检测
        if (name === 'console' && 
            (prop === 'log' || prop === 'warn' || prop === 'error')) {
          return (...args: any[]) => {
            // 过滤掉敏感堆栈跟踪或环境信息
            const filteredArgs = args.map(arg => 
              typeof arg === 'string' 
                ? arg.replace(/node|electron|non-vscode/gi, 'vscode') 
                : arg
            );
            return Reflect.get(obj, prop).apply(obj, filteredArgs);
          };
        }
        
        return Reflect.get(obj, prop);
      }
    });
  }
  
  /**
   * 添加虚拟 DOM 来欺骗浏览器检测
   */
  public static mockBrowserEnvironment(): void {
    // 如果在 Node.js 环境中没有 window 对象
    if (typeof window === 'undefined') {
      (global as any).window = {};
    }
    
    // 模拟文档对象
    if (typeof document === 'undefined') {
      (global as any).document = {
        createElement: (tag: string) => ({ 
          tag,
          style: {},
          setAttribute: () => {},
          appendChild: () => {},
          addEventListener: () => {}
        }),
        createTextNode: (text: string) => ({ text }),
        querySelector: () => null,
        querySelectorAll: () => [],
        getElementById: () => null,
        body: { appendChild: () => {} },
        head: { appendChild: () => {} },
        documentElement: { style: {} }
      };
    }
    
    // 模拟本地存储
    if (typeof localStorage === 'undefined') {
      const storage: Record<string, string> = {};
      (global as any).localStorage = {
        getItem: (key: string) => storage[key] || null,
        setItem: (key: string, value: string) => { storage[key] = value; },
        removeItem: (key: string) => { delete storage[key]; },
        clear: () => { Object.keys(storage).forEach(key => delete storage[key]); },
        key: (index: number) => Object.keys(storage)[index] || null,
        length: 0
      };
      Object.defineProperty((global as any).localStorage, 'length', {
        get: () => Object.keys(storage).length
      });
    }
  }
  
  /**
   * 创建假的源图标识符
   */
  public static mockSourcegraphIdentifiers(): void {
    // 如果检查 sourcegraph 属性
    Object.defineProperty(global, 'sourcegraph', {
      get: function() {
        // 返回一个自定义的错误或假数据
        return undefined;
      },
      configurable: true
    });
    
    // 添加 VS Code 特定的属性
    Object.defineProperty(global, '__VSCODE__', { 
      value: true,
      configurable: false,
      writable: false
    });
  }
  
  /**
   * 应用所有检测规避技术
   */
  public static applyAll(): void {
    // 替换控制台为安全代理
    global.console = this.createSecureProxy(console, 'console');
    
    // 添加假的 VS Code 版本信息到进程
    (process as any).versions.vscode = '1.86.0';
    (process as any).versions.electron = '25.9.7';
    
    // 如果需要，覆盖 process.platform 以匹配 VS Code 期望
    Object.defineProperty(process, 'platform', {
      get() {
        return process.env.VSCODE_PLATFORM || process.platform;
      }
    });
    
    // 模拟浏览器环境
    this.mockBrowserEnvironment();
    
    // 模拟 Sourcegraph 标识符
    this.mockSourcegraphIdentifiers();
    
    // 添加自检测试
    this.addSelfTests();
  }
  
  /**
   * 添加自我测试机制，确保伪装正常工作
   */
  private static addSelfTests(): void {
    // 定期检查环境变量是否完好
    setInterval(() => {
      const requiredVars = [
        'VSCODE_PID', 
        'VSCODE_CWD',
        'VSCODE_AMD_ENTRYPOINT'
      ];
      
      for (const varName of requiredVars) {
        if (!process.env[varName]) {
          // 恢复变量
          process.env[varName] = varName === 'VSCODE_PID' 
            ? String(process.pid)
            : varName === 'VSCODE_CWD'
              ? process.cwd()
              : 'vs/workbench/api/node/extensionHostProcess';
        }
      }
      
      // 确认全局 vscode 对象存在
      if (!(global as any).vscode) {
        VSCodeSimulator.getInstance().mockVSCodeAPI();
      }
    }, 30000);
  }
}

// 导入 VSCodeSimulator 以便在自检中使用
import { VSCodeSimulator } from './vscode-simulator';