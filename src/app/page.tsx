"use client";

import OutlinedCard from "@/components/postCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DOMFetcherService } from "@/services/engine/DOMFetcherService";
import { useEffect, useState } from "react";
import { ExtractedDataType } from "@/services/engine/DOMFetcherService";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const [DOM, setDOM] = useState<string>("");

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

  const scrapeIt = () => {
    const domFetcherService = new DOMFetcherService(DOM);
    const scrappedData = domFetcherService.masterExtractor();

    if (localStorage.getItem("scrappedData")) {
      return;
    }
    localStorage.setItem(
      "scrappedData",
      JSON.stringify({ createdAt: new Date(), scrappedData })
    );
    setScrappedData(scrappedData);
  };

  return (
    <>
      <section className="flex flex-col items-center justify-start min-h-screen mx-[100px] space-y-15 mt-15">
        <div className="w-full h-1/2">
          <h1 className="text-2xl font-bold text-center">Enter the DOM</h1>
          <Textarea
            className="w-full resize-y min-h-[300px]"
            onChange={(e) => setDOM(e.target.value)}
          />
        </div>
        <div className="flex flex-row gap-2">
          <div>
            <Button variant={DOM ? "outline" : "disabled"} onClick={scrapeIt}>
              Scrape It
            </Button>
          </div>
          <div>
            <Button
              variant={scrappedData.length > 0 ? "outline" : "disabled"}
              onClick={() => {
                router.push("/email_analysis");
              }}
            >
              Analyse Emails
            </Button>
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold">Scraped Organized Data (below)</h1>
        </div>
      </section>
      {scrappedData.length > 0 && (
        <section className="flex flex-col gap-2 mx-[100px] p-10 bg-gray-100">
          {scrappedData.map((item, key) => {
            return (
              <OutlinedCard
                key={key}
                postContent={item.content || ""}
                authorName={item.author || ""}
                profileURL={item.linkedInURL || ""}
                email={item.email?.[0] || ""}
                phone={item.phoneNumber?.[0] || ""}
              />
            );
          })}
        </section>
      )}
    </>
  );
}
