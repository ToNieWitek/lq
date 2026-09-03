import { createClient } from "@/lib/supabase/client";
import { Product, Brand, Order, StatusDefinition, Profile } from "@/types";
import { INITIAL_BRANDS, INITIAL_PRODUCTS, DEFAULT_STATUS_DEFINITIONS } from "@/lib/initialData";

const supabase = createClient();

// ==========================================
// MARKI (BRANDS)
// ==========================================
export async function getBrandsDB(): Promise<Brand[]> {
  try {
    const { data, error } = await supabase.from("brands").select("*").order("name");
    if (!error && data && data.length > 0) {
      return data as Brand[];
    }
  } catch (e) {
    console.warn("getBrandsDB error:", e);
  }
  return INITIAL_BRANDS;
}

export async function upsertBrandDB(brand: Brand) {
  try {
    await supabase.from("brands").upsert(brand);
  } catch (e) {
    console.error("upsertBrandDB error:", e);
  }
}

export async function deleteBrandDB(id: string) {
  try {
    await supabase.from("brands").delete().eq("id", id);
  } catch (e) {
    console.error("deleteBrandDB error:", e);
  }
}

// ==========================================
// PRODUKTY (PRODUCTS)
// ==========================================
export async function getProductsDB(brandId?: string): Promise<Product[]> {
  try {
    let query = supabase.from("products").select("*").order("name");
    if (brandId) {
      query = query.eq("brand_id", brandId);
    }
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data as Product[];
    }
  } catch (e) {
    console.warn("getProductsDB error:", e);
  }
  return brandId ? INITIAL_PRODUCTS.filter(p => p.brand_id === brandId) : INITIAL_PRODUCTS;
}

export async function upsertProductDB(product: Product) {
  try {
    await supabase.from("products").upsert(product);
  } catch (e) {
    console.error("upsertProductDB error:", e);
  }
}

export async function deleteProductDB(id: string) {
  try {
    await supabase.from("products").delete().eq("id", id);
  } catch (e) {
    console.error("deleteProductDB error:", e);
  }
}

export async function deleteBulkProductsDB(ids: string[]) {
  try {
    await supabase.from("products").delete().in("id", ids);
  } catch (e) {
    console.error("deleteBulkProductsDB error:", e);
  }
}

// ==========================================
// ZAMÓWIENIA (ORDERS)
// ==========================================
export async function getOrdersDB(customerId?: string): Promise<Order[]> {
  try {
    let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (customerId) {
      query = query.eq("customer_id", customerId);
    }
    const { data, error } = await query;
    if (!error && data) {
      return data as Order[];
    }
  } catch (e) {
    console.warn("getOrdersDB error:", e);
  }
  return [];
}

export async function upsertOrderDB(order: Order) {
  try {
    await supabase.from("orders").upsert(order);
  } catch (e) {
    console.error("upsertOrderDB error:", e);
  }
}

export async function deleteOrderDB(id: string) {
  try {
    await supabase.from("orders").delete().eq("id", id);
  } catch (e) {
    console.error("deleteOrderDB error:", e);
  }
}

export async function deleteBulkOrdersDB(ids: string[]) {
  try {
    await supabase.from("orders").delete().in("id", ids);
  } catch (e) {
    console.error("deleteBulkOrdersDB error:", e);
  }
}

// ==========================================
// STATUSY (STATUS DEFINITIONS)
// ==========================================
export async function getStatusesDB(): Promise<StatusDefinition[]> {
  try {
    const { data, error } = await supabase.from("status_definitions").select("*");
    if (!error && data && data.length > 0) {
      return data as StatusDefinition[];
    }
  } catch (e) {
    console.warn("getStatusesDB error:", e);
  }
  return DEFAULT_STATUS_DEFINITIONS;
}

export async function upsertStatusDB(status: StatusDefinition) {
  try {
    await supabase.from("status_definitions").upsert(status);
  } catch (e) {
    console.error("upsertStatusDB error:", e);
  }
}

export async function deleteStatusDB(id: string) {
  try {
    await supabase.from("status_definitions").delete().eq("id", id);
  } catch (e) {
    console.error("deleteStatusDB error:", e);
  }
}

// ==========================================
// USTAWIENIA (SETTINGS)
// ==========================================
export async function getSettingDB(key: string, defaultValue: string): Promise<string> {
  try {
    const { data, error } = await supabase.from("settings").select("value").eq("key", key).single();
    if (!error && data && data.value) {
      return data.value;
    }
  } catch (e) {
    console.warn("getSettingDB error:", e);
  }
  return defaultValue;
}

export async function setSettingDB(key: string, value: string) {
  try {
    await supabase.from("settings").upsert({ key, value });
  } catch (e) {
    console.error("setSettingDB error:", e);
  }
}
