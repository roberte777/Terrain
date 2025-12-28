// ============================================================================
// Web Worker for Map Generation
// Runs generation in background thread to keep UI responsive
// ============================================================================

import { WorkerRequest, WorkerResponse } from '../lib/types';
import { generateWorld } from '../lib/generation';

// Handle messages from main thread
self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;

  if (request.type === 'generate') {
    try {
      const world = generateWorld(request.settings, (stage, percent) => {
        const response: WorkerResponse = { type: 'progress', stage, percent };
        self.postMessage(response);
      });

      const response: WorkerResponse = { type: 'result', world };
      self.postMessage(response);
    } catch (error) {
      const response: WorkerResponse = { 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
      self.postMessage(response);
    }
  }
};
