/**
 * VS Code Environment Simulator
 * Mocks VS Code APIs and environment variables to bypass detection
 */

export class VSCodeSimulator {
  private static instance: VSCodeSimulator;
  private environmentVariables: Record<string, string>;

  private constructor() {
    this.environmentVariables = {
      'VSCODE_PID': String(process.pid),
      'VSCODE_CWD': process.cwd(),
      'VSCODE_NONCE': this.generateNonce(),
      'VSCODE_IPC_HOOK': `/tmp/vscode-ipc-${this.generateNonce()}.sock`,
      'VSCODE_NLS_CONFIG': JSON.stringify({
        locale: 'en-us',
        availableLanguages: {},
        pseudo: false
      }),
      'VSCODE_AMD_ENTRYPOINT': 'vs/workbench/api/node/extensionHostProcess',
      'VSCODE_HANDLES_UNCAUGHT_ERRORS': 'true',
      'VSCODE_LOG_STACK': 'false',
      'VSCODE_LOG_LEVEL': 'info'
    };

    // Set environment variables
    Object.entries(this.environmentVariables).forEach(([key, value]) => {
      process.env[key] = value;
    });
  }

  public static getInstance(): VSCodeSimulator {
    if (!VSCodeSimulator.instance) {
      VSCodeSimulator.instance = new VSCodeSimulator();
    }
    return VSCodeSimulator.instance;
  }

  private generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  public setupUserAgent(headers: Record<string, string>): Record<string, string> {
    // VS Code uses something similar to this user agent
    headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) VSCode/1.86.0 Chrome/114.0.5735.289 Electron/25.9.7 Safari/537.36';
    return headers;
  }

  public getExtensionContext(): any {
    return {
      subscriptions: [],
      extensionPath: process.cwd(),
      globalState: {
        get: (key: string) => null,
        update: (key: string, value: any) => Promise.resolve()
      },
      workspaceState: {
        get: (key: string) => null,
        update: (key: string, value: any) => Promise.resolve()
      },
      extensionUri: { scheme: 'file', path: process.cwd() },
      environmentVariableCollection: {},
      asAbsolutePath: (relativePath: string) => `${process.cwd()}/${relativePath}`,
      storageUri: { scheme: 'file', path: `${process.cwd()}/storage` },
      globalStorageUri: { scheme: 'file', path: `${process.cwd()}/global-storage` },
      logUri: { scheme: 'file', path: `${process.cwd()}/logs` },
      extensionMode: 1 // Production mode
    };
  }

  public mockVSCodeAPI(): void {
    // Define the global vscode object
    (global as any).vscode = {
      env: {
        appName: 'Visual Studio Code',
        appRoot: process.cwd(),
        language: 'en-us',
        machineId: this.generateNonce(),
        sessionId: this.generateNonce(),
        shell: process.platform === 'win32' ? 'PowerShell' : 'bash',
        uiKind: 1, // Desktop
        clipboard: {
          readText: () => Promise.resolve(''),
          writeText: (text: string) => Promise.resolve()
        }
      },
      extensions: {
        getExtension: () => null,
        all: []
      },
      window: {
        showInformationMessage: () => Promise.resolve(null),
        showWarningMessage: () => Promise.resolve(null),
        showErrorMessage: () => Promise.resolve(null),
        createOutputChannel: () => ({
          appendLine: () => {},
          append: () => {},
          clear: () => {},
          dispose: () => {}
        })
      }
    };
  }
}