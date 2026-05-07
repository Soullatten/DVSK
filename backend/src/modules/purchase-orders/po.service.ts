import { prisma } from "../../config/database.js";
import { LiveEvents } from "../../realtime/events.js";

type POStatus = "PROCESSING" | "IN_TRANSIT" | "CUSTOMS" | "DELIVERED" | "CANCELLED";

const STATUS_PROGRESS: Record<POStatus, number> = {
  PROCESSING: 15,
  IN_TRANSIT: 45,
  CUSTOMS: 85,
  DELIVERED: 100,
  CANCELLED: 0,
};

function generatePONumber(): string {
  const stamp = Math.floor(Math.random() * 9000 + 1000);
  return `PO-${stamp}`;
}

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  return 0;
}

export async function listPurchaseOrders() {
  return prisma.purchaseOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      lineItems: {
        include: {
          variant: {
            select: {
              id: true,
              size: true,
              color: true,
              sku: true,
              stock: true,
              product: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      },
    },
  });
}

export async function getPurchaseOrderById(id: string) {
  return prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      lineItems: {
        include: {
          variant: {
            select: {
              id: true,
              size: true,
              color: true,
              sku: true,
              stock: true,
              product: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      },
    },
  });
}

export async function createPurchaseOrder(data: any) {
  let orderNumber = generatePONumber();
  while (await prisma.purchaseOrder.findUnique({ where: { orderNumber } })) {
    orderNumber = generatePONumber();
  }

  const eta = data.eta ? new Date(data.eta) : null;

  const created = await prisma.purchaseOrder.create({
    data: {
      orderNumber,
      supplier: data.supplier,
      city: data.city,
      country: data.country,
      amount: toNumber(data.amount),
      currency: data.currency || "INR",
      itemsLabel: data.itemsLabel,
      status: "PROCESSING",
      progress: STATUS_PROGRESS.PROCESSING,
      eta,
      lat: typeof data.lat === "number" ? data.lat : null,
      lng: typeof data.lng === "number" ? data.lng : null,
      notes: data.notes ?? null,
      ...(Array.isArray(data.lineItems) && data.lineItems.length > 0 && {
        lineItems: {
          create: data.lineItems.map((li: any) => ({
            variantId: li.variantId,
            quantity: li.quantity,
            ...(li.unitCost !== undefined && { unitCost: toNumber(li.unitCost) }),
          })),
        },
      }),
    },
    include: { lineItems: true },
  });

  return created;
}

export async function updatePurchaseOrderStatus(id: string, status: POStatus) {
  const existing = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { lineItems: true },
  });
  if (!existing) throw new Error("Purchase order not found");

  if (existing.status === "DELIVERED" && status !== "DELIVERED") {
    throw new Error("Delivered purchase orders cannot change status");
  }

  const isFirstDelivery = status === "DELIVERED" && existing.status !== "DELIVERED";

  const updated = await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.update({
      where: { id },
      data: {
        status,
        progress: STATUS_PROGRESS[status],
        ...(isFirstDelivery && { deliveredAt: new Date() }),
      },
      include: {
        lineItems: {
          include: {
            variant: {
              select: {
                id: true,
                size: true,
                color: true,
                sku: true,
                stock: true,
                product: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        },
      },
    });

    if (isFirstDelivery) {
      for (const li of existing.lineItems) {
        await tx.productVariant.update({
          where: { id: li.variantId },
          data: { stock: { increment: li.quantity } },
        });
      }
    }

    return po;
  });

  if (isFirstDelivery && existing.lineItems.length > 0) {
    LiveEvents.inventoryLow({
      sku: `PO-${existing.orderNumber}-DELIVERED`,
      productName: existing.itemsLabel,
      stock: existing.lineItems.reduce((sum, li) => sum + li.quantity, 0),
    });
  }

  return updated;
}

export async function updatePurchaseOrder(id: string, data: any) {
  const update: any = {};
  if (data.supplier !== undefined) update.supplier = data.supplier;
  if (data.city !== undefined) update.city = data.city;
  if (data.country !== undefined) update.country = data.country;
  if (data.amount !== undefined) update.amount = toNumber(data.amount);
  if (data.currency !== undefined) update.currency = data.currency;
  if (data.itemsLabel !== undefined) update.itemsLabel = data.itemsLabel;
  if (data.eta !== undefined) update.eta = data.eta ? new Date(data.eta) : null;
  if (data.lat !== undefined) update.lat = data.lat;
  if (data.lng !== undefined) update.lng = data.lng;
  if (data.notes !== undefined) update.notes = data.notes;
  if (data.progress !== undefined) update.progress = data.progress;
  // Shipment details — empty strings collapse to null so the admin can
  // clear a previously-set value by submitting an empty input.
  if (data.carrier !== undefined) update.carrier = data.carrier || null;
  if (data.trackingNumber !== undefined) update.trackingNumber = data.trackingNumber || null;
  if (data.dispatchedAt !== undefined) update.dispatchedAt = data.dispatchedAt ? new Date(data.dispatchedAt) : null;
  if (data.weight !== undefined) update.weight = data.weight || null;
  if (data.shipmentNotes !== undefined) update.shipmentNotes = data.shipmentNotes || null;

  if (Array.isArray(data.lineItems)) {
    return prisma.$transaction(async (tx) => {
      await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });
      return tx.purchaseOrder.update({
        where: { id },
        data: {
          ...update,
          lineItems: {
            create: data.lineItems.map((li: any) => ({
              variantId: li.variantId,
              quantity: li.quantity,
              ...(li.unitCost !== undefined && { unitCost: toNumber(li.unitCost) }),
            })),
          },
        },
        include: { lineItems: true },
      });
    });
  }

  return prisma.purchaseOrder.update({
    where: { id },
    data: update,
    include: { lineItems: true },
  });
}

export async function deletePurchaseOrder(id: string) {
  await prisma.purchaseOrder.delete({ where: { id } });
  return { id };
}
