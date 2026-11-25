"use server";

import { revalidatePath } from "next/cache";
import {
  createShippingRate,
  deleteShippingRate,
  setDefaultShippingPrice,
  setStoreOrigin,
  updateShippingRate,
  type ShippingRateInput,
} from "@/lib/db/queries";
import { geocodeAddress } from "@/lib/geocoding";

export type StoreOriginFormState = { error: string | null; success: boolean };

export async function setStoreOriginAction(
  _prevState: StoreOriginFormState,
  formData: FormData
): Promise<StoreOriginFormState> {
  const address = String(formData.get("address") ?? "").trim();
  if (!address) return { error: "Ingresá una dirección.", success: false };

  const location = await geocodeAddress(address);
  if (!location) {
    return {
      error: "No pudimos ubicar esa dirección. Probá escribirla más completa (calle, número, ciudad).",
      success: false,
    };
  }

  await setStoreOrigin(address, location.lat, location.lng);
  revalidatePath("/admin/envios");
  return { error: null, success: true };
}

export async function setDefaultShippingPriceAction(formData: FormData): Promise<void> {
  const price = Number(formData.get("price"));
  if (!Number.isFinite(price) || price < 0) return;
  await setDefaultShippingPrice(price);
  revalidatePath("/admin/envios");
}

function parseShippingRateForm(formData: FormData): ShippingRateInput | null {
  const label = String(formData.get("label") ?? "").trim();
  const days = formData.getAll("day").map(String);
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");
  const maxDistanceKm = Number(formData.get("maxDistanceKm"));
  const price = Number(formData.get("price"));
  const active = formData.get("active") === "on";

  if (!label || days.length === 0 || !startTime || !endTime) return null;
  if (!Number.isFinite(maxDistanceKm) || maxDistanceKm <= 0) return null;
  if (!Number.isFinite(price) || price < 0) return null;

  return {
    label,
    daysOfWeek: days.join(","),
    startTime,
    endTime,
    maxDistanceKm,
    price,
    active,
  };
}

export async function addShippingRateAction(formData: FormData): Promise<void> {
  const parsed = parseShippingRateForm(formData);
  if (!parsed) return;
  await createShippingRate(parsed);
  revalidatePath("/admin/envios");
}

export async function updateShippingRateAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const parsed = parseShippingRateForm(formData);
  if (!parsed) return;
  await updateShippingRate(id, parsed);
  revalidatePath("/admin/envios");
}

export async function deleteShippingRateAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteShippingRate(id);
  revalidatePath("/admin/envios");
}
