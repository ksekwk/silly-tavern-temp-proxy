import { VSCodeSimulator } from './vscode-simulator';
import { RequestInterceptor } from './request-interceptor';

// Initialize VS Code simulator
const vsCodeSimulator = VSCodeSimulator.getInstance();
vsCodeSimulator.mockVSCodeAPI();

// Set up request interception
const requestInterceptor = new RequestInterceptor();
requestInterceptor.patchFetch();

// Export modified axios instance for use throughout the application
export const axios = requestInterceptor.getAxiosInstance();

// Your original application code below
// ... (your existing application code) ...