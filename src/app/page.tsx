"use client";

import OutlinedCard from "@/components/MUI_comp/postCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const dummyData = [
  {
    postContent: "This is a post content",
    authorName: "John Doe",
    profileURL: "https://www.linkedin.com/in/john-doe",
    email: "john.doe@example.com",
    phone: "1234567890",
  },
  {
    postContent: "This is a post content",
    authorName: "John Doe",
    profileURL: "https://www.linkedin.com/in/john-doe",
    email: "john.doe@example.com",
    phone: "1234567890",
  },
  {
    postContent: "This is a post content",
    authorName: "John Doe",
    profileURL: "https://www.linkedin.com/in/john-doe",
    email: "john.doe@example.com",
    phone: "1234567890",
  },
  {
    postContent: "This is a post content",
    authorName: "John Doe",
    profileURL: "https://www.linkedin.com/in/john-doe",
    email: "john.doe@example.com",
    phone: "1234567890",
  },
];

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
      <section className="flex flex-col gap-2 mx-[100px] p-10 bg-gray-100">
        {dummyData.map((item, key) => {
          return (
            <OutlinedCard
              key={key}
              postContent={item.postContent}
              authorName={item.authorName}
              profileURL={item.profileURL}
              email={item.email}
              phone={item.phone}
            />
          );
        })}
      </section>
    </>
  );
}
