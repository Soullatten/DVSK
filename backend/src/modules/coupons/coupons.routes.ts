import { Router } from "express";
import { prisma } from "../../config/database.js";
import { success, badRequest, error as apiError } from "../../utils/apiResponse.js";

const router = Router();

// POST /api/coupons/validate
// Body: { code: string, subtotal?: number }
// Validates a customer-entered coupon against the admin's Coupon table.
// Checks: exists, isActive, within validity window, usage limit not hit,
// minimum-order value (if set). Returns the resolved discount amount in ₹
// so the storefront can apply it to the order total.
router.post("/validate", async (req, res) => {
  try {
    const { code, subtotal } = req.body as { code?: string; subtotal?: number };
    if (!code || typeof code !== "string") return badRequest(res, "Coupon code is required");

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!coupon) return badRequest(res, "Coupon code not found");
    if (!coupon.isActive) return badRequest(res, "This coupon is no longer active");

    const now = new Date();
    if (now < coupon.validFrom) return badRequest(res, "This coupon isn't active yet");
    if (now > coupon.validUntil) return badRequest(res, "This coupon has expired");
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return badRequest(res, "This coupon has reached its usage limit");
    }

    const orderSubtotal = Number(subtotal || 0);
    if (coupon.minOrderValue && orderSubtotal < Number(coupon.minOrderValue)) {
      return badRequest(
        res,
        `This coupon requires a minimum order of ₹${Number(coupon.minOrderValue).toLocaleString("en-IN")}`
      );
    }

    // Resolve the actual discount amount in ₹
    const value = Number(coupon.discountValue);
    let discount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discount = (orderSubtotal * value) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
    } else {
      discount = value;
    }
    discount = Math.min(discount, orderSubtotal); // never exceed subtotal

    return success(res, {
      ok: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: value,
      maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
      minOrderValue: coupon.minOrderValue ? Number(coupon.minOrderValue) : null,
      discountAmount: Math.round(discount * 100) / 100,
      description: coupon.description,
    });
  } catch (err: any) {
    return apiError(res, 500, "COUPON_VALIDATE_ERROR", err.message);
  }
});

export default router;
