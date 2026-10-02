"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Users, ChevronRight } from "lucide-react";
import Link from "next/link";
import { UiState } from "./ui-state";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface CategoriesParallaxProps {
  categories: Category[];
}

export function CategoriesParallax({ categories }: CategoriesParallaxProps) {
  const { scrollY } = useScroll();
  
  const foregroundX = useTransform(
    scrollY,
    [0, 500],
    [0, 20], // move 20px horizontally for 500px of scroll
    { clamp: true }
  );
  
  const backgroundX = useTransform(
    scrollY,
    [0, 500],
    [0, 8], // move 8px horizontally for 500px of scroll (slower)
    { clamp: true }
  );

  return (
    <section className="bg-[#101716] py-24 sm:py-32">
      <div className="container-shell">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow text-[#d4ff59]">Find your people</p>
            <h2 className="display mt-5 text-5xl font-semibold leading-[.94] sm:text-6xl">
              Professionals worth<br />bringing in.
            </h2>
          </div>
          <Link href="/vendors" className="inline-flex items-center gap-2 text-sm font-bold text-[#d4ff59]">
            View marketplace <ChevronRight size={16} />
          </Link>
        </div>
        
        <motion.div 
          className="mt-12 grid gap-px overflow-hidden rounded-[24px] border border-white/12 bg-white/12 md:grid-cols-5"
          style={{ x: backgroundX }}
        >
          {categories && categories.length > 0 ? categories.slice(0, 5).map((category, index) => (
            <motion.div
              key={category.id}
              style={{ x: foregroundX }}
              className="min-h-48 bg-[#101716] p-6 transition hover:bg-[#1b2b27]"
            >
              <Link href={`/vendors?category=${category.slug}`} className="group">
                <Users size={19} className="text-[#d4ff59]" />
                <p className="mt-12 text-xl font-bold tracking-tight">{category.name}</p>
                <span className="mt-3 flex items-center gap-1 text-[11px] font-bold text-white/45 group-hover:text-[#d4ff59]">
                  Explore <ChevronRight size={12} />
                </span>
              </Link>
            </motion.div>
          )) : (
            <UiState className="col-span-full" title="Categories are being curated" description="Our marketplace team is preparing the first collection." />
          )}
        </motion.div>
      </div>
    </section>
  );
}
