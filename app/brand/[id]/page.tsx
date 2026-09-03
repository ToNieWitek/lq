"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Brand, Product } from "@/types";
import { INITIAL_BRANDS, INITIAL_PRODUCTS } from "@/lib/initialData";
import { getBrandsDB, getProductsDB } from "@/lib/supabase/syncService";
import { ArrowLeft, Search } from "lucide-react";

export default function BrandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const brandId = resolvedParams.id.toLowerCase();

  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available" | "unavailable">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Sprawdź marki (w tym dynamicznie dodane w adminie)
    let brandsList = INITIAL_BRANDS;
    const localBrandsStr = localStorage.getItem("demo_brands");
    if (localBrandsStr) {
      try {
        brandsList = JSON.parse(localBrandsStr);
      } catch {
        // ignore
      }
    }
    const foundBrand = brandsList.find((b) => b.id === brandId);
    if (foundBrand) setBrand(foundBrand);

    // 2. Pobierz produkty
    const loadData = async () => {
      setLoading(true);
      try {
        const [allBrands, brandProds] = await Promise.all([
          getBrandsDB(),
          getProductsDB(brandId),
        ]);

        const currentBrand = allBrands.find(
          (b) => b.id.toLowerCase() === brandId.toLowerCase()
        );
        if (currentBrand) setBrand(currentBrand);

        setProducts(brandProds);
      } catch (err) {
        console.warn("Fetch products error", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [brandId]);

  // Filtrowanie po wyszukiwarce ORAZ po dostępności
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase().trim());
    if (!matchesSearch) return false;

    if (availabilityFilter === "available") return p.is_available;
    if (availabilityFilter === "unavailable") return !p.is_available;
    return true;
  });

  // Sortowanie:
  // 1. Dostępne Nowości (is_new && is_available) na samym początku (alfabetycznie)
  // 2. Standardowe Dostępne liquidy alfabetycznie po nazwie
  // 3. Niedostępne liquidy ZAWSZE na samym końcu (alfabetycznie)
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    // Jeżeli jeden jest dostępny a drugi niedostępny -> dostępny ZAWSZE wyżej
    if (a.is_available !== b.is_available) {
      return a.is_available ? -1 : 1;
    }

    // Wśród produktów o tej samej dostępności: NOWE idą na początek
    if (Boolean(a.is_new) !== Boolean(b.is_new)) {
      return a.is_new ? -1 : 1;
    }

    // W obrębie tej samej grupy sortujemy alfabetycznie po nazwie smaku
    return a.name.localeCompare(b.name, "pl", { sensitivity: "base" });
  });

  return (
    <div className="min-h-screen px-4 py-6 sm:p-12 max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* Przycisk powrotu */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors p-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Powrót do marek</span>
        </Link>
      </div>

      {/* Nagłówek: Kolekcja Liquidów i nazwa firmy oraz informacja o ładowaniu */}
      <div className="space-y-1">
        <span className="text-[11px] uppercase font-extrabold tracking-widest text-teal-600 dark:text-teal-400">
          Kolekcja Liquidów
        </span>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-white">
          {brand?.name || brandId.toUpperCase()}
        </h1>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 pt-0.5">
          ℹ️ Jeśli nie widzisz jeszcze żadnych smaków, odczekaj chwilkę – lista wczytuje się z bazy.
        </p>
      </div>

      {/* WYSZUKIWARKA ORAZ FILTRY (Wszystkie / Dostępne / Niedostępne) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Szukaj smaku..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
          />
        </div>

        {/* Przyciski filtrów: w telefonach równe 3 kolumny (w-full grid grid-cols-3) */}
        <div className="grid grid-cols-3 sm:flex items-center gap-1.5 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-bold text-center">
          <button
            type="button"
            onClick={() => setAvailabilityFilter("all")}
            className={`py-2 px-3 sm:py-1.5 sm:px-3.5 rounded-xl transition-all cursor-pointer ${
              availabilityFilter === "all"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            Wszystkie
          </button>
          <button
            type="button"
            onClick={() => setAvailabilityFilter("available")}
            className={`py-2 px-3 sm:py-1.5 sm:px-3.5 rounded-xl transition-all cursor-pointer ${
              availabilityFilter === "available"
                ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-zinc-500 hover:text-emerald-500"
            }`}
          >
            Dostępne
          </button>
          <button
            type="button"
            onClick={() => setAvailabilityFilter("unavailable")}
            className={`py-2 px-3 sm:py-1.5 sm:px-3.5 rounded-xl transition-all cursor-pointer ${
              availabilityFilter === "unavailable"
                ? "bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-sm"
                : "text-zinc-500 hover:text-rose-500"
            }`}
          >
            Niedostępne
          </button>
        </div>
      </div>

      {/* Stan ładowania */}
      {loading ? (
        <div className="py-32 text-center space-y-4">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-base font-bold text-zinc-600 dark:text-zinc-300 animate-pulse">
            Ładowanie liquidów... Proszę chwilkę poczekać
          </p>
        </div>
      ) : sortedProducts.length === 0 ? (
        <div className="py-24 text-center rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 text-sm text-zinc-500 space-y-2">
          <p className="font-semibold text-zinc-700 dark:text-zinc-300">
            {search ? `Brak smaków pasujących do "${search}"` : "Nie widać jeszcze żadnych smaków?"}
          </p>
          <p className="text-xs text-zinc-400">
            Jeżeli lista się nie wyświetla, odczekaj chwilkę lub odśwież stronę, aby załadować aktualne produkty.
          </p>
        </div>
      ) : (
        /* Siatka poziomych kafelków z kwadratowym zdjęciem */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProducts.map((product) => {
            const isUnavailable = !product.is_available;
            const isNew = product.is_new;

            const hasGradient = product.gradient_colors && product.gradient_colors.length >= 2;
            const gradientStyle = hasGradient
              ? {
                  backgroundImage: `linear-gradient(135deg, ${product.gradient_colors!.join(", ")})`,
                }
              : {};

            return (
              <div
                key={product.id}
                style={gradientStyle}
                className={`relative rounded-3xl p-4 flex flex-row items-center gap-4 transition-all duration-200 shadow-md overflow-hidden ${
                  isNew
                    ? "border-2 border-amber-400 dark:border-amber-400 ring-2 ring-amber-400/20"
                    : "border border-zinc-200 dark:border-zinc-800"
                } ${
                  isUnavailable
                    ? "bg-zinc-200/40 dark:bg-zinc-950/80 opacity-30 grayscale-[70%]"
                    : hasGradient
                    ? "hover:scale-[1.02]"
                    : "bg-white dark:bg-zinc-900 hover:scale-[1.02]"
                }`}
              >
                {/* Przyciemniająca nakładka dla kafelków z gradientem, aby napisy były ultra czytelne i wyraźne */}
                {hasGradient && !isUnavailable && (
                  <div className="absolute inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-[2px] pointer-events-none" />
                )}

                {/* Żółta plakietka "Nowe" na borderze kafelka */}
                {isNew && (
                  <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase bg-amber-400 text-zinc-950 shadow-md z-10">
                    Nowe
                  </span>
                )}

                {/* Kwadratowe zdjęcie produktu */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-center relative z-10 shadow-sm">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-100 dark:bg-zinc-900" />
                  )}
                </div>

                {/* Pod/obok zdjęcia: PEŁNA NAZWA SMAKU oraz ile MG i ML wraz z emotkami */}
                <div className="flex-1 min-w-0 flex flex-col justify-center relative z-10">
                  <h3
                    className={`text-sm sm:text-base font-black leading-snug break-words ${
                      hasGradient
                        ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                        : "text-zinc-900 dark:text-zinc-100"
                    }`}
                  >
                    {product.name}
                  </h3>

                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs font-mono font-bold">
                    {product.nicotine_strength && (
                      <span
                        className={`px-2 py-0.5 rounded-lg ${
                          hasGradient
                            ? "bg-black/50 text-zinc-100 border border-white/10"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        {product.nicotine_strength.toUpperCase()}
                      </span>
                    )}
                    {product.volume_ml && (
                      <span
                        className={`px-2 py-0.5 rounded-lg ${
                          hasGradient
                            ? "bg-black/50 text-zinc-100 border border-white/10"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        {product.volume_ml.toUpperCase()}
                      </span>
                    )}
                    {/* Opcjonalne emotki obok MG i ML */}
                    {product.emoji && (
                      <span className="text-base sm:text-lg select-none filter drop-shadow">
                        {product.emoji}
                      </span>
                    )}
                  </div>

                  {/* Bardzo przyciemniony stan z pochylonym napisem Niedostępny */}
                  {isUnavailable && (
                    <span className="mt-2 text-xs font-black italic tracking-wide text-red-600 dark:text-red-400">
                      Niedostępny
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
