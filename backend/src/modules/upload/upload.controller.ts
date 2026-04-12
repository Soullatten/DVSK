import type { Request, Response } from "express";
import * as uploadService from "./upload.service.js";
import { success, badRequest } from "../../utils/apiResponse.js";

export async function uploadImage(req: Request, res: Response) {
  if (!req.file) return badRequest(res, "No file provided");

  try {
    const result = await uploadService.uploadImage(req.file.path);
    return success(res, result, "Image uploaded", 201);
  } catch (err: any) {
    return badRequest(res, err.message || "Upload failed");
  }
}

export async function uploadImages(req: Request, res: Response) {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return badRequest(res, "No files provided");
  }

  try {
    const paths = (req.files as Express.Multer.File[]).map((f) => f.path);
    const results = await uploadService.uploadMultipleImages(paths);
    return success(res, results, "Images uploaded", 201);
  } catch (err: any) {
    return badRequest(res, err.message || "Upload failed");
  }
}

export async function deleteImage(req: Request, res: Response) {
  try {
    await uploadService.deleteImage(req.params.publicId as string);
    return success(res, null, "Image deleted");
  } catch (err: any) {
    return badRequest(res, err.message || "Delete failed");
  }
}
