import { Socket } from "socket.io-client";
import { BatchResult, ChunkInfo } from "@/services/chunking/ChunkingService";
import { ExtractedDataType } from "../engine/DOMFetcherService";

interface QueueState {
  status: "idle" | "processing" | "paused" | "completed" | "fatal_error";
  currentChunkIndex: number;
  totalChunks: number;
  processingStartTime?: number;
}

interface QueueConfig {
  maxRetries: number;
  timeoutMs: number;
  retryDelayMs: number;
  batchId?: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  onFailure?: () => void;
}

class ChunkQueueManager {
  private state: QueueState;
  private chunks: ChunkInfo<ExtractedDataType>[];
  private socket: Socket;
  private config: QueueConfig;
  private timeoutHandler?: NodeJS.Timeout;
  private retryAttempts: Record<number, number> = {};

  constructor(socket: Socket, config: Partial<QueueConfig> = {}) {
    this.socket = socket;
    this.config = {
      maxRetries: config.maxRetries || 3,
      timeoutMs: config.timeoutMs || 5000,
      retryDelayMs: config.retryDelayMs || 1000,
      onProgress: config.onProgress,
      onComplete: config.onComplete,
      onFailure: config.onFailure,
    };

    this.state = {
      status: "idle",
      currentChunkIndex: 0,
      totalChunks: 0,
      processingStartTime: undefined,
    };

    this.chunks = [];
    this.setupSocketListeners();
  }

  public initialize(batchResult: BatchResult<ExtractedDataType>): void {
    this.chunks = batchResult.batch;
    this.state = {
      ...this.state,
      totalChunks: batchResult.numberOfChunks,
      status: "idle",
      currentChunkIndex: 0,
      processingStartTime: Date.now(),
    };
  }

  public start(): void {
    if (this.state.status !== "idle" && this.state.status !== "paused") {
      throw new Error("Queue must be idle or paused to start");
    }

    this.socket.emit("queue:decode:start", {
      totalChunks: this.state.totalChunks,
      startTime: Date.now(),
    });

    this.setStartTimeout();
  }

  public pause(): void {
    if (this.state.status === "processing") {
      this.state.status = "paused";
      this.clearTimeout();
    }
  }

  public resume(): void {
    if (this.state.status === "paused") {
      this.state.status = "processing";
      this.processNextChunk();
    }
  }

  private processNextChunk(): void {
    if (this.state.status !== "processing") {
      return;
    }

    const currentIndex = this.state.currentChunkIndex;

    if (currentIndex >= this.state.totalChunks) {
      this.emitComplete();
      return;
    }

    const currentChunk = this.chunks[currentIndex];

    this.socket.emit("chunk:data", {
      chunkIndex: currentIndex,
      chunkData: currentChunk,
    });

    this.setAckTimeout(currentIndex);
  }

  private handleChunkAck(chunkIndex: number): void {
    if (chunkIndex !== this.state.currentChunkIndex) {
      return;
    }

    const progress = (
      ((chunkIndex + 1) / this.state.totalChunks) *
      100
    ).toFixed(1);

    this.clearTimeout();
    this.state.currentChunkIndex++;

    this.config.onProgress?.(parseFloat(progress));
    this.processNextChunk();
  }

  private handleChunkError(chunkIndex: number, error: Error): void {
    const attempts = (this.retryAttempts[chunkIndex] || 0) + 1;
    this.retryAttempts[chunkIndex] = attempts;

    if (attempts <= this.config.maxRetries) {
      setTimeout(() => {
        if (this.state.status === "processing") {
          this.processNextChunk();
        } else {
        }
      }, this.config.retryDelayMs);
    } else {
      this.emitFatalError(chunkIndex, error);
    }
  }

  private emitComplete(): void {
    const duration = (
      (Date.now() - (this.state.processingStartTime || 0)) /
      1000
    ).toFixed(2);

    this.socket.emit("chunk:data:complete", {
      status: "success",
      stats: {
        processedChunks: this.state.totalChunks,
        duration: `${duration}s`,
      },
    });

    this.setCompletionTimeout();

    this.socket.on("chunk:data:complete:ack", () => {
      this.clearTimeout();

      this.state.status = "completed";

      this.config.onComplete?.();
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private emitFatalError(chunkIndex: number, error: Error): void {
    this.socket.emit("chunk:data:fatal", {
      batchId: this.config.batchId,
    });

    this.state.status = "fatal_error";

    this.clearTimeout();
    this.destroy();
  }

  private setupSocketListeners(): void {
    this.socket.on("queue:decode:start:ack", ({ status, batchId }) => {
      this.clearTimeout();

      if (status === "ready") {
        this.state.status = "processing";
        this.state.processingStartTime = Date.now();
        this.config.batchId = batchId;

        this.processNextChunk();
      }
    });

    this.socket.on("chunk:ack", ({ chunkIndex }) => {
      this.handleChunkAck(chunkIndex);
    });

    this.socket.on("chunk:error", ({ chunkIndex, error }) => {
      this.clearTimeout();

      switch (error) {
        case "init_error": {
          this.socket.emit("chunk:data:fatal");
          this.state.status = "fatal_error";

          this.config.onFailure?.();
          this.destroy();

          break;
        }

        case "redis_chunk_error": {
          this.handleChunkError(chunkIndex, new Error("redis_chunk_error"));
          break;
        }

        case "redis_completion_error": {
          this.socket.emit("chunk:data:fatal", {
            batchId: this.config.batchId,
          });

          this.state.status = "fatal_error";
          this.config.onFailure?.();

          this.destroy();

          break;
        }

        default: {
          console.error("Unknown chunk error received", error);
          break;
        }
      }
    });
  }

  private clearTimeout(): void {
    if (this.timeoutHandler) {
      clearTimeout(this.timeoutHandler);
      this.timeoutHandler = undefined;
    }
  }

  private setStartTimeout(): void {
    this.clearTimeout();

    this.timeoutHandler = setTimeout(() => {
      this.socket.emit("chunk:data:fatal", {
        batchId: this.config.batchId,
      });

      this.config.onFailure?.();

      this.state.status = "fatal_error";
      this.destroy();
    }, this.config.timeoutMs);
  }

  private setAckTimeout(chunkIndex: number): void {
    this.clearTimeout();

    this.timeoutHandler = setTimeout(() => {
      this.handleChunkError(chunkIndex, new Error("redis_chunk_error"));
    }, this.config.timeoutMs);
  }

  private setCompletionTimeout(): void {
    this.clearTimeout();

    this.timeoutHandler = setTimeout(() => {
      this.socket.emit("chunk:data:fatal", {
        batchId: this.config.batchId,
      });

      this.config.onFailure?.();

      this.state.status = "fatal_error";
      this.destroy();
    }, this.config.timeoutMs);
  }

  public destroy(): void {
    this.clearTimeout();
    this.socket.off("chunk:ack");
    this.socket.off("chunk:error");
    this.socket.off("queue:decode:start:ack");
    this.socket.off("chunk:data:complete:ack");
  }
}

export default ChunkQueueManager;
