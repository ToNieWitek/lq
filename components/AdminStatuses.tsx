"use client";
import React, { useState } from "react";
import { StatusDefinition } from "@/types";
import {
  AVAILABLE_ICONS,
  AVAILABLE_COLORS,
  renderStatusIcon,
  getStatusColorClass,
} from "@/components/StatusIconHelper";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { upsertStatusDB, deleteStatusDB } from "@/lib/supabase/syncService";

interface Props {
  statuses: StatusDefinition[];
  setStatuses: React.Dispatch<React.SetStateAction<StatusDefinition[]>>;
}

export default function AdminStatuses({ statuses, setStatuses }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editingStatus, setEditingStatus] = useState<StatusDefinition | null>(null);
  const [form, setForm] = useState({
    name: "",
    color: "amber",
    icon: "Clock",
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (editingStatus) {
      const updatedDef = {
        ...editingStatus,
        name: form.name.trim(),
        color: form.color,
        icon: form.icon,
      };
      const updated = statuses.map((s) => (s.id === editingStatus.id ? updatedDef : s));
      setStatuses(updated);
      localStorage.setItem("custom_status_definitions", JSON.stringify(updated));
      upsertStatusDB(updatedDef);
    } else {
      const newDef: StatusDefinition = {
        id: "def-" + Date.now(),
        name: form.name.trim(),
        color: form.color,
        icon: form.icon,
      };
      const updated = [...statuses, newDef];
      setStatuses(updated);
      localStorage.setItem("custom_status_definitions", JSON.stringify(updated));
      upsertStatusDB(newDef);
    }

    setShowModal(false);
    setEditingStatus(null);
    setForm({ name: "", color: "amber", icon: "Clock" });
  };

  const handleDelete = (id: string) => {
    const updated = statuses.filter((s) => s.id !== id);
    setStatuses(updated);
    localStorage.setItem("custom_status_definitions", JSON.stringify(updated));
    deleteStatusDB(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-zinc-900 dark:text-white">
            Własne Statusy Zamówień
          </h3>
          <p className="text-xs text-zinc-500">
            Definiuj nowe etapy zamówienia z własną nazwą, kolorem i ikonką.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingStatus(null);
            setForm({ name: "", color: "amber", icon: "Clock" });
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Dodaj nowy status</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statuses.map((s) => {
          const colorClass = getStatusColorClass(s.color);

          return (
            <div
              key={s.id}
              className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between gap-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass.badge}`}
                >
                  {renderStatusIcon(s.icon, "w-5 h-5")}
                </div>
                <div>
                  <h4 className="font-black text-sm text-zinc-900 dark:text-white">
                    {s.name}
                  </h4>
                  <span className="text-[11px] text-zinc-400 capitalize">
                    Kolor: {colorClass.label}
                  </span>
                </div>
              </div>

              <div className="inline-flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditingStatus(s);
                    setForm({ name: s.name, color: s.color, icon: s.icon });
                    setShowModal(true);
                  }}
                  className="p-2 rounded-xl text-zinc-400 hover:text-purple-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Edytuj status"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Usuń status"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <h3 className="text-lg font-black text-zinc-900 dark:text-white">
              {editingStatus ? "Edytuj status zamówienia" : "Nowy status zamówienia"}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nazwa statusu
                </label>
                <input
                  type="text"
                  required
                  placeholder="np. Przekazano do kuriera, Oczekuje na odbiór"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Wybierz Kolor
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setForm({ ...form, color: c.id })}
                      className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                        form.color === c.id
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-950/40"
                          : "border-zinc-200 dark:border-zinc-800"
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${c.bg}`} />
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Wybierz Ikonkę
                </label>
                <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto p-1">
                  {AVAILABLE_ICONS.map((i) => {
                    const IconComp = i.icon;
                    return (
                      <button
                        key={i.id}
                        type="button"
                        onClick={() => setForm({ ...form, icon: i.id })}
                        className={`p-2 rounded-xl border text-xs flex flex-col items-center gap-1 cursor-pointer transition-all ${
                          form.icon === i.id
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-600"
                            : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                        <span className="text-[10px] truncate w-full text-center">{i.label}</span>
                      </button>
                    );
                  })}
                </div>
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
                  {editingStatus ? "Zapisz zmiany" : "Zapisz status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
