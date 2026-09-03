"use client";
import React, { useState } from "react";
import { Profile, Order } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, KeyRound, Sparkles } from "lucide-react";

interface Props {
  customers: Profile[];
  setCustomers: React.Dispatch<React.SetStateAction<Profile[]>>;
  orders: Order[];
}

export default function AdminCustomers({ customers, setCustomers, orders }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    email: "",
    displayName: "",
    password: "",
    notes: "",
  });

  const generateRandomPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm((prev) => ({ ...prev, password: pwd }));
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const rawLogin = form.email.trim().toLowerCase();
      // Jeśli administrator podał sam login bez @ (np. "tomek"), zamień na "tomek@lq.local" dla Supabase Auth
      const formattedEmail = rawLogin.includes("@") ? rawLogin : `${rawLogin}@lq.local`;

      const payload = {
        ...form,
        email: formattedEmail,
        displayName: form.displayName || rawLogin,
      };

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Błąd podczas tworzenia kupującego");
        return;
      }
      const newCust: Profile = {
        id: data.user?.id || "demo-cust-" + Date.now(),
        email: formattedEmail,
        display_name: form.displayName || rawLogin,
        role: "customer",
        notes: form.notes,
        created_at: new Date().toISOString(),
      };
      const updated = [newCust, ...customers];
      setCustomers(updated);
      localStorage.setItem("demo_customers", JSON.stringify(updated));
      alert(`Utworzono konto kupującego!\nLogin: ${rawLogin}\nHasło: ${form.password}`);
      setShowModal(false);
      setForm({ email: "", displayName: "", password: "", notes: "" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (customerId: string) => {
    const updated = customers.filter((c) => c.id !== customerId);
    setCustomers(updated);
    localStorage.setItem("demo_customers", JSON.stringify(updated));
    try {
      const supabase = createClient();
      await supabase.from("profiles").delete().eq("id", customerId);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-xs text-zinc-500">
          Twórz i zarządzaj specjalnymi kontami dla kupujących. Wygeneruj im login oraz hasło.
        </p>
        <button
          onClick={() => {
            generateRandomPassword();
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Dodaj nowe konto kupującego</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((c) => {
          const customerOrdersCount = orders.filter((o) => o.customer_id === c.id).length;
          return (
            <div
              key={c.id}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                    {c.display_name || "Kupujący"}
                  </h3>
                  <p className="text-xs font-mono text-zinc-500">{c.email}</p>
                </div>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {c.notes && (
                <p className="text-[11px] text-zinc-400 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950">
                  {c.notes}
                </p>
              )}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                <span>Liczba zamówień:</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">
                  {customerOrdersCount}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-purple-500" />
              <span>Dodaj nowe konto kupującego</span>
            </h3>
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Login kupującego (np. marek lub marek@poczta.pl)
                </label>
                <input
                  type="text"
                  required
                  placeholder="np. marek lub klient1"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Nazwa wyświetlana</label>
                <input
                  type="text"
                  placeholder="np. Tomek Krk"
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Hasło logowania</label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] font-bold text-purple-500 hover:text-purple-400 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Wygeneruj losowe
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Notatka (opcjonalnie)</label>
                <textarea
                  rows={2}
                  placeholder="np. Odbiór w punkcie centralnym"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                >
                  Stwórz konto kupującego
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
