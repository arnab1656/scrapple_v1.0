export interface ChunkConfig {
  maxBatchSizeInMB: number;
}

export interface ChunkInfo<T> {
  data: T[];
  sizeInMB: number;
}

export interface BatchResult<T> {
  batch: ChunkInfo<T>[];
  totalBatchSizeInMB: number;
  numberOfChunks: number;
}

export class ChunkingService<T> {
  private config: ChunkConfig;
  private readonly BYTES_TO_MB = 1024 * 1024;

  constructor(config: Partial<ChunkConfig> = {}) {
    this.config = {
      maxBatchSizeInMB: config.maxBatchSizeInMB || 4.5,
    };
  }

  private calculateBatchSize(data: T[]): number {
    if (data.length === 0) return 0;

    const sampleItem = data[0];
    const itemSizeInBytes = new TextEncoder().encode(
      JSON.stringify(sampleItem)
    ).length;
    const itemSizeInMB = itemSizeInBytes / this.BYTES_TO_MB;

    const itemsPerChunk = Math.floor(
      this.config.maxBatchSizeInMB / itemSizeInMB
    );

    return Math.max(1, itemsPerChunk);
  }

  private calculateSizeInMB(data: T[]): number {
    const sizeInBytes = new TextEncoder().encode(JSON.stringify(data)).length;
    return sizeInBytes / this.BYTES_TO_MB;
  }

  public createBatches(data: T[]): BatchResult<T> {
    try {
      if (!Array.isArray(data)) {
        throw new Error("Input must be an array");
      }

      if (data.length === 0) {
        return {
          batch: [],
          totalBatchSizeInMB: 0,
          numberOfChunks: 0,
        };
      }

      // Calculate initial chunk size
      //   const itemsPerChunk = this.calculateBatchSize(data);

      // Create chunks for the batch
      const chunks: ChunkInfo<T>[] = [];
      let currentChunkData: T[] = [];
      let currentChunkSize = 0;
      let totalBatchSize = 0;

      for (const item of data) {
        const itemSize = this.calculateSizeInMB([item]);

        if (
          currentChunkSize + itemSize > this.config.maxBatchSizeInMB &&
          currentChunkData.length > 0
        ) {
          chunks.push({
            data: currentChunkData,
            sizeInMB: currentChunkSize,
          });
          totalBatchSize += currentChunkSize;

          currentChunkData = [];
          currentChunkSize = 0;
        }

        currentChunkData.push(item);
        currentChunkSize += itemSize;
      }

      if (currentChunkData.length > 0) {
        chunks.push({
          data: currentChunkData,
          sizeInMB: currentChunkSize,
        });
        totalBatchSize += currentChunkSize;
      }

      return {
        batch: chunks,
        totalBatchSizeInMB: totalBatchSize,
        numberOfChunks: chunks.length,
      };
    } catch (error) {
      console.error("Error creating batch:", error);
      throw error;
    }
  }
}
