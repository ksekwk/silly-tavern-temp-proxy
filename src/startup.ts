import { VSCodeSimulator } from './vscode-simulator';
import { RequestInterceptor } from './request-interceptor';
import { DetectionAvoidance } from './detection-avoidance';

/**
 * Initialize environment to mimic VS Code
 */
export async function initializeEnvironment() {
  try {
    console.log('Initializing VS Code simulation environment...');
    
    // Apply VS Code environment simulation
    const vsCodeSimulator = VSCodeSimulator.getInstance();
    vsCodeSimulator.mockVSCodeAPI();
    
    // Set up request interception for network requests
    const requestInterceptor = new RequestInterceptor();
    requestInterceptor.patchFetch();
    
    // Apply all detection avoidance techniques
    DetectionAvoidance.applyAll();
    
    // Mock extension host process
    mockExtensionHost();
    
    console.log('VS Code environment initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize VS Code environment:', error);
    return false;
  }
}

/**
 * Mock the VS Code extension host process
 */
function mockExtensionHost() {
  // Create a fake process.send method that extension hosts use
  if (!process.send) {
    process.send = function(message: any) {
      // Just ignore messages or log them for debugging
      if (process.env.DEBUG) {
        console.log('Extension host message:', message);
      }
      return true;
    };
  }
  
  // Simulate extension host IPC
  process.env.VSCODE_IPC_HOOK_EXTHOST = `/tmp/vscode-ipc-${Math.random().toString(36).substring(2)}.sock`;
  
  // Mock VS Code's electron remote
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
    
    // For other modules, use the real require if available
    if (typeof globalThis.require !== 'undefined') {
      return globalThis.require(module);
    }
    throw new Error(`Cannot find module '${module}'`);
  };
}