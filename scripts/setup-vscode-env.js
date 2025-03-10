/**
 * VS Code 环境准备脚本
 * 在启动应用程序前运行
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// 生成随机标识符
function generateNonce() {
  return crypto.randomBytes(16).toString('hex');
}

// 创建必要的目录结构
function createDirectories() {
  const directories = [
    path.join(process.cwd(), '.vscode'),
    path.join(process.cwd(), '.vscode-extensions'),
    path.join(process.cwd(), '.vscode-user-data')
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`创建目录: ${dir}`);
    }
  });
}

// 创建模拟配置文件
function createConfigFiles() {
  // VS Code 设置
  const settingsPath = path.join(process.cwd(), '.vscode', 'settings.json');
  const settings = {
    "editor.fontSize": 14,
    "editor.tabSize": 2,
    "terminal.integrated.defaultProfile.windows": "PowerShell",
    "terminal.integrated.defaultProfile.linux": "bash",
    "window.zoomLevel": 0,
    "editor.formatOnSave": true,
    "telemetry.telemetryLevel": "off"
  };
  
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  console.log(`创建配置文件: ${settingsPath}`);
  
  // launch.json
  const launchPath = path.join(process.cwd(), '.vscode', 'launch.json');
  const launch = {
    "version": "0.2.0",
    "configurations": [
      {
        "type": "node",
        "request": "launch",
        "name": "启动程序",
        "skipFiles": ["<node_internals>/**"],
        "program": "${workspaceFolder}/dist/main.js"
      }
    ]
  };
  
  fs.writeFileSync(launchPath, JSON.stringify(launch, null, 2));
  console.log(`创建启动配置: ${launchPath}`);
  
  // extensions.json
  const extensionsPath = path.join(process.cwd(), '.vscode', 'extensions.json');
  const extensions = {
    "recommendations": [
      "ms-vscode.vscode-typescript-next",
      "dbaeumer.vscode-eslint",
      "esbenp.prettier-vscode"
    ]
  };
  
  fs.writeFileSync(extensionsPath, JSON.stringify(extensions, null, 2));
  console.log(`创建扩展推荐: ${extensionsPath}`);
}

// 创建环境变量文件
function createEnvFile() {
  const envFilePath = path.join(process.cwd(), '.env');
  const machineId = generateNonce();
  const sessionId = generateNonce();
  
  const envContent = `
# VS Code 环境变量
VSCODE_PID=${process.pid}
VSCODE_CWD=${process.cwd()}
VSCODE_NONCE=${generateNonce()}
VSCODE_IPC_HOOK=${path.join(os.tmpdir(), `vscode-ipc-${generateNonce()}.sock`)}
VSCODE_NLS_CONFIG={"locale":"zh-cn","availableLanguages":{},"pseudo":false}
VSCODE_AMD_ENTRYPOINT=vs/workbench/api/node/extensionHostProcess
VSCODE_HANDLES_UNCAUGHT_ERRORS=true
VSCODE_LOG_STACK=false
VSCODE_LOG_LEVEL=info
VSCODE_MACHINE_ID=${machineId}
VSCODE_SESSION_ID=${sessionId}
  `;
  
  fs.writeFileSync(envFilePath, envContent.trim());
  console.log(`创建环境变量文件: ${envFilePath}`);
}

// 运行所有设置操作
function setupEnvironment() {
  console.log('开始设置 VS Code 模拟环境...');
  
  createDirectories();
  createConfigFiles();
  createEnvFile();
  
  console.log('环境设置完成！');
}

setupEnvironment();