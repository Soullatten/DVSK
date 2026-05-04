import path from "path";
import fs from "fs";
import { cloudinary } from "../../config/cloudinary.js";
import { env } from "../../env.js";

const useCloudinary = Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);

const PUBLIC_BASE = (() => {
  const port = env.PORT;
  return `http://localhost:${port}`;
})();

function ensureLocalUploadsDir() {
  const dir = path.resolve(process.cwd(), "uploads");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function moveToFinalLocation(tempPath: string): { finalPath: string; publicUrl: string; filename: string } {
  const dir = ensureLocalUploadsDir();
  const ext = path.extname(tempPath) || ".jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
  const finalPath = path.join(dir, filename);
  fs.renameSync(tempPath, finalPath);
  return {
    finalPath,
    filename,
    publicUrl: `${PUBLIC_BASE}/uploads/${filename}`,
  };
}

export async function uploadImage(filePath: string, folder = "dvsk/products") {
  if (useCloudinary) {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "image",
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    });
    try { fs.unlinkSync(filePath); } catch {}
    return {
      publicId: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
    };
  }

  const moved = moveToFinalLocation(filePath);
  return {
    publicId: moved.filename,
    url: moved.publicUrl,
    width: 0,
    height: 0,
  };
}

export async function uploadMultipleImages(filePaths: string[], folder = "dvsk/products") {
  const results = await Promise.all(filePaths.map((p) => uploadImage(p, folder)));
  return results;
}

export async function deleteImage(publicId: string) {
  if (useCloudinary && !publicId.includes(".")) {
    return cloudinary.uploader.destroy(publicId);
  }
  // Local file deletion
  try {
    const localPath = path.resolve(process.cwd(), "uploads", publicId);
    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    return { result: "ok" };
  } catch (err: any) {
    return { result: "error", message: err?.message };
  }
}
