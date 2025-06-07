import { useSocket } from "@/provider/socketClient";
import ChunkQueueManager from "@/services/chunking/ChunkQueueManager";
import { useState, useCallback, useEffect } from "react";
import { BatchResult } from "@/services/chunking/ChunkingService";
import { ExtractedDataType } from "@/services/engine/DOMFetcherService";

interface QueueProgress {
  progress: number;
  status: "idle" | "processing" | "paused" | "completed" | "error";
}

export const useChunkQueue = () => {
  const socket = useSocket();

  const [queueManager, setQueueManager] = useState<ChunkQueueManager | null>(
    null
  );
  const [progress, setProgress] = useState<QueueProgress>({
    progress: 0,
    status: "idle",
  });

  // Initialize queue manager
  useEffect(() => {
    if (socket) {
      const manager = new ChunkQueueManager(socket, {
        maxRetries: 3,
        timeoutMs: 5000,
        retryDelayMs: 1000,
        onProgress: (progress) => {
          setProgress((prev) => ({ ...prev, progress }));
        },
        onComplete: () => {
          setProgress((prev) => ({ ...prev, status: "completed" }));
        },
      });

      setQueueManager(manager);

      return () => {
        manager.destroy();
      };
    }
  }, [socket]);

  const startProcessing = useCallback(
    (batchResult: BatchResult<ExtractedDataType>) => {
      if (queueManager) {
        try {
          queueManager.initialize(batchResult);
          queueManager.start();
          setProgress((prev) => ({ ...prev, status: "processing" }));
        } catch (error) {
          console.error("Failed to start processing:", error);
          setProgress((prev) => ({ ...prev, status: "error" }));
        }
      }
    },
    [queueManager]
  );

  return {
    startProcessing,
    progress,
    queueManager,
  };
};
