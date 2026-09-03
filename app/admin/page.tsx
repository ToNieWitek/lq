"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Product, Order, Profile, StatusDefinition, Brand } from "@/types";
import { INITIAL_PRODUCTS, INITIAL_BRANDS } from "@/lib/initialData";
import { createClient } from "@/lib/supabase/client";
import AdminProducts from "@/components/AdminProducts";
import AdminBrands from "@/components/AdminBrands";
import AdminOrders from "@/components/AdminOrders";
import AdminCustomers from "@/components/AdminCustomers";
import AdminStatuses from "@/components/AdminStatuses";
import Link from "next/link";
import { Layers, ShoppingBag, Users, Sliders, RefreshCw, Home, Tag } from "lucide-react";

const DEFAULT_STATUS_DEFINITIONS: StatusDefinition[] = [
  { id: "st-1", name: "Przyjęte", color: "blue", icon: "Package" },
  { id: "st-2", name: "Skompletowane", color: "purple", icon: "Boxes" },
  { id: "st-3", name: "W doręczeniu", color: "amber", icon: "Truck" },
  { id: "st-4", name: "Do odbioru", color: "cyan", icon: "ShoppingBag" },
  { id: "st-5", name: "Zrealizowane", color: "emerald", icon: "CheckCircle" },
  { id: "st-6", name: "Anulowane", color: "rose", icon: "AlertTriangle" },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, profile, isAdmin, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"products" | "brands" | "orders" | "statuses" | "customers">("products");

  const [brands, setBrands] = useState<Brand[]>(INITIAL_BRANDS);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [statuses, setStatuses] = useState<StatusDefinition[]>(DEFAULT_STATUS_DEFINITIONS);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user || (!isAdmin && profile?.role !== "admin")) {
        router.push("/login");
      }
    }
  }, [user, isAdmin, profile, authLoading, router]);

  const loadAllData = async () => {
    setLoadingData(true);
    const supabase = createClient();

    // 1. Brands
    try {
      const { data: bData } = await supabase.from("brands").select("*").order("name");
      if (bData && bData.length > 0) {
        setBrands(bData as Brand[]);
      } else {
        const localBrands = localStorage.getItem("demo_brands");
        setBrands(localBrands ? JSON.parse(localBrands) : INITIAL_BRANDS);
      }
    } catch {
      const localBrands = localStorage.getItem("demo_brands");
      setBrands(localBrands ? JSON.parse(localBrands) : INITIAL_BRANDS);
    }

    // 2. Status definitions
    const localDefs = localStorage.getItem("custom_status_definitions");
    if (localDefs) {
      try {
        setStatuses(JSON.parse(localDefs));
      } catch {
        setStatuses(DEFAULT_STATUS_DEFINITIONS);
      }
    } else {
      setStatuses(DEFAULT_STATUS_DEFINITIONS);
      localStorage.setItem("custom_status_definitions", JSON.stringify(DEFAULT_STATUS_DEFINITIONS));
    }

    // 3. Products
    try {
      const { data: prods, error } = await supabase.from("products").select("*").order("name");
      if (!error && prods) {
        setProducts(prods as Product[]);
      } else {
        const localProds = localStorage.getItem("demo_products");
        setProducts(localProds ? JSON.parse(localProds) : []);
      }
    } catch {
      const localProds = localStorage.getItem("demo_products");
      setProducts(localProds ? JSON.parse(localProds) : []);
    }

    // 4. Orders
    try {
      const { data: ords } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (ords && ords.length > 0) {
        setOrders(ords as Order[]);
      } else {
        const localOrds = localStorage.getItem("demo_orders");
        setOrders(localOrds ? JSON.parse(localOrds) : []);
      }
    } catch {
      const localOrds = localStorage.getItem("demo_orders");
      setOrders(localOrds ? JSON.parse(localOrds) : []);
    }

    // 5. Customers
    try {
      const { data: custs } = await supabase.from("profiles").select("*").eq("role", "customer");
      if (custs && custs.length > 0) {
        setCustomers(custs as Profile[]);
      } else {
        const localCusts = localStorage.getItem("demo_customers");
        setCustomers(
          localCusts
            ? JSON.parse(localCusts)
            : [
                {
                  id: "demo-cust-1",
                  email: "klient1@poczta.pl",
                  display_name: "Michał VIP",
                  role: "customer",
                  notes: "Stały odbiór osobisty",
                  created_at: new Date().toISOString(),
                },
              ]
        );
      }
    } catch {
      const localCusts = localStorage.getItem("demo_customers");
      setCustomers(localCusts ? JSON.parse(localCusts) : []);
    }

    setLoadingData(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  if (authLoading) {
    return <div className="py-20 text-center text-xs text-zinc-500">Autoryzacja...</div>;
  }

  return (
    <div className="space-y-8 px-4 pb-16 pt-12 sm:pt-20 sm:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-purple-500 font-bold">
            Strefa Zarządzania
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
            Panel Administratora
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAllData}
            title="Odśwież dane"
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:text-purple-500 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loadingData ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 5 Zakładek w Panelu Admina */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("products")}
          className={`flex items-center gap-2 pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "products"
              ? "border-purple-500 text-purple-600 dark:text-purple-400"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Produkty ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("brands")}
          className={`flex items-center gap-2 pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "brands"
              ? "border-purple-500 text-purple-600 dark:text-purple-400"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Marki ({brands.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "orders"
              ? "border-purple-500 text-purple-600 dark:text-purple-400"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Zamówienia ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("statuses")}
          className={`flex items-center gap-2 pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "statuses"
              ? "border-purple-500 text-purple-600 dark:text-purple-400"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Statusy & Kolory ({statuses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("customers")}
          className={`flex items-center gap-2 pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "customers"
              ? "border-purple-500 text-purple-600 dark:text-purple-400"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Konta Kupujących ({customers.length})</span>
        </button>
      </div>

      {activeTab === "products" && (
        <AdminProducts products={products} setProducts={setProducts} brands={brands} />
      )}

      {activeTab === "brands" && (
        <AdminBrands brands={brands} setBrands={setBrands} />
      )}

      {activeTab === "orders" && (
        <AdminOrders orders={orders} setOrders={setOrders} customers={customers} statuses={statuses} />
      )}

      {activeTab === "statuses" && (
        <AdminStatuses statuses={statuses} setStatuses={setStatuses} />
      )}

      {activeTab === "customers" && (
        <AdminCustomers customers={customers} setCustomers={setCustomers} orders={orders} />
      )}
    </div>
  );
}
