/**
 * 文件系统模拟器
 * VS Code 有特定的文件系统访问模式
 */

import * as fs from 'fs';
import * as path from 'path';

export class FileSystemSimulator {
  private static instance: FileSystemSimulator;
  
  private constructor() {}
  
  public static getInstance(): FileSystemSimulator {
    if (!FileSystemSimulator.instance) {
      FileSystemSimulator.instance = new FileSystemSimulator();
    }
    return FileSystemSimulator.instance;
  }
  
  /**
   * 创建必要的 VS Code 目录结构
   */
  public createVSCodeDirectoryStructure(): void {
    const vscodeDir = path.join(process.cwd(), '.vscode');
    const extensionsDir = path.join(process.cwd(), '.vscode-extensions');
    const userDataDir = path.join(process.cwd(), '.vscode-user-data');
    
    // 创建目录
    this.ensureDirectoryExists(vscodeDir);
    this.ensureDirectoryExists(extensionsDir);
    this.ensureDirectoryExists(userDataDir);
    
    // 创建假的配置文件
    this.createFakeSettingsFile(vscodeDir);
    this.createFakeExtensionsFile(extensionsDir);
  }
  
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
  
  private createFakeSettingsFile(vscodeDir: string): void {
    const settingsPath = path.join(vscodeDir, 'settings.json');
    const settings = {
      "editor.fontSize": 14,
      "editor.tabSize": 2,
      "terminal.integrated.defaultProfile.windows": "PowerShell",
      "terminal.integrated.defaultProfile.linux": "bash",
      "window.zoomLevel": 0,
      "editor.formatOnSave": true
    };
    
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  }
  
  private createFakeExtensionsFile(extensionsDir: string): void {
    const extensionsFile = path.join(extensionsDir, 'extensions.json');
    const extensions = {
      "recommendations": [
        "ms-vscode.vscode-typescript-next",
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode"
      ]
    };
    
    fs.writeFileSync(extensionsFile, JSON.stringify(extensions, null, 2));
  }
  
  /**
   * 修补文件系统操作以隐藏特定文件
   */
  public patchFileSystemOperations(): void {
    const originalReaddir = fs.readdir;
    const originalReaddirSync = fs.readdirSync;
    const originalStat = fs.stat;
    const originalStatSync = fs.statSync;
    
    // 过滤掉可能泄露真实环境的文件
    const filterEntries = (entries: string[]): string[] => {
      return entries.filter(entry => 
        !entry.includes('node_modules') && 
        !entry.includes('.git') && 
        !entry.startsWith('.')
      );
    };
    
    // 修补异步 readdir
    fs.readdir = function(path: fs.PathLike, 
                          options: any, 
                          callback?: any): any {
      if (typeof options === 'function') {
        callback = options;
        options = {};
      }
      
      return originalReaddir(path, options, (err, entries) => {
        if (err) return callback(err);
        
        // 添加模拟的 VS Code 文件夹
        if (path.toString() === process.cwd()) {
          entries = [...entries, '.vscode', '.vscode-extensions'];
        }
        
        callback(null, filterEntries(entries as string[]));
      });
    };
    
    // 修补同步 readdir
    fs.readdirSync = function(path: fs.PathLike, options?: any): any {
      const entries = originalReaddirSync(path, options);
      
      // 添加模拟的 VS Code 文件夹
      if (path.toString() === process.cwd()) {
        return [...entries, '.vscode', '.vscode-extensions'];
      }
      
      return filterEntries(entries as string[]);
    };
  }
}