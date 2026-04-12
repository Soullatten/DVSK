import type { Request, Response } from "express";
import * as paymentService from "./payment.service.js";
import { success, badRequest } from "../../utils/apiResponse.js";

export async function createOrder(req: Request, res: Response) {
  try {
    const result = await paymentService.createRazorpayOrder(req.body.orderId, req.user!.id);
    return success(res, result, "Payment order created");
  } catch (err: any) {
    return badRequest(res, err.message);
  }
}

export async function verify(req: Request, res: Response) {
  try {
    const payment = await paymentService.verifyPayment(req.body);
    return success(res, payment, "Payment verified successfully");
  } catch (err: any) {
    return badRequest(res, err.message);
  }
}

export async function webhook(req: Request, res: Response) {
  try {
    const signature = req.headers["x-razorpay-signature"] as string;
    await paymentService.handleWebhook(req.body, signature);
    return res.status(200).json({ status: "ok" });
  } catch (err: any) {
    console.error("[Razorpay Webhook Error]", err.message);
    return res.status(400).json({ status: "error" });
  }
}

export async function refund(req: Request, res: Response) {
  try {
    const payment = await paymentService.processRefund(req.params.id as string, req.body.amount);
    return success(res, payment, "Refund processed");
  } catch (err: any) {
    return badRequest(res, err.message);
  }
}
