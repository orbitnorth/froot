/**
 * Built-in Multi-Core Clustering & Worker Scaling Engine for Froot.
 * Utilizes OS kernel-level round-robin socket balancing and availableParallelism to scale across all CPU cores.
 */

import cluster from 'node:cluster';
import os from 'node:os';
import type { Server } from 'node:http';
import type { FetchableApp, NodeServerOptions } from './node-adapter.js';

export interface ClusterOptions extends NodeServerOptions {
  workers?: number;
  port?: number;
  autoRestart?: boolean;
  silent?: boolean;
  onWorkerStart?: (workerId: number, pid: number) => void;
  onWorkerExit?: (workerId: number, code: number, signal: string) => void;
}

export interface ClusterController {
  isPrimary: boolean;
  isWorker: boolean;
  workerCount: number;
  server?: Server | undefined;
  close: () => Promise<void>;
}

/**
 * Resolves the optimal number of worker processes based on physical/logical CPU core availability.
 */
export function getOptimalWorkerCount(requested?: number): number {
  if (requested && requested > 0) {
    return requested;
  }
  if (typeof os.availableParallelism === 'function') {
    return os.availableParallelism();
  }
  const cpus = os.cpus();
  return cpus && cpus.length > 0 ? cpus.length : 1;
}

/**
 * Starts a multi-core cluster deployment of the Froot application.
 */
export function startCluster(app: FetchableApp, options: ClusterOptions = {}): ClusterController {
  const isPrimary = cluster.isPrimary ?? (cluster as unknown as { isMaster: boolean }).isMaster;
  const port = options.port ?? 3000;
  const autoRestart = options.autoRestart ?? true;
  const numWorkers = getOptimalWorkerCount(options.workers);

  if (isPrimary) {
    const activeWorkers = new Set<import('node:cluster').Worker>();
    let isShuttingDown = false;

    for (let i = 0; i < numWorkers; i++) {
      const worker = cluster.fork();
      activeWorkers.add(worker);
      if (options.onWorkerStart && worker.process.pid) {
        options.onWorkerStart(worker.id, worker.process.pid);
      }
    }

    const exitHandler = (worker: import('node:cluster').Worker, code: number, signal: string) => {
      activeWorkers.delete(worker);
      if (options.onWorkerExit) {
        options.onWorkerExit(worker.id, code, signal);
      }
      if (autoRestart && !isShuttingDown) {
        const replacement = cluster.fork();
        activeWorkers.add(replacement);
      }
    };

    cluster.on('exit', exitHandler);

    const close = async (): Promise<void> => {
      isShuttingDown = true;
      cluster.removeListener('exit', exitHandler);
      const closePromises: Promise<void>[] = [];

      for (const worker of activeWorkers) {
        if (!worker.isDead()) {
          closePromises.push(
            new Promise((resolve) => {
              worker.once('disconnect', () => resolve());
              worker.kill('SIGTERM');
              setTimeout(() => {
                if (!worker.isDead()) {
                  try {
                    worker.kill('SIGKILL');
                  } catch {
                    // Ignore already dead
                  }
                }
                resolve();
              }, 500);
            })
          );
        }
      }

      await Promise.all(closePromises);
      activeWorkers.clear();
    };

    return {
      isPrimary: true,
      isWorker: false,
      workerCount: numWorkers,
      close
    };
  } else {
    // Worker process executes the standard listener
    const listenFn = (app as unknown as { listen?: (p: number, cb?: () => void, opts?: NodeServerOptions) => Server }).listen;
    const server = typeof listenFn === 'function'
      ? listenFn.call(app, port, undefined, options)
      : undefined;

    return {
      isPrimary: false,
      isWorker: true,
      workerCount: 1,
      server,
      close: async () => {
        if (server) {
          await new Promise<void>((resolve) => server.close(() => resolve()));
        }
      }
    };
  }
}
