import { ChunkingService } from "@/services/chunking/ChunkingService";
import { ExtractedDataType } from "@/services/engine/DOMFetcherService";

const chunkDataPayloadHandler = (scrappedData: Array<ExtractedDataType>) => {
  const chunkingService = new ChunkingService<ExtractedDataType>({
    maxBatchSizeInMB: 4.5,
  });

  const chunkedData = chunkingService.createBatches(scrappedData);

  return {
    chunkedData,
  };
};

export default chunkDataPayloadHandler;
