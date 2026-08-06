import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { AdmissionError } from "./errors";

const maxPhotoBytes = 2 * 1024 * 1024;

export async function saveAdmissionPhoto(applicationId: string, dataUrl: string | undefined | null) {
  if (!dataUrl) return null;

  const match = /^data:(image\/(?:png|jpeg|jpg|webp));base64,([a-z0-9+/=]+)$/i.exec(dataUrl);
  if (!match) throw new AdmissionError("Photo must be a PNG, JPG, or WEBP data URL", 400);

  const mime = match[1].toLowerCase();
  const extension = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.byteLength > maxPhotoBytes) throw new AdmissionError("Photo must be 2 MB or smaller", 400);

  const publicDir = path.join(process.cwd(), "public", "uploads", "admissions", applicationId);
  await mkdir(publicDir, { recursive: true });

  const fileName = `photo.${extension}`;
  await writeFile(path.join(publicDir, fileName), buffer);
  return `/uploads/admissions/${applicationId}/${fileName}`;
}
