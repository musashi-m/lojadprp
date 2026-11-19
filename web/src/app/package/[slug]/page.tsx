import React from "react";
import { notFound } from "next/navigation";
import { PRODUCTS_DATA } from "@/data/mockProducts";
import { PackageDetailContent } from "./PackageDetailContent";

export function generateStaticParams() {
  return PRODUCTS_DATA.map((product) => ({
    slug: encodeURIComponent(product.slug),
  }));
}

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const product = PRODUCTS_DATA.find(
    (p) => p.slug === decodedSlug || p.slug === slug || p.id === slug
  );

  if (!product) {
    notFound();
  }

  return <PackageDetailContent product={product} />;
}
