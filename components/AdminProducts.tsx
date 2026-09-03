"use client";
import React, { useState, useMemo } from "react";
import { Product, Brand } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { setSettingDB, deleteBulkProductsDB, upsertProductDB } from "@/lib/supabase/syncService";
import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Search,
  ArrowUpDown,
  Calendar,
  CheckSquare,
  Square,
  Image as ImageIcon,
  Palette,
  Smile,
} from "lucide-react";

interface Props {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  brands: Brand[];
}

// Popularne gotowe gradienty do szybkiego wyboru
const PRESET_GRADIENTS = [
  { label: "Brak (Zwykły)", colors: [] },
  { label: "Fioletowo-Różowy", colors: ["#8b5cf6", "#ec4899"] },
  { label: "Błękitno-Turkusowy", colors: ["#06b6d4", "#3b82f6"] },
  { label: "Neonowa Limonka", colors: ["#10b981", "#84cc16"] },
  { label: "Słoneczny Zachód", colors: ["#f59e0b", "#ef4444"] },
  { label: "Ciemny Karmazyn", colors: ["#881337", "#4c0519"] },
  { label: "Midnight Dark", colors: ["#1e1b4b", "#312e81"] },
];

// Popularne emotki owoców / smaków do szybkiego kliknięcia
const QUICK_EMOJIS = ["🍓", "🍉", "🍇", "🫐", "🥭", "🍋", "🍏", "🍒", "🍑", "🥝", "❄️", "⚡", "🔥", "🍬", "🍹"];

export default function AdminProducts({ products, setProducts, brands }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [lastUpdatedDate, setLastUpdatedDate] = useState<string>("03.09.2026 21:00");
  const [showDateModal, setShowDateModal] = useState(false);
  const [newDateInput, setNewDateInput] = useState("");

  // Wyszukiwarka i sortowanie
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBrand, setFilterBrand] = useState("all");
  const [filterAvailability, setFilterAvailability] = useState("all");
  const [sortBy, setSortBy] = useState<"name_asc" | "name_desc" | "brand" | "newest">("name_asc");

  // Masowe zaznaczanie
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Kolory gradientu w formularzu (np. 2 lub 3 kolory hex)
  const [gradientColor1, setGradientColor1] = useState("#8b5cf6");
  const [gradientColor2, setGradientColor2] = useState("#ec4899");
  const [useGradient, setUseGradient] = useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem("liquids_last_updated");
    if (saved) setLastUpdatedDate(saved);
  }, []);

  const handleSaveUpdatedDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDateInput.trim()) return;
    setLastUpdatedDate(newDateInput.trim());
    localStorage.setItem("liquids_last_updated", newDateInput.trim());
    setSettingDB("liquids_last_updated", newDateInput.trim());
    setShowDateModal(false);
  };

  const setDateToNow = () => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const formatted = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setNewDateInput(formatted);
  };

  // Domyślnie 50MG i 30ML zgodnie z poleceniem
  const [form, setForm] = useState<{
    name: string;
    brand_id: string;
    image_url: string;
    emoji: string;
    gradient_colors: string[];
    nicotine_strength: string;
    volume_ml: string;
    is_available: boolean;
    is_new: boolean;
    price: number;
  }>({
    name: "",
    brand_id: "elfliq",
    image_url: "",
    emoji: "",
    gradient_colors: [],
    nicotine_strength: "50MG",
    volume_ml: "30ML",
    is_available: true,
    is_new: false,
    price: 19.99,
  });

  const toggleAvailability = async (product: Product) => {
    const updated = !product.is_available;
    const newProducts = products.map((p) =>
      p.id === product.id ? { ...p, is_available: updated } : p
    );
    setProducts(newProducts);
    localStorage.setItem("demo_products", JSON.stringify(newProducts));

    try {
      const supabase = createClient();
      await supabase.from("products").update({ is_available: updated }).eq("id", product.id);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleIsNew = async (product: Product) => {
    const updated = !product.is_new;
    const newProducts = products.map((p) =>
      p.id === product.id ? { ...p, is_new: updated } : p
    );
    setProducts(newProducts);
    localStorage.setItem("demo_products", JSON.stringify(newProducts));

    try {
      const supabase = createClient();
      await supabase.from("products").update({ is_new: updated }).eq("id", product.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();

    const preparedGradient = useGradient && gradientColor1 && gradientColor2
      ? [gradientColor1, gradientColor2]
      : [];

    const productPayload = {
      ...form,
      gradient_colors: preparedGradient,
    };

    if (editingProduct) {
      const updatedProduct: Product = {
        ...editingProduct,
        ...productPayload,
      };
      const updatedList = products.map((p) =>
        p.id === editingProduct.id ? updatedProduct : p
      );
      setProducts(updatedList);
      localStorage.setItem("demo_products", JSON.stringify(updatedList));
      await upsertProductDB(updatedProduct);
    } else {
      const newProd: Product = {
        id: "prod-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        ...productPayload,
        created_at: new Date().toISOString(),
      };
      const updatedList = [newProd, ...products];
      setProducts(updatedList);
      localStorage.setItem("demo_products", JSON.stringify(updatedList));
      await upsertProductDB(newProd);
    }
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleDelete = async (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    setSelectedIds((prev) => prev.filter((item) => item !== id));
    localStorage.setItem("demo_products", JSON.stringify(updated));

    try {
      const supabase = createClient();
      await supabase.from("products").delete().eq("id", id);
    } catch (e) {
      console.error(e);
    }
  };

  // Operacje masowe na produktach
  const handleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkSetNew = (isNew: boolean) => {
    if (selectedIds.length === 0) return;
    const updated = products.map((p) => {
      if (selectedIds.includes(p.id)) {
        const item = { ...p, is_new: isNew };
        upsertProductDB(item);
        return item;
      }
      return p;
    });
    setProducts(updated);
    localStorage.setItem("demo_products", JSON.stringify(updated));
  };

  const handleBulkSetAvailable = (isAvailable: boolean) => {
    if (selectedIds.length === 0) return;
    const updated = products.map((p) => {
      if (selectedIds.includes(p.id)) {
        const item = { ...p, is_available: isAvailable };
        upsertProductDB(item);
        return item;
      }
      return p;
    });
    setProducts(updated);
    localStorage.setItem("demo_products", JSON.stringify(updated));
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    const updated = products.filter((p) => !selectedIds.includes(p.id));
    deleteBulkProductsDB(selectedIds);
    setProducts(updated);
    setSelectedIds([]);
    localStorage.setItem("demo_products", JSON.stringify(updated));
  };

  // Filtrowanie i sortowanie
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.brand_id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesBrand = filterBrand === "all" || p.brand_id === filterBrand;
        const matchesAvail =
          filterAvailability === "all"
            ? true
            : filterAvailability === "available"
            ? p.is_available
            : !p.is_available;
        return matchesSearch && matchesBrand && matchesAvail;
      })
      .sort((a, b) => {
        if (sortBy === "name_asc") return a.name.localeCompare(b.name, "pl");
        if (sortBy === "name_desc") return b.name.localeCompare(a.name, "pl");
        if (sortBy === "brand") return a.brand_id.localeCompare(b.brand_id, "pl");
        if (sortBy === "newest") {
          return (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0);
        }
        return 0;
      });
  }, [products, searchQuery, filterBrand, filterAvailability, sortBy]);

  return (
    <div className="space-y-6">
      {/* Pasek akcji i daty aktualizacji */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-zinc-900 dark:text-white">
            Baza Produktów (Lista)
          </h3>
          <p className="text-xs text-zinc-500">
            Zarządzaj emotkami, gradientami tła, zdjęciami URL i edytuj masowo wybrane liquidy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setNewDateInput(lastUpdatedDate);
              setShowDateModal(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs border border-zinc-200 dark:border-zinc-700 transition-all cursor-pointer shadow-sm"
          >
            <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Aktualizacja: {lastUpdatedDate}</span>
          </button>

          <button
            onClick={() => {
              setEditingProduct(null);
              setForm({
                name: "",
                brand_id: brands[0]?.id || "elfliq",
                image_url: "",
                emoji: "",
                gradient_colors: [],
                nicotine_strength: "50MG",
                volume_ml: "30ML",
                is_available: true,
                is_new: false,
                price: 19.99,
              });
              setUseGradient(false);
              setGradientColor1("#8b5cf6");
              setGradientColor2("#ec4899");
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Dodaj liquid</span>
          </button>
        </div>
      </div>

      {/* Pasek wyszukiwarki, filtrów i sortowania */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Szukaj po smaku lub marce..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Marka */}
          <select
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
            className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-semibold"
          >
            <option value="all">Wszystkie marki</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Dostępność */}
          <select
            value={filterAvailability}
            onChange={(e) => setFilterAvailability(e.target.value)}
            className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-semibold"
          >
            <option value="all">Wszystkie stany</option>
            <option value="available">Tylko dostępne</option>
            <option value="unavailable">Tylko niedostępne</option>
          </select>

          {/* Sortowanie */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-semibold focus:outline-none"
            >
              <option value="name_asc">Nazwa (A-Z)</option>
              <option value="name_desc">Nazwa (Z-A)</option>
              <option value="brand">Według marki</option>
              <option value="newest">Nowości na początku</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pasek akcji masowych przy zaznaczeniu */}
      {selectedIds.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-purple-700 dark:text-purple-300">
            <CheckSquare className="w-4 h-4" />
            <span>Zaznaczono {selectedIds.length} z {filteredProducts.length}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleBulkSetNew(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ustaw jako NOWOŚĆ</span>
            </button>
            <button
              onClick={() => handleBulkSetNew(false)}
              className="px-3 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 text-zinc-800 dark:text-zinc-200 font-bold text-xs cursor-pointer"
            >
              Usuń NOWOŚĆ
            </button>
            <button
              onClick={() => handleBulkSetAvailable(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
            >
              Ustaw Dostępne
            </button>
            <button
              onClick={() => handleBulkSetAvailable(false)}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
            >
              Ustaw Niedostępne
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Usuń zaznaczone</span>
            </button>
          </div>
        </div>
      )}

      {/* Widok tabeli / listy produktów */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-4 w-10 text-center">
                  <button
                    onClick={handleSelectAll}
                    className="cursor-pointer text-zinc-400 hover:text-purple-600"
                  >
                    {selectedIds.length > 0 && selectedIds.length === filteredProducts.length ? (
                      <CheckSquare className="w-4 h-4 text-purple-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-4">Zdjęcie / Tło</th>
                <th className="p-4">Smak & Emotka</th>
                <th className="p-4">Marka</th>
                <th className="p-4">Parametry</th>
                <th className="p-4">Status</th>
                <th className="p-4">Nowość</th>
                <th className="p-4 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-zinc-400">
                    Brak liquidów spełniających wybrane kryteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  const brandName =
                    brands.find((b) => b.id.toLowerCase() === p.brand_id.toLowerCase())?.name ||
                    p.brand_id;

                  const hasGradient = p.gradient_colors && p.gradient_colors.length >= 2;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors ${
                        isSelected ? "bg-purple-50/60 dark:bg-purple-950/20" : ""
                      }`}
                    >
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleSelect(p.id)}
                          className="cursor-pointer text-zinc-400 hover:text-purple-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-purple-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Miniaturka zdjęcia z gradientem jeśli włączony */}
                      <td className="p-4">
                        <div
                          style={
                            hasGradient
                              ? {
                                  backgroundImage: `linear-gradient(135deg, ${p.gradient_colors!.join(", ")})`,
                                }
                              : undefined
                          }
                          className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center relative shadow-sm"
                        >
                          {hasGradient && (
                            <div className="absolute inset-0 bg-black/40 pointer-events-none" />
                          )}
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="w-full h-full object-contain p-0.5 relative z-10"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-zinc-400 relative z-10 opacity-60" />
                          )}
                        </div>
                      </td>

                      <td className="p-4 font-bold text-zinc-900 dark:text-zinc-100">
                        <div className="flex items-center gap-2">
                          {p.emoji && <span className="text-base select-none">{p.emoji}</span>}
                          <span>{p.name}</span>
                          {p.is_new && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-amber-400 text-zinc-950">
                              NEW
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {brandName}
                        </span>
                      </td>

                      <td className="p-4 font-mono font-bold text-zinc-600 dark:text-zinc-400">
                        {p.nicotine_strength || "50MG"} • {p.volume_ml || "30ML"}
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() => toggleAvailability(p)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            p.is_available
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
                          }`}
                        >
                          {p.is_available ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Dostępny</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Brak</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() => toggleIsNew(p)}
                          className={`p-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                            p.is_new
                              ? "bg-amber-400 border-amber-500 text-zinc-950 shadow-sm"
                              : "border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-amber-500"
                          }`}
                          title={p.is_new ? "Oznaczony jako nowość" : "Oznacz jako nowość"}
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>
                      </td>

                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              const g = p.gradient_colors || [];
                              setUseGradient(g.length >= 2);
                              setGradientColor1(g[0] || "#8b5cf6");
                              setGradientColor2(g[1] || "#ec4899");

                              setForm({
                                name: p.name,
                                brand_id: p.brand_id,
                                image_url: p.image_url || "",
                                emoji: p.emoji || "",
                                gradient_colors: p.gradient_colors || [],
                                nicotine_strength: p.nicotine_strength || "50MG",
                                volume_ml: p.volume_ml || "30ML",
                                is_available: p.is_available,
                                is_new: !!p.is_new,
                                price: p.price || 19.99,
                              });
                              setShowModal(true);
                            }}
                            className="p-2 rounded-xl text-zinc-400 hover:text-purple-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Edytuj produkt"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Usuń produkt"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal dodawania / edycji pojedynczego liquidu */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
            <h3 className="text-lg font-black text-zinc-900 dark:text-white">
              {editingProduct ? "Edytuj liquid" : "Dodaj nowy liquid"}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Marka
                </label>
                <select
                  value={form.brand_id}
                  onChange={(e) => setForm({ ...form, brand_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-bold"
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Smak / Nazwa
                </label>
                <input
                  type="text"
                  required
                  placeholder="np. Strawberry Kiwi"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-bold"
                />
              </div>

              {/* Opcjonalne emotki */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Emotka (opcjonalnie - obok MG i ML)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="np. 🍓, 🍉, ❄️"
                    value={form.emoji}
                    onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                    className="w-24 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-base text-center"
                  />
                  <div className="flex-1 flex flex-wrap gap-1">
                    {QUICK_EMOJIS.slice(0, 8).map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setForm({ ...form, emoji: em })}
                        className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm cursor-pointer"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Opcjonalny Gradient Tła Kafelka */}
              <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    <input
                      type="checkbox"
                      checked={useGradient}
                      onChange={(e) => setUseGradient(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span className="flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-purple-600" />
                      <span>Kolorowy Gradient Tła</span>
                    </span>
                  </label>

                  {useGradient && (
                    <div
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${gradientColor1}, ${gradientColor2})`,
                      }}
                      className="w-12 h-5 rounded-md shadow-sm border border-white/20"
                    />
                  )}
                </div>

                {useGradient && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-zinc-400 block mb-1">
                          Kolor 1
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={gradientColor1}
                            onChange={(e) => setGradientColor1(e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                          />
                          <input
                            type="text"
                            value={gradientColor1}
                            onChange={(e) => setGradientColor1(e.target.value)}
                            className="w-full px-2 py-1 text-xs font-mono rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                          />
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-zinc-400 block mb-1">
                          Kolor 2
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={gradientColor2}
                            onChange={(e) => setGradientColor2(e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                          />
                          <input
                            type="text"
                            value={gradientColor2}
                            onChange={(e) => setGradientColor2(e.target.value)}
                            className="w-full px-2 py-1 text-xs font-mono rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {PRESET_GRADIENTS.slice(1).map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setGradientColor1(preset.colors[0]);
                            setGradientColor2(preset.colors[1]);
                          }}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-purple-500 cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* URL Zdjęcia */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Zdjęcie produktu (URL)
                </label>
                <input
                  type="url"
                  placeholder="https://domena.pl/zdjecie.png (opcjonalnie)"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono"
                />
                {form.image_url && (
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-zinc-400">
                    <img
                      src={form.image_url}
                      alt="Podgląd"
                      className="w-8 h-8 rounded-lg object-contain bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-0.5"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <span>Podgląd zdjęcia</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Moc (MG)
                  </label>
                  <input
                    type="text"
                    value={form.nicotine_strength}
                    onChange={(e) => setForm({ ...form, nicotine_strength: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Pojemność
                  </label>
                  <input
                    type="text"
                    value={form.volume_ml}
                    onChange={(e) => setForm({ ...form, volume_ml: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={form.is_available}
                    onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <span>Dostępny w magazynie</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-600 dark:text-amber-400">
                  <input
                    type="checkbox"
                    checked={form.is_new}
                    onChange={(e) => setForm({ ...form, is_new: e.target.checked })}
                    className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4"
                  />
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Nowość (NEW)</span>
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer"
                >
                  Zapisz liquid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal edycji daty aktualizacji listy */}
      {showDateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-zinc-900 dark:text-white">
              Data aktualizacji listy liquidów
            </h3>
            <p className="text-xs text-zinc-400">
              Ten tekst i data będą widoczne na stronie głównej pod markami.
            </p>

            <form onSubmit={handleSaveUpdatedDate} className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  placeholder="np. 03.09.2026 21:00"
                  value={newDateInput}
                  onChange={(e) => setNewDateInput(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono font-bold"
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={setDateToNow}
                  className="text-xs font-bold text-purple-600 hover:underline cursor-pointer"
                >
                  Ustaw na teraz
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowDateModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer"
                >
                  Zapisz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
