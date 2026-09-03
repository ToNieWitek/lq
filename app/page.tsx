"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Brand } from "@/types";
import { INITIAL_BRANDS } from "@/lib/initialData";
import { getBrandsDB, getSettingDB } from "@/lib/supabase/syncService";
import { Clock } from "lucide-react";

export default function HomePage() {
  const [brands, setBrands] = useState<Brand[]>(INITIAL_BRANDS);
  const [lastUpdated, setLastUpdated] = useState<string>("03.09.2026 21:00");

  useEffect(() => {
    const loadHomeData = async () => {
      // 1. Data aktualizacji z Supabase (z fallbackiem)
      const dateVal = await getSettingDB("liquids_last_updated", "03.09.2026 21:00");
      setLastUpdated(dateVal);

      // 2. Marki z Supabase
      const brandsVal = await getBrandsDB();
      if (brandsVal && brandsVal.length > 0) {
        setBrands(brandsVal);
      }
    };

    loadHomeData();
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-12 sm:p-12">
      <div className="w-full max-w-5xl space-y-8 sm:space-y-12">
        {/* Kafelki marek na środku ekranu */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-12">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/brand/${brand.id}`}
              className="group flex flex-col items-center cursor-pointer transition-transform duration-300 hover:scale-[1.03]"
            >
              <div className="w-full aspect-square rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden flex items-center justify-center group-hover:border-zinc-400 dark:group-hover:border-zinc-600 transition-colors">
                {brand.image_url ? (
                  <img
                    src={brand.image_url}
                    alt={brand.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-white dark:bg-zinc-900" />
                )}
              </div>

              <h2 className="mt-4 text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-teal-500 dark:group-hover:text-teal-400 transition-colors">
                {brand.name}
              </h2>
            </Link>
          ))}
        </div>

        {/* Tekst pod markami informujący o ostatniej aktualizacji */}
        <div className="text-center pt-2">
          <p className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500">
            <Clock className="w-4 h-4 text-teal-500" />
            <span>
              Ostatnia aktualizacja listy liquidów:{" "}
              <strong className="text-zinc-700 dark:text-zinc-300 font-mono font-bold">
                {lastUpdated}
              </strong>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
