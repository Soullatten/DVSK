import { cloudinary } from "../../config/cloudinary.js";

export async function uploadImage(filePath: string, folder = "dvsk/products") {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: "image",
    transformation: [
      { quality: "auto", fetch_format: "auto" },
    ],
  });

  return {
    publicId: result.public_id,
    url: result.secure_url,
    width: result.width,
    height: result.height,
  };
}

export async function uploadMultipleImages(filePaths: string[], folder = "dvsk/products") {
  const results = await Promise.all(filePaths.map((path) => uploadImage(path, folder)));
  return results;
}

export async function deleteImage(publicId: string) {
  return cloudinary.uploader.destroy(publicId);
}
