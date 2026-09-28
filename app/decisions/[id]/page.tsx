import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRecords } from "@/lib/content";
import { RecordPage, recordParams } from "@/components/article/record-page";

export const dynamicParams = false;

export function generateStaticParams() {
  return recordParams("decisions");
}

export async function generateMetadata({ params }: PageProps<"/decisions/[id]">): Promise<Metadata> {
  const { id } = await params;
  const doc = getRecords("decisions").find(d => d.id === id);
  return doc ? { title: doc.title } : {};
}

export default async function Page({ params }: PageProps<"/decisions/[id]">) {
  const { id } = await params;
  const doc = getRecords("decisions").find(d => d.id === id);
  if (!doc) notFound();
  return <RecordPage doc={doc} />;
}
