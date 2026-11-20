import React from "react";
import { notFound } from "next/navigation";
import { dbRepository } from "@/lib/db";
import { PRODUCTS_DATA } from "@/data/mockProducts";
import { PackageDetailContent } from "./PackageDetailContent";

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const product =
    dbRepository.getProductByIdOrSlug(decodedSlug) ||
    dbRepository.getProductByIdOrSlug(slug) ||
    PRODUCTS_DATA.find(
      (p) => p.slug === decodedSlug || p.slug === slug || p.id === slug
    );

  if (!product) {
    notFound();
  }

  return <PackageDetailContent product={product} />;
}
