"use client";
import React, { useState, useMemo } from "react";
import { Order, OrderItem, Profile, StatusDefinition, OrderStatusHistoryItem } from "@/types";
import { renderStatusIcon, getStatusColorClass } from "@/components/StatusIconHelper";
import { upsertOrderDB, deleteOrderDB, deleteBulkOrdersDB } from "@/lib/supabase/syncService";
import {
  Plus,
  Trash2,
  Edit2,
  Search,
  ArrowUpDown,
  CheckSquare,
  Square,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Package,
} from "lucide-react";

interface Props {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  customers: Profile[];
  statuses: StatusDefinition[];
}

export default function AdminOrders({ orders, setOrders, customers, statuses }: Props) {
  // Modal nowego zamówienia
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState<{
    customer_id: string;
    product_name: string;
    quantity: number;
    brand: string;
    nicotine_strength: string;
    volume_ml: string;
    revenue: number;
    initial_status: string;
    notes: string;
  }>({
    customer_id: "",
    product_name: "",
    quantity: 1,
    brand: "Elfliq",
    nicotine_strength: "50MG",
    volume_ml: "30ML",
    revenue: 0,
    initial_status: statuses[0]?.name || "Przyjęte",
    notes: "",
  });

  // Modal dodawania statusu do pojedynczego lub wielu zamówień
  const [activeOrderForStatus, setActiveOrderForStatus] = useState<Order | null>(null);
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [statusStepForm, setStatusStepForm] = useState({
    status_name: statuses[0]?.name || "W realizacji",
    comment: "",
  });

  // Modal edycji przychodu (pojedynczego lub masowego)
  const [editingRevenueOrder, setEditingRevenueOrder] = useState<Order | null>(null);
  const [showBulkRevenueModal, setShowBulkRevenueModal] = useState(false);
  const [revenueInput, setRevenueInput] = useState<number>(0);

  // Wyszukiwarka, filtr statusu i sortowanie
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "number" | "revenue_desc" | "revenue_asc">("newest");

  // Masowe zaznaczanie
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Rozwijanie szczegółów wiersza
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Zapis nowego zamówienia
  const handleSaveNewOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find((c) => c.id === newOrderForm.customer_id);
    const selectedDef = statuses.find((s) => s.name === newOrderForm.initial_status) || statuses[0];

    const initialHistory: OrderStatusHistoryItem = {
      id: "st-" + Date.now(),
      name: selectedDef?.name || "Przyjęte",
      color: selectedDef?.color || "blue",
      icon: selectedDef?.icon || "Package",
      date: new Date().toLocaleString("pl-PL"),
      comment: "Zamówienie zostało utworzone.",
    };

    const newOrder: Order = {
      id: "ord-" + Date.now(),
      order_number: "LQ-" + Math.floor(1000 + Math.random() * 9000),
      customer_id: newOrderForm.customer_id,
      customer_name: customer?.display_name || customer?.email || "Klient",
      customer_email: customer?.email,
      status: selectedDef?.name || "Przyjęte",
      status_history: [initialHistory],
      revenue: Number(newOrderForm.revenue) || 0,
      items: [
        {
          product_name: newOrderForm.product_name,
          quantity: Number(newOrderForm.quantity) || 1,
          brand: newOrderForm.brand,
          nicotine_strength: newOrderForm.nicotine_strength,
          volume_ml: newOrderForm.volume_ml,
        },
      ],
      notes: newOrderForm.notes,
      created_at: new Date().toISOString(),
    };

    const updated = [newOrder, ...orders];
    setOrders(updated);
    localStorage.setItem("demo_orders", JSON.stringify(updated));
    upsertOrderDB(newOrder);

    setShowNewOrderModal(false);
    setNewOrderForm({
      customer_id: "",
      product_name: "",
      quantity: 1,
      brand: "Elfliq",
      nicotine_strength: "50MG",
      volume_ml: "30ML",
      revenue: 0,
      initial_status: statuses[0]?.name || "Przyjęte",
      notes: "",
    });
  };

  // Dodanie etapu do POJEDYNCZEGO zamówienia
  const handleAppendStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrderForStatus) return;

    const selectedDef = statuses.find((s) => s.name === statusStepForm.status_name) || {
      name: statusStepForm.status_name,
      color: "emerald",
      icon: "CheckCircle",
    };

    const newStep: OrderStatusHistoryItem = {
      id: "st-" + Date.now(),
      name: selectedDef.name,
      color: selectedDef.color,
      icon: selectedDef.icon,
      date: new Date().toLocaleString("pl-PL"),
      comment: statusStepForm.comment.trim(),
    };

    let modifiedOrder: Order | null = null;
    const updatedOrders = orders.map((o) => {
      if (o.id === activeOrderForStatus.id) {
        const history = o.status_history || [];
        modifiedOrder = {
          ...o,
          status: selectedDef.name,
          status_history: [...history, newStep],
        };
        return modifiedOrder;
      }
      return o;
    });

    setOrders(updatedOrders);
    localStorage.setItem("demo_orders", JSON.stringify(updatedOrders));
    if (modifiedOrder) upsertOrderDB(modifiedOrder);
    setActiveOrderForStatus(null);
    setStatusStepForm({ status_name: statuses[0]?.name || "W realizacji", comment: "" });
  };

  // Dodanie etapu do WIELU ZAZNACZONYCH zamówień jednocześnie
  const handleBulkAppendStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;

    const selectedDef = statuses.find((s) => s.name === statusStepForm.status_name) || {
      name: statusStepForm.status_name,
      color: "emerald",
      icon: "CheckCircle",
    };

    const nowStr = new Date().toLocaleString("pl-PL");

    const updatedOrders = orders.map((o) => {
      if (selectedIds.includes(o.id)) {
        const history = o.status_history || [];
        const newStep: OrderStatusHistoryItem = {
          id: "st-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
          name: selectedDef.name,
          color: selectedDef.color,
          icon: selectedDef.icon,
          date: nowStr,
          comment: statusStepForm.comment.trim(),
        };
        const updated = {
          ...o,
          status: selectedDef.name,
          status_history: [...history, newStep],
        };
        upsertOrderDB(updated);
        return updated;
      }
      return o;
    });

    setOrders(updatedOrders);
    localStorage.setItem("demo_orders", JSON.stringify(updatedOrders));
    setShowBulkStatusModal(false);
    setStatusStepForm({ status_name: statuses[0]?.name || "W realizacji", comment: "" });
  };

  // Usunięcie pojedynczego etapu ze statusów zamówienia
  const handleDeleteStatusStep = (orderId: string, stepId: string) => {
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        const newHistory = (o.status_history || []).filter((h) => h.id !== stepId);
        const lastStep = newHistory[newHistory.length - 1];
        const res = {
          ...o,
          status: lastStep ? lastStep.name : o.status,
          status_history: newHistory,
        };
        upsertOrderDB(res);
        return res;
      }
      return o;
    });
    setOrders(updated);
    localStorage.setItem("demo_orders", JSON.stringify(updated));
  };

  // Zapis przychodu dla pojedynczego zamówienia
  const handleSaveRevenue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRevenueOrder) return;
    const rev = Number(revenueInput) || 0;
    const updated = orders.map((o) => {
      if (o.id === editingRevenueOrder.id) {
        const res = { ...o, revenue: rev };
        upsertOrderDB(res);
        return res;
      }
      return o;
    });
    setOrders(updated);
    localStorage.setItem("demo_orders", JSON.stringify(updated));
    setEditingRevenueOrder(null);
  };

  // Zapis przychodu dla zaznaczonych zamówień
  const handleBulkSaveRevenue = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;
    const rev = Number(revenueInput) || 0;
    const updated = orders.map((o) => {
      if (selectedIds.includes(o.id)) {
        const res = { ...o, revenue: rev };
        upsertOrderDB(res);
        return res;
      }
      return o;
    });
    setOrders(updated);
    localStorage.setItem("demo_orders", JSON.stringify(updated));
    setShowBulkRevenueModal(false);
  };

  // Usunięcie pojedynczego zamówienia
  const handleDeleteOrder = (orderId: string) => {
    const updated = orders.filter((o) => o.id !== orderId);
    setOrders(updated);
    setSelectedIds((prev) => prev.filter((id) => id !== orderId));
    localStorage.setItem("demo_orders", JSON.stringify(updated));
    deleteOrderDB(orderId);
  };

  // Usunięcie zaznaczonych zamówień
  const handleBulkDeleteOrders = () => {
    if (selectedIds.length === 0) return;
    const updated = orders.filter((o) => !selectedIds.includes(o.id));
    deleteBulkOrdersDB(selectedIds);
    setOrders(updated);
    setSelectedIds([]);
    localStorage.setItem("demo_orders", JSON.stringify(updated));
  };

  // Zaznaczanie
  const handleSelectAll = () => {
    if (selectedIds.length === filteredOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map((o) => o.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Filtrowanie i sortowanie zamówień
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        const matchesSearch =
          o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (o.customer_name && o.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (o.customer_email && o.customer_email.toLowerCase().includes(searchQuery.toLowerCase())) ||
          o.items?.some((i) => i.product_name.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = filterStatus === "all" || o.status === filterStatus;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        if (sortBy === "number") {
          return a.order_number.localeCompare(b.order_number);
        }
        if (sortBy === "revenue_desc") {
          return (b.revenue ?? 0) - (a.revenue ?? 0);
        }
        if (sortBy === "revenue_asc") {
          return (a.revenue ?? 0) - (b.revenue ?? 0);
        }
        return 0;
      });
  }, [orders, searchQuery, filterStatus, sortBy]);

  return (
    <div className="space-y-6">
      {/* Nagłówek sekcji */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-zinc-900 dark:text-white">
            Zarządzanie Zamówieniami (Lista)
          </h3>
          <p className="text-xs text-zinc-500">
            Zaznaczaj zamówienia, przypisuj statusy masowo, edytuj przychód oraz etapy InPost.
          </p>
        </div>

        <button
          onClick={() => setShowNewOrderModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Dodaj nowe zamówienie</span>
        </button>
      </div>

      {/* Pasek wyszukiwarki, filtrów i sortowania */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Szukaj po nr zamówienia, kliencie, smaku..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtr Statusu */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-semibold"
          >
            <option value="all">Wszystkie statusy</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Sortowanie */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-semibold focus:outline-none"
            >
              <option value="newest">Najnowsze</option>
              <option value="oldest">Najstarsze</option>
              <option value="number">Numer zamówienia</option>
              <option value="revenue_desc">Przychód (najwyższy)</option>
              <option value="revenue_asc">Przychód (najniższy)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pasek akcji masowych dla zaznaczonych zamówień */}
      {selectedIds.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-purple-700 dark:text-purple-300">
            <CheckSquare className="w-4 h-4" />
            <span>Zaznaczono {selectedIds.length} z {filteredOrders.length} zamówień</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setStatusStepForm({
                  status_name: statuses[0]?.name || "W realizacji",
                  comment: "",
                });
                setShowBulkStatusModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Dodaj ten sam status do zaznaczonych</span>
            </button>

            <button
              onClick={() => {
                setRevenueInput(0);
                setShowBulkRevenueModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-sm"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Ustaw przychód dla zaznaczonych</span>
            </button>

            <button
              onClick={handleBulkDeleteOrders}
              className="px-3 py-1.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Usuń zaznaczone</span>
            </button>
          </div>
        </div>
      )}

      {/* Tabela / Lista zamówień */}
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
                    {selectedIds.length > 0 && selectedIds.length === filteredOrders.length ? (
                      <CheckSquare className="w-4 h-4 text-purple-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-4">Numer & Data</th>
                <th className="p-4">Kupujący</th>
                <th className="p-4">Status & Etapy</th>
                <th className="p-4">Przychód (widziany przez klienta)</th>
                <th className="p-4">Zawartość</th>
                <th className="p-4 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-zinc-400">
                    Brak zamówień spełniających wybrane kryteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const isSelected = selectedIds.includes(o.id);
                  const isExpanded = expandedRowId === o.id;
                  const revenueVal = o.revenue ?? 0;

                  return (
                    <React.Fragment key={o.id}>
                      <tr
                        className={`hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors ${
                          isSelected ? "bg-purple-50/60 dark:bg-purple-950/20" : ""
                        }`}
                      >
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleToggleSelect(o.id)}
                            className="cursor-pointer text-zinc-400 hover:text-purple-600"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-purple-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Numer i data */}
                        <td className="p-4 font-mono">
                          <div className="font-black text-sm text-zinc-900 dark:text-zinc-100">
                            #{o.order_number}
                          </div>
                          <div className="text-[11px] text-zinc-400">
                            {new Date(o.created_at).toLocaleDateString("pl-PL")}
                          </div>
                        </td>

                        {/* Kupujący */}
                        <td className="p-4">
                          <div className="font-bold text-zinc-900 dark:text-zinc-100">
                            {o.customer_name || "Kupujący"}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono">
                            {o.customer_email}
                          </div>
                        </td>

                        {/* Status & etapy InPost */}
                        <td className="p-4">
                          <div className="space-y-1.5">
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                              {o.status}
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {o.status_history?.map((h, i) => (
                                <div
                                  key={h.id || i}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px] font-medium"
                                >
                                  <span className="text-zinc-400 text-[10px]">#{i + 1}</span>
                                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                    {h.name}
                                  </span>
                                  <button
                                    onClick={() => handleDeleteStatusStep(o.id, h.id)}
                                    className="text-zinc-400 hover:text-rose-500 ml-0.5 font-bold cursor-pointer"
                                    title="Usuń ten krok z historii"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>

                        {/* Przychód */}
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-xl border border-teal-500/20">
                              {revenueVal.toFixed(2)} zł
                            </span>
                            <button
                              onClick={() => {
                                setEditingRevenueOrder(o);
                                setRevenueInput(revenueVal);
                              }}
                              className="p-1 rounded-lg text-zinc-400 hover:text-teal-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                              title="Edytuj przychód"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Zawartość / rozwiń */}
                        <td className="p-4">
                          <button
                            onClick={() => setExpandedRowId(isExpanded ? null : o.id)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-purple-600 cursor-pointer"
                          >
                            <Package className="w-3.5 h-3.5" />
                            <span>{o.items?.length || 0} pozycji</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>

                        {/* Akcje */}
                        <td className="p-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setActiveOrderForStatus(o);
                                setStatusStepForm({
                                  status_name: statuses[0]?.name || "W realizacji",
                                  comment: "",
                                });
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-purple-600 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                              title="Dodaj kolejny status"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Status</span>
                            </button>

                            <button
                              onClick={() => handleDeleteOrder(o.id)}
                              className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                              title="Usuń zamówienie"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Rozwinięcie szczegółów wiersza (produkty, notatka) */}
                      {isExpanded && (
                        <tr className="bg-zinc-50/50 dark:bg-zinc-950/40">
                          <td colSpan={7} className="p-4 pl-14">
                            <div className="space-y-3">
                              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                                Produkty w zamówieniu #{o.order_number}:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {o.items?.map((it, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between text-xs"
                                  >
                                    <div>
                                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                        {it.product_name}
                                      </span>
                                      <div className="text-[10px] text-zinc-400">
                                        Marka: <b>{it.brand || "LQ"}</b> • {it.nicotine_strength || "20MG"} • {it.volume_ml || "10ML"}
                                      </div>
                                    </div>
                                    <span className="font-mono font-bold">x{it.quantity}</span>
                                  </div>
                                ))}
                              </div>

                              {o.notes && (
                                <div className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100/80 dark:bg-zinc-800/60 p-2.5 rounded-xl">
                                  <b>Notatka:</b> {o.notes}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Dodanie pojedynczego nowego zamówienia */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <h3 className="text-lg font-black text-zinc-900 dark:text-white">
              Stwórz nowe zamówienie
            </h3>

            <form onSubmit={handleSaveNewOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Kupujący (przypisz do konta)
                </label>
                <select
                  required
                  value={newOrderForm.customer_id}
                  onChange={(e) => setNewOrderForm({ ...newOrderForm, customer_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-bold"
                >
                  <option value="">-- Wybierz kupującego --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.display_name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Marka liquidu
                  </label>
                  <select
                    value={newOrderForm.brand}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, brand: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-bold"
                  >
                    <option value="Elfliq">Elfliq</option>
                    <option value="Vozol">Vozol</option>
                    <option value="Puffy">Puffy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Ilość (sztuk)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newOrderForm.quantity}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Smak / Nazwa produktu
                </label>
                <input
                  type="text"
                  required
                  placeholder="np. Watermelon, Blue Razz Ice"
                  value={newOrderForm.product_name}
                  onChange={(e) => setNewOrderForm({ ...newOrderForm, product_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Moc (MG)
                  </label>
                  <input
                    type="text"
                    placeholder="50MG"
                    value={newOrderForm.nicotine_strength}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, nicotine_strength: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Pojemność
                  </label>
                  <input
                    type="text"
                    placeholder="30ML"
                    value={newOrderForm.volume_ml}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, volume_ml: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Przychód (zł)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={newOrderForm.revenue}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, revenue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono font-bold text-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Początkowy status
                </label>
                <select
                  value={newOrderForm.initial_status}
                  onChange={(e) => setNewOrderForm({ ...newOrderForm, initial_status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-bold"
                >
                  {statuses.map((st) => (
                    <option key={st.id} value={st.name}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Wiadomość / Notatka dla kupującego (opcjonalnie)
                </label>
                <textarea
                  rows={2}
                  placeholder="np. Odbiór w ustalonym miejscu"
                  value={newOrderForm.notes}
                  onChange={(e) => setNewOrderForm({ ...newOrderForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowNewOrderModal(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer"
                >
                  Utwórz zamówienie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Dodanie etapu do POJEDYNCZEGO zamówienia */}
      {activeOrderForStatus && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div>
              <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                #{activeOrderForStatus.order_number}
              </span>
              <h3 className="text-lg font-black text-zinc-900 dark:text-white">
                Dodaj kolejny etap / status
              </h3>
            </div>

            <form onSubmit={handleAppendStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Wybierz status
                </label>
                <select
                  value={statusStepForm.status_name}
                  onChange={(e) => setStatusStepForm({ ...statusStepForm, status_name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-bold"
                >
                  {statuses.map((st) => (
                    <option key={st.id} value={st.name}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Komentarz do tego etapu (opcjonalnie)
                </label>
                <textarea
                  rows={3}
                  placeholder="np. Paczka została przekazana do doręczenia."
                  value={statusStepForm.comment}
                  onChange={(e) => setStatusStepForm({ ...statusStepForm, comment: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setActiveOrderForStatus(null)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer"
                >
                  Dodaj etap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: MASOWE dodanie etapu do zaznaczonych zamówień */}
      {showBulkStatusModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                Dotyczy {selectedIds.length} zaznaczonych zamówień
              </span>
              <h3 className="text-lg font-black text-zinc-900 dark:text-white">
                Masowe dodanie statusu
              </h3>
            </div>

            <form onSubmit={handleBulkAppendStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Wybierz status dla wszystkich zaznaczonych
                </label>
                <select
                  value={statusStepForm.status_name}
                  onChange={(e) => setStatusStepForm({ ...statusStepForm, status_name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-bold"
                >
                  {statuses.map((st) => (
                    <option key={st.id} value={st.name}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Wspólny komentarz do etapu
                </label>
                <textarea
                  rows={3}
                  placeholder="np. Wysłano przesyłki zbiorczo."
                  value={statusStepForm.comment}
                  onChange={(e) => setStatusStepForm({ ...statusStepForm, comment: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowBulkStatusModal(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer"
                >
                  Zastosuj dla {selectedIds.length} zamówień
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Edycja przychodu pojedynczego zamówienia */}
      {editingRevenueOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div>
              <span className="text-xs font-mono font-bold text-teal-600">
                #{editingRevenueOrder.order_number}
              </span>
              <h3 className="text-base font-black text-zinc-900 dark:text-white">
                Edycja przychodu z zamówienia
              </h3>
              <p className="text-xs text-zinc-400">
                Kupujący widzi ten przychód w swoim panelu (domyślnie 0 zł).
              </p>
            </div>

            <form onSubmit={handleSaveRevenue} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Kwota przychodu (zł)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={revenueInput}
                  onChange={(e) => setRevenueInput(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm font-mono font-bold text-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingRevenueOrder(null)}
                  className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs cursor-pointer"
                >
                  Zapisz kwotę
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: MASOWA edycja przychodu dla zaznaczonych zamówień */}
      {showBulkRevenueModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div>
              <span className="text-xs font-bold text-teal-600">
                Zaznaczono {selectedIds.length} zamówień
              </span>
              <h3 className="text-base font-black text-zinc-900 dark:text-white">
                Masowe ustawienie przychodu
              </h3>
            </div>

            <form onSubmit={handleBulkSaveRevenue} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Ustaw kwotę dla każdego zaznaczonego (zł)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={revenueInput}
                  onChange={(e) => setRevenueInput(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm font-mono font-bold text-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowBulkRevenueModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs cursor-pointer"
                >
                  Ustaw kwotę
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
