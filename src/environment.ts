import * as fs from 'fs';
import * as path from 'path';

/**
 * 环境变量加载和管理
 */
export class Environment {
  private static instance: Environment;
  private envVars: Record<string, string> = {};
  
  private constructor() {
    this.loadEnvFile();
    this.setupDefaultVars();
  }
  
  public static getInstance(): Environment {
    if (!Environment.instance) {
      Environment.instance = new Environment();
    }
    return Environment.instance;
  }
  
  /**
   * 加载.env文件中的环境变量
   */
  private loadEnvFile(): void {
    try {
      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split('\n');
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          
          const match = trimmed.match(/^([^=]+)=(.*)$/);
          if (match) {
            const key = match[1].trim();
            const value = match[2].trim();
            this.envVars[key] = value.replace(/^["']|["']$/g, ''); // 去除引号
            process.env[key] = this.envVars[key];
          }
        }
        console.log('环境变量已从.env文件加载');
      }
    } catch (error) {
      console.warn('加载.env文件失败:', error);
    }
  }
  
  /**
   * 设置默认环境变量
   */
  private setupDefaultVars(): void {
    const defaults: Record<string, string> = {
      'VSCODE_PID': process.env.VSCODE_PID || String(process.pid),
      'VSCODE_CWD': process.env.VSCODE_CWD || process.cwd(),
      'VSCODE_AMD_ENTRYPOINT': process.env.VSCODE_AMD_ENTRYPOINT || 'vs/workbench/api/node/extensionHostProcess'
    };
    
    // 仅在环境变量不存在时设置
    for (const [key, value] of Object.entries(defaults)) {
      if (!process.env[key]) {
        process.env[key] = value;
        this.envVars[key] = value;
      }
    }
  }
  
  /**
   * 获取环境变量
   */
  public get(key: string, defaultValue?: string): string | undefined {
    return process.env[key] || this.envVars[key] || defaultValue;
  }
  
  /**
   * 设置环境变量
   */
  public set(key: string, value: string): void {
    process.env[key] = value;
    this.envVars[key] = value;
  }
}