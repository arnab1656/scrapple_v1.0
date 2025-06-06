"use client";

import DataGridDemo from "@/components/MUI_Data_grid_comp/dataGrid";
import { Button } from "@/components/ui/button";
import { useChunkQueue } from "@/hook/useChunkQueue";
import chunkDataPayloadHandler from "@/lib/actions/chunkDataPayload";
import { ExtractedDataType } from "@/services/engine/DOMFetcherService";
import { useEffect, useState } from "react";

export default function EmailAnalysisPage() {
  const { startProcessing } = useChunkQueue();

  const [scrappedData, setScrappedData] = useState<Array<ExtractedDataType>>(
    []
  );

  useEffect(() => {
    if (localStorage.getItem("scrappedData")) {
      const dataResult = JSON.parse(
        localStorage.getItem("scrappedData") || "{}"
      );
      setScrappedData(dataResult.scrappedData);
    }
  }, []);

  const handleEmailAutomation = () => {
    const batchResult = chunkDataPayloadHandler(scrappedData);
    startProcessing(batchResult.chunkedData);
  };

  return (
    <div className="flex flex-col gap-2 p-10 bg-gray-600 h-screen">
      <div className="flex justify-around items-center">
        <h1 className="text-2xl font-bold text-center">Email Analysis</h1>
        <Button variant="outline" onClick={handleEmailAutomation}>
          Automate Emails
        </Button>
      </div>
      <DataGridDemo scrappedData={scrappedData} />
    </div>
  );
}
