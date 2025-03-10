@echo off
:: Setup VS Code simulation environment variables
SET VSCODE_PID=%RANDOM%
SET VSCODE_CWD=%CD%
SET VSCODE_AMD_ENTRYPOINT=vs/workbench/api/node/extensionHostProcess
SET VSCODE_HANDLES_UNCAUGHT_ERRORS=true
SET VSCODE_LOG_STACK=false
SET VSCODE_LOG_LEVEL=info
SET ELECTRON_RUN_AS_NODE=1

echo VS Code environment variables set
echo Starting application with VS Code simulation...
node dist/index.js %*