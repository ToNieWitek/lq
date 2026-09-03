"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Order, OrderItem } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { renderStatusIcon, getStatusColorClass } from "@/components/StatusIconHelper";
import {
  Package,
  Calendar,
  ChevronRight,
  ArrowLeft,
  User,
  Clock,
  KeyRound,
  Check,
  Home,
} from "lucide-react";

export default function CustomerPanelPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Stan zmiany hasła
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; success: boolean } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    const fetchOrders = async () => {
      if (!user) return;
      try {
        const localOrdersStr = localStorage.getItem("demo_orders");
        if (localOrdersStr) {
          const all = JSON.parse(localOrdersStr) as Order[];
          const myOrders = all.filter((o) => o.customer_id === user.id || o.customer_email === user.email);
          setOrders(myOrders);
        } else {
          const mockOrders: Order[] = [
            {
              id: "ord-1",
              order_number: "LQ-8492",
              customer_id: user.id,
              customer_name: profile?.display_name || "Kupujący",
              status: "W doręczeniu",
              created_at: new Date(Date.now() - 172800000).toISOString(),
              status_history: [
                {
                  id: "st-1",
                  name: "Zamówienie przyjęte",
                  color: "blue",
                  icon: "Package",
                  date: new Date(Date.now() - 172800000).toLocaleString("pl-PL"),
                  comment: "Zamówienie trafiło do realizacji.",
                },
                {
                  id: "st-2",
                  name: "Skompletowane i spakowane",
                  color: "purple",
                  icon: "Boxes",
                  date: new Date(Date.now() - 86400000).toLocaleString("pl-PL"),
                  comment: "Paczka zabezpieczona i przygotowana.",
                },
                {
                  id: "st-3",
                  name: "W doręczeniu",
                  color: "amber",
                  icon: "Truck",
                  date: new Date(Date.now() - 14400000).toLocaleString("pl-PL"),
                  comment: "Kurier jest w drodze do punktu odbioru.",
                },
              ],
              items: [
                { product_name: "Watermelon", quantity: 2, nicotine_strength: "20MG", volume_ml: "10ML", brand: "Elfliq" },
                { product_name: "Blueberry Sour Raspberry", quantity: 1, nicotine_strength: "20MG", volume_ml: "10ML", brand: "Elfliq" },
                { product_name: "Strawberry Kiwi", quantity: 2, nicotine_strength: "20MG", volume_ml: "10ML", brand: "Vozol" },
                { product_name: "Grape Paradise", quantity: 1, nicotine_strength: "20MG", volume_ml: "30ML", brand: "Puffy" },
              ],
              notes: "Odbiór w ustalonym punkcie po godzinie 16:00.",
            },
          ];
          setOrders(mockOrders);
          localStorage.setItem("demo_orders", JSON.stringify(mockOrders));
        }

        if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("orders")
            .select("*")
            .or(`customer_id.eq.${user.id},customer_email.eq.${user.email || ""}`)
            .order("created_at", { ascending: false });
          if (!error && data && data.length > 0) {
            setOrders(data as Order[]);
          }
        }
      } catch (err) {
        console.error("Fetch orders error", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user, authLoading, profile, router]);

  // Obsługa zmiany hasła
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ text: "Hasło musi mieć co najmniej 6 znaków.", success: false });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: "Wpisane hasła nie są identyczne.", success: false });
      return;
    }

    setPasswordLoading(true);

    try {
      // 1. Zmiana w Supabase (jeśli podpięty)
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
      }

      // 2. Aktualizacja w pamięci lokalnej (dla kont demo)
      localStorage.setItem("customer_custom_password", newPassword);

      setPasswordMsg({ text: "Twoje hasło zostało pomyślnie zmienione!", success: true });
      setTimeout(() => {
        setShowPasswordModal(false);
        setNewPassword("");
        setConfirmPassword("");
        setPasswordMsg(null);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Wystąpił błąd podczas zmiany hasła.";
      setPasswordMsg({ text: msg, success: false });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-zinc-500">Wczytywanie Twoich zamówień...</p>
      </div>
    );
  }

  // =========================================================================
  // WIDOK SZCZEGÓŁÓW ZAMÓWIENIA
  // =========================================================================
  if (selectedOrder) {
    const groupedItems = selectedOrder.items.reduce<Record<string, OrderItem[]>>((acc, item) => {
      const brandKey = item.brand ? item.brand.toUpperCase() : "POZOSTAŁE";
      if (!acc[brandKey]) acc[brandKey] = [];
      acc[brandKey].push(item);
      return acc;
    }, {});

    const history = selectedOrder.status_history || [];

    return (
      <div className="max-w-3xl mx-auto space-y-8 pb-16 px-4 pt-12 sm:pt-20 sm:px-0">
        <div>
          <button
            onClick={() => setSelectedOrder(null)}
            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Wróć do listy zamówień</span>
          </button>
        </div>

        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <span className="text-[11px] uppercase font-mono font-bold tracking-wider text-teal-600 dark:text-teal-400">
                Szczegóły Zamówienia
              </span>
              <h1 className="text-3xl font-black text-zinc-900 dark:text-white mt-1">
                #{selectedOrder.order_number}
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  Utworzono: {new Date(selectedOrder.created_at).toLocaleDateString("pl-PL")}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                  Przychód z zamówienia
                </span>
                <span className="text-lg font-mono font-black text-teal-600 dark:text-teal-400">
                  {(selectedOrder.revenue ?? 0).toFixed(2)} zł
                </span>
              </div>

              <span className="px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30 inline-flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{selectedOrder.status}</span>
              </span>
            </div>
          </div>

          {/* Oś czasu statusów (InPost) */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-extrabold tracking-widest text-zinc-400">
              Historia i etapy realizacji (InPost Style)
            </h3>

            {history.length === 0 ? (
              <p className="text-xs text-zinc-500">Brak dodatkowych wpisów historii dla tego zamówienia.</p>
            ) : (
              <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
                {history.map((step, idx) => {
                  const isLatest = idx === history.length - 1;
                  const colorClass = getStatusColorClass(step.color);

                  return (
                    <div key={step.id || idx} className="relative group">
                      <div
                        className={`absolute -left-6 sm:-left-8 top-0.5 w-6 sm:w-7 h-6 sm:h-7 rounded-full flex items-center justify-center border-2 ${
                          isLatest
                            ? `${colorClass.bg} text-white ${colorClass.border} ring-4 ring-zinc-100 dark:ring-zinc-800 animate-pulse`
                            : "bg-white dark:bg-zinc-900 text-zinc-400 border-zinc-300 dark:border-zinc-700"
                        }`}
                      >
                        {renderStatusIcon(step.icon, "w-3 sm:w-3.5 h-3 sm:h-3.5")}
                      </div>

                      <div className="bg-zinc-50 dark:bg-zinc-950/60 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span
                            className={`text-sm font-bold ${
                              isLatest ? colorClass.text : "text-zinc-800 dark:text-zinc-200"
                            }`}
                          >
                            {step.name}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-400">
                            {step.date}
                          </span>
                        </div>
                        {step.comment && (
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 pt-0.5">
                            {step.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Produkty z podziałem na marki */}
          <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <h3 className="text-xs uppercase font-extrabold tracking-widest text-zinc-400">
              Produkty w zamówieniu (podział na marki)
            </h3>

            <div className="space-y-5">
              {Object.entries(groupedItems).map(([brandName, items]) => (
                <div
                  key={brandName}
                  className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950/40 p-4 space-y-3"
                >
                  <span className="text-xs font-black tracking-wider uppercase text-teal-600 dark:text-teal-400">
                    {brandName}
                  </span>

                  <div className="space-y-2">
                    {items.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/60 text-xs"
                      >
                        <div>
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">
                            {item.product_name}
                          </span>
                          <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5 mt-0.5">
                            {item.nicotine_strength && <span>{item.nicotine_strength}</span>}
                            {item.volume_ml && <span>• {item.volume_ml}</span>}
                          </div>
                        </div>

                        <span className="font-mono font-black text-sm px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                          x{item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedOrder.notes && (
            <div className="p-4 rounded-2xl bg-teal-500/5 border border-teal-500/20 text-xs space-y-1">
              <span className="font-bold text-teal-800 dark:text-teal-300 block">
                Notatka od administratora:
              </span>
              <p className="text-zinc-600 dark:text-zinc-400">{selectedOrder.notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // GŁÓWNA LISTA ZAMÓWIEŃ
  // =========================================================================
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16 px-4 pt-12 sm:pt-20 sm:px-0">
      {/* Nagłówek profilu z przyciskiem Zmiany Hasła */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-500 border border-teal-500/20 flex items-center justify-center shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-teal-500">
              Panel Kupującego
            </span>
            <h1 className="text-xl font-black text-zinc-900 dark:text-white">
              {profile?.display_name || user?.email?.split("@")[0]}
            </h1>
            <p className="text-xs font-mono text-zinc-400">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Przycisk Zmień Hasło */}
          <button
            onClick={() => {
              setPasswordMsg(null);
              setShowPasswordModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:bg-teal-500 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Zmień hasło</span>
          </button>

          <div className="text-right pl-3 border-l border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] uppercase text-zinc-400 block font-bold">Zamówienia</span>
            <span className="text-xl font-black text-zinc-900 dark:text-white">
              {orders.length}
            </span>
          </div>
        </div>
      </div>

      {/* Lista zamówień */}
      <div className="space-y-3">
        <h2 className="text-xs uppercase font-extrabold tracking-widest text-zinc-400 px-2">
          Twoje Zamówienia (kliknij, aby zobaczyć szczegóły i etapy)
        </h2>

        {orders.length === 0 ? (
          <div className="p-16 text-center rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 space-y-2">
            <Package className="w-10 h-10 text-zinc-400 mx-auto" />
            <h3 className="text-base font-bold text-zinc-700 dark:text-zinc-300">
              Brak zamówień
            </h3>
            <p className="text-xs text-zinc-500">
              Nie masz jeszcze przypisanego żadnego zamówienia.
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-teal-500/50 hover:scale-[1.01] shadow-sm flex items-center justify-between gap-4 cursor-pointer transition-all"
            >
              <div className="space-y-1">
                <span className="font-mono font-black text-base text-zinc-900 dark:text-white">
                  #{order.order_number}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(order.created_at).toLocaleDateString("pl-PL")}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] text-zinc-400 font-bold block uppercase">Przychód</span>
                  <span className="font-mono font-black text-xs text-teal-600 dark:text-teal-400">
                    {(order.revenue ?? 0).toFixed(2)} zł
                  </span>
                </div>

                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  {order.status}
                </span>
                <ChevronRight className="w-5 h-5 text-zinc-400" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL ZMIANY HASŁA */}
      {/* ========================================================================= */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white">
                  Zmień hasło logowania
                </h3>
                <p className="text-xs text-zinc-400">Wpisz nowe hasło do swojego konta</p>
              </div>
            </div>

            {passwordMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  passwordMsg.success
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400"
                }`}
              >
                {passwordMsg.success && <Check className="w-4 h-4 shrink-0" />}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nowe hasło
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 znaków"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Powtórz nowe hasło
                </label>
                <input
                  type="password"
                  required
                  placeholder="Wpisz ponownie nowe hasło"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs cursor-pointer shadow-md"
                >
                  {passwordLoading ? "Zapisywanie..." : "Zmień hasło"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
