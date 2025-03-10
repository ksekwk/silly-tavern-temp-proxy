/**
 * 进程模拟器
 * 修改进程名称和命令行参数使其看起来像 VS Code
 */

export class ProcessSimulator {
  private static instance: ProcessSimulator;
  private originalArgs: string[];
  private originalTitle: string;
  
  private constructor() {
    // 备份原始值
    this.originalArgs = [...process.argv];
    this.originalTitle = process.title;
  }
  
  public static getInstance(): ProcessSimulator {
    if (!ProcessSimulator.instance) {
      ProcessSimulator.instance = new ProcessSimulator();
    }
    return ProcessSimulator.instance;
  }
  
  /**
   * 模拟 VS Code 进程参数和标题
   */
  public simulateVSCodeProcess(): void {
    // 修改进程标题
    process.title = 'Code Helper';
    
    // 修改命令行参数以匹配 VS Code 扩展主机
    const extensionId = 'silly-tavern-proxy-ext';
    
    // 清除现有参数并添加 VS Code 样式参数
    process.argv = [
      process.argv[0], // Node executable
      process.argv[1], // Script path
      '--type=extensionHost',
      '--extensionDevelopmentPath=' + process.cwd(),
      '--extensionId=' + extensionId,
      '--host=127.0.0.1'
    ];
  }
  
  /**
   * 恢复原始进程设置
   */
  public restoreOriginalProcess(): void {
    process.title = this.originalTitle;
    process.argv = [...this.originalArgs];
  }
  
  /**
   * 模拟 VS Code 进程检测机制
   */
  public setupProcessDetectionEvasion(): void {
    // 拦截可能的进程列表检测
    if (typeof process.getProcessList === 'function') {
      const original = process.getProcessList;
      // @ts-ignore
      process.getProcessList = function(...args: any[]) {
        return original.apply(process, args).then((list: any[]) => {
          // 添加假的 VS Code 进程
          list.push({
            pid: process.pid - 1,
            ppid: process.ppid,
            name: 'Code',
            cmd: '/usr/share/code/code --unity-launch'
          });
          
          // 修改当前进程信息
          const selfIndex = list.findIndex(p => p.pid === process.pid);
          if (selfIndex >= 0) {
            list[selfIndex].name = 'Code Helper';
            list[selfIndex].cmd = process.title;
          }
          
          return list;
        });
      };
    }
  }
}