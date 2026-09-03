"use client";
import React from "react";
import {
  Clock,
  Package,
  Truck,
  ShoppingBag,
  CheckCircle,
  AlertTriangle,
  Flame,
  Send,
  Boxes,
  MapPin,
  Check,
} from "lucide-react";

export const AVAILABLE_ICONS = [
  { id: "Clock", label: "Zegar", icon: Clock },
  { id: "Package", label: "Paczka", icon: Package },
  { id: "Boxes", label: "Karton/Paczki", icon: Boxes },
  { id: "Truck", label: "Kurier/Dostawa", icon: Truck },
  { id: "ShoppingBag", label: "Odbiór", icon: ShoppingBag },
  { id: "MapPin", label: "Punkt/Lokalizacja", icon: MapPin },
  { id: "CheckCircle", label: "Zrealizowane", icon: CheckCircle },
  { id: "Check", label: "Fistaszek", icon: Check },
  { id: "Flame", label: "Ogień/Pilne", icon: Flame },
  { id: "Send", label: "Wysłano", icon: Send },
  { id: "AlertTriangle", label: "Problem/Anulowano", icon: AlertTriangle },
];

export const AVAILABLE_COLORS = [
  { id: "amber", label: "Żółty/Bursztynowy", bg: "bg-amber-500", text: "text-amber-500", border: "border-amber-500", badge: "bg-amber-500/10 text-amber-500 border-amber-500/30" },
  { id: "emerald", label: "Zielony", bg: "bg-emerald-500", text: "text-emerald-500", border: "border-emerald-500", badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" },
  { id: "blue", label: "Niebieski", bg: "bg-blue-500", text: "text-blue-500", border: "border-blue-500", badge: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
  { id: "purple", label: "Fioletowy", bg: "bg-purple-500", text: "text-purple-500", border: "border-purple-500", badge: "bg-purple-500/10 text-purple-500 border-purple-500/30" },
  { id: "rose", label: "Czerwony", bg: "bg-rose-500", text: "text-rose-500", border: "border-rose-500", badge: "bg-rose-500/10 text-rose-500 border-rose-500/30" },
  { id: "cyan", label: "Cyjanowy", bg: "bg-cyan-500", text: "text-cyan-500", border: "border-cyan-500", badge: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30" },
  { id: "zinc", label: "Szary", bg: "bg-zinc-500", text: "text-zinc-400", border: "border-zinc-500", badge: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30" },
];

export function renderStatusIcon(iconName?: string, className = "w-4 h-4") {
  const item = AVAILABLE_ICONS.find((i) => i.id === iconName);
  const IconComponent = item ? item.icon : Package;
  return <IconComponent className={className} />;
}

export function getStatusColorClass(colorId?: string) {
  const color = AVAILABLE_COLORS.find((c) => c.id === colorId) || AVAILABLE_COLORS[0];
  return color;
}
