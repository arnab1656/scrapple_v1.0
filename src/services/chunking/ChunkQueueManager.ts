import { Socket } from "socket.io-client";
import { BatchResult, ChunkInfo } from "@/services/chunking/ChunkingService";
import { ExtractedDataType } from "../engine/DOMFetcherService";

interface BatchFailure {
  failedAt: {
    chunkIndex: number;
    totalProcessed: number;
  };
  error: {
    type: "retry_exhausted" | "timeout" | "server_error";
    message: string;
    attempts: number;
  };
  timing: {
    startTime: number;
    failureTime: number;
    processingDuration: string;
  };
}

interface QueueState {
  status: "idle" | "processing" | "paused" | "completed" | "fatal_error";
  currentChunkIndex: number;
  totalChunks: number;
  processingStartTime?: number;
  batchFailure?: BatchFailure;
}

interface QueueConfig {
  maxRetries: number;
  timeoutMs: number;
  retryDelayMs: number;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  onBatchFailure?: (failure: BatchFailure) => void;
}

class ChunkQueueManager {
  private state: QueueState;
  private chunks: ChunkInfo<ExtractedDataType>[];
  private socket: Socket;
  private config: QueueConfig;
  private timeoutHandler?: NodeJS.Timeout;
  private isTestMode: boolean = false;
  private retryAttempts: Record<number, number> = {};

  constructor(socket: Socket, config: Partial<QueueConfig> = {}) {
    this.socket = socket;
    this.config = {
      maxRetries: config.maxRetries || 3,
      timeoutMs: config.timeoutMs || 5000,
      retryDelayMs: config.retryDelayMs || 1000,
      onProgress: config.onProgress,
      onComplete: config.onComplete,
      onBatchFailure: config.onBatchFailure,
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

    //_This is for testing purposes AND todo: REMOVE IT IN SEPERATE mODULE

    // if (this.isTestMode) {
    //   setTimeout(() => {
    //     this.state.status = "processing";
    //     this.state.processingStartTime = Date.now();

    //     this.processNextChunk();
    //   }, 500);
    //   return;
    // }

    this.socket.emit("queue:decode:start", {
      totalChunks: this.state.totalChunks,
      startTime: Date.now(),
    });
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

    //_This is for testing purposes AND todo: REMOVE IT IN SEPERATE mODULE

    // if (this.isTestMode) {
    //   //_The success rate is 90%
    //   setTimeout(() => {
    //     const shouldSucceed = Math.random() > 0.1;
    //     if (shouldSucceed) {
    //       this.handleChunkAck(currentIndex);
    //     } else {
    //       this.handleChunkError(
    //         currentIndex,
    //         new Error("Simulated random error")
    //       );
    //     }
    //   }, 1000);
    //   return;
    // }

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

    //_This is for testing purposes AND todo: REMOVE IT IN SEPERATE mODULE

    // if (this.isTestMode) {
    //   setTimeout(() => {
    //     this.state.status = "completed";
    //     this.clearTimeout();
    //     this.config.onComplete?.();
    //   }, 500);
    //   return;
    // }

    this.setCompletionTimeout();

    this.socket.once("chunk:data:complete:ack", () => {
      this.clearTimeout();

      console.log(`Batch processing completed successfully`, {
        totalChunks: this.state.totalChunks,
        timeElapsed: `${duration}s`,
        timestamp: new Date().toISOString(),
      });

      this.state.status = "completed";
      this.config.onComplete?.();
    });
  }

  private setCompletionTimeout(): void {
    this.clearTimeout();
    this.timeoutHandler = setTimeout(() => {
      console.error("❌ Server completion acknowledgment timeout");

      this.state.status = "completed";
      this.config.onComplete?.();

      console.warn(
        "⚠️ Warning: Could not confirm if server completed processing"
      );
    }, this.config.timeoutMs);
  }

  private emitFatalError(chunkIndex: number, error: Error): void {
    const failureTime = Date.now();
    const batchFailure: BatchFailure = {
      failedAt: {
        chunkIndex,
        totalProcessed: chunkIndex,
      },
      error: {
        type: "retry_exhausted",
        message: error.message,
        attempts: this.retryAttempts[chunkIndex] || 0,
      },
      timing: {
        startTime: this.state.processingStartTime || 0,
        failureTime,
        processingDuration: `${(
          (failureTime - (this.state.processingStartTime || 0)) /
          1000
        ).toFixed(2)}s`,
      },
    };

    this.socket.emit("chunk:data:fatal", {
      status: "error",
      error: {
        chunkIndex,
        reason: error.message,
        attempts: this.retryAttempts[chunkIndex] || 0,
      },
    });

    this.state.status = "fatal_error";
    this.state.batchFailure = batchFailure;

    this.clearTimeout();
    this.destroy();

    console.error(`❌ Batch processing failed`, {
      failedChunk: chunkIndex + 1,
      totalChunks: this.state.totalChunks,
      processedChunks: chunkIndex,
      error: error.message,
      attempts: this.retryAttempts[chunkIndex],
      timeElapsed: batchFailure.timing.processingDuration,
    });

    this.config.onBatchFailure?.(batchFailure);
  }

  private setupSocketListeners(): void {
    this.socket.on("queue:decode:start:ack", ({ status }) => {
      if (status === "ready") {
        this.state.status = "processing";
        this.state.processingStartTime = Date.now();

        this.processNextChunk();
      } else {
        console.error("❌ Server not ready to receive chunks", {
          receivedStatus: status,
          expectedStatus: "ready",
        });
      }
    });

    this.socket.on("chunk:ack", ({ chunkIndex }) => {
      this.handleChunkAck(chunkIndex);
    });

    this.socket.on("chunk:error", ({ chunkIndex, error }) => {
      this.handleChunkError(chunkIndex, error);
    });
  }

  private setAckTimeout(chunkIndex: number): void {
    this.clearTimeout();

    this.timeoutHandler = setTimeout(() => {
      this.handleChunkError(
        chunkIndex,
        new Error("Chunk acknowledgment timeout")
      );
    }, this.config.timeoutMs);
  }

  private clearTimeout(): void {
    if (this.timeoutHandler) {
      clearTimeout(this.timeoutHandler);
      this.timeoutHandler = undefined;
    }
  }

  public destroy(): void {
    this.clearTimeout();
    this.socket.off("chunk:ack");
    this.socket.off("chunk:error");
    this.socket.off("queue:decode:start:ack");
    this.socket.off("chunk:data:complete:ack");
  }

  public getState(): Readonly<QueueState & { failure?: BatchFailure }> {
    return {
      ...this.state,
      failure: this.state.batchFailure,
    };
  }
}

export default ChunkQueueManager;
