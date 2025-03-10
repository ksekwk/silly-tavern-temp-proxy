import axios, { AxiosRequestConfig, AxiosInstance } from 'axios';
import { VSCodeSimulator } from './vscode-simulator';

export class RequestInterceptor {
  private axiosInstance: AxiosInstance;
  private vsCodeSimulator: VSCodeSimulator;
  
  constructor() {
    this.vsCodeSimulator = VSCodeSimulator.getInstance();
    this.axiosInstance = axios.create();
    
    // Add request interceptor
    this.axiosInstance.interceptors.request.use((config) => {
      // Add VS Code specific headers
      config.headers = this.vsCodeSimulator.setupUserAgent(config.headers || {});
      
      // Add additional headers that VS Code might include
      config.headers['X-Client-Name'] = 'vscode';
      config.headers['X-Client-Version'] = '1.86.0';
      
      return config;
    });
  }
  
  public getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
  
  // Patch the global fetch to include VS Code headers
  public patchFetch(): void {
    const originalFetch = global.fetch;
    const vsCodeSim = this.vsCodeSimulator;
    
    global.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
      const modifiedInit: RequestInit = init || {};
      modifiedInit.headers = new Headers(modifiedInit.headers || {});
      
      // Apply VS Code headers
      const headers: Record<string, string> = {};
      vsCodeSim.setupUserAgent(headers);
      
      Object.entries(headers).forEach(([key, value]) => {
        (modifiedInit.headers as Headers).append(key, value);
      });
      
      return originalFetch(input, modifiedInit);
    };
  }
}