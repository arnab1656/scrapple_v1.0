"use client";

import DataGridDemo from "@/components/MUI_comp/dataGrid";
import { ExtractedDataType } from "@/services/engine/DOMFetcherService";
import { useEffect, useState } from "react";

export default function EmailAnalysisPage() {
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

  return (
    <div className="flex flex-col gap-2 p-10 bg-gray-600 h-screen">
      <h1 className="text-2xl font-bold text-center">Email Analysis</h1>
      <DataGridDemo scrappedData={scrappedData} />
    </div>
  );
}
