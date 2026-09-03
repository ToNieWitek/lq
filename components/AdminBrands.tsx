"use client";
import React, { useState } from "react";
import { Brand } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, Edit2 } from "lucide-react";

interface Props {
  brands: Brand[];
  setBrands: React.Dispatch<React.SetStateAction<Brand[]>>;
}

export default function AdminBrands({ brands, setBrands }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [form, setForm] = useState({
    id: "",
    name: "",
    image_url: "",
  });

  const handleOpenModal = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand);
      setForm({
        id: brand.id,
        name: brand.name,
        image_url: brand.image_url || "",
      });
    } else {
      setEditingBrand(null);
      setForm({
        id: "",
        name: "",
        image_url: "",
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const brandId = editingBrand
      ? editingBrand.id
      : form.id.trim()
      ? form.id.trim().toLowerCase().replace(/\s+/g, "-")
      : form.name.trim().toLowerCase().replace(/\s+/g, "-");

    const newBrandData: Brand = {
      id: brandId,
      name: form.name.trim(),
      image_url: form.image_url.trim(),
    };

    let updated: Brand[];
    if (editingBrand) {
      updated = brands.map((b) => (b.id === editingBrand.id ? newBrandData : b));
    } else {
      if (brands.some((b) => b.id === brandId)) {
        alert("Marka o takim identyfikatorze już istnieje! Wybierz inną nazwę lub ID.");
        return;
      }
      updated = [...brands, newBrandData];
    }

    setBrands(updated);
    localStorage.setItem("demo_brands", JSON.stringify(updated));

    try {
      const supabase = createClient();
      if (editingBrand) {
        await supabase
          .from("brands")
          .update({ name: newBrandData.name, image_url: newBrandData.image_url })
          .eq("id", newBrandData.id);
      } else {
        await supabase.from("brands").insert([newBrandData]);
      }
    } catch (err) {
      console.error(err);
    }

    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    const updated = brands.filter((b) => b.id !== id);
    setBrands(updated);
    localStorage.setItem("demo_brands", JSON.stringify(updated));

    try {
      const supabase = createClient();
      await supabase.from("brands").delete().eq("id", id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-zinc-900 dark:text-white">
            Zarządzanie Markami Liquidów
          </h3>
          <p className="text-xs text-zinc-500">
            Kafelki marek wyświetlane na stronie głównej. Dodawaj nowe firmy, edytuj nazwy i wklejaj linki do zdjęć.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Dodaj nową markę</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {brands.map((b) => (
          <div
            key={b.id}
            className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-full aspect-video rounded-2xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800 overflow-hidden flex items-center justify-center relative">
                {b.image_url ? (
                  <img src={b.image_url} alt={b.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-zinc-400">Brak zdjęcia</span>
                )}
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-600 dark:text-purple-400 font-bold">
                  ID: {b.id}
                </span>
                <h4 className="text-lg font-black text-zinc-900 dark:text-white">
                  {b.name}
                </h4>
                {b.image_url && (
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                    {b.image_url}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => handleOpenModal(b)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edytuj</span>
              </button>
              <button
                onClick={() => handleDelete(b.id)}
                className="p-2 rounded-xl text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <h3 className="text-lg font-black text-zinc-900 dark:text-white">
              {editingBrand ? `Edytuj markę "${editingBrand.name}"` : "Dodaj nową markę"}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nazwa marki
                </label>
                <input
                  type="text"
                  required
                  placeholder="np. Elfliq, Vozol, Puffy, Oxva"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-bold"
                />
              </div>

              {!editingBrand && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Identyfikator URL (opcjonalnie, np. vozol)
                  </label>
                  <input
                    type="text"
                    placeholder="pozostaw puste, aby wygenerować automatycznie"
                    value={form.id}
                    onChange={(e) => setForm({ ...form, id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  URL zdjęcia marki (link do grafiki)
                </label>
                <input
                  type="url"
                  placeholder="https://... (np. link do zdjęcia butelki lub logo)"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                />
              </div>

              {form.image_url && (
                <div>
                  <span className="text-[10px] text-zinc-400 block mb-1">Podgląd zdjęcia:</span>
                  <div className="w-full h-28 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                    <img
                      src={form.image_url}
                      alt="Podgląd"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                </div>
              )}

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
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer shadow-md"
                >
                  {editingBrand ? "Zapisz zmiany" : "Utwórz markę"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
