"use client";

import OutlinedCard from "@/components/MUI_comp/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function Home() {
  return (
    <>
      <section className="flex flex-col items-center justify-start min-h-screen mx-[100px] space-y-15 mt-15">
        <div className="w-full h-1/2">
          <h1 className="text-2xl font-bold text-center">Enter the DOM</h1>
          <Textarea className="w-full resize-y min-h-[300px]" />
        </div>
        <div className="flex flex-row gap-2">
          <div>
            <Button className="cursor-pointer" variant="outline">
              Scrape It
            </Button>
          </div>
          <div>
            <Button className="cursor-pointer" variant="outline">
              Analyse Emails
            </Button>
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold">Scraped Organized Data (below)</h1>
        </div>
      </section>
      <section>
        <OutlinedCard />
      </section>
    </>
  );
}
