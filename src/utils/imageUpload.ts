import { db } from '../services/db';
import { isFirebaseAdminUser } from '../services/firestoreSync';
import { MediaItem } from '../types';

export interface UploadedImageResult {
  url: string;
  previewDataUrl: string;
  mediaItem: MediaItem;
  synced: boolean;
  dimensions: string;
  sizeLabel: string;
}

const MAX_DATA_URI_LENGTH = 360000;

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('ছবিটি পড়া সম্ভব হয়নি। অন্য JPG/PNG/WebP ছবি দিন।'));
    img.src = src;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('ফাইল পড়া যায়নি।'));
    };
    reader.onerror = () => reject(new Error('ফাইল লোড করতে সমস্যা হয়েছে।'));
    reader.readAsDataURL(file);
  });
}

function encodeCanvasImage(
  img: HTMLImageElement,
  maxWidth: number,
  quality: number
): { dataUrl: string; width: number; height: number; mimeType: string } {
  const srcW = img.naturalWidth || img.width || 1200;
  const srcH = img.naturalHeight || img.height || 675;
  const scale = srcW > maxWidth ? maxWidth / srcW : 1;
  const targetW = Math.max(1, Math.round(srcW * scale));
  const targetH = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('ব্রাউজারে ছবি প্রসেস করা যায়নি।');
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.drawImage(img, 0, 0, targetW, targetH);

  // Try WebP first; fallback cleanly if Safari/WebView returns PNG instead of WebP
  let mimeType = 'image/webp';
  let dataUrl = canvas.toDataURL('image/webp', quality);
  if (!dataUrl.startsWith('data:image/webp')) {
    mimeType = 'image/jpeg';
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }
  return { dataUrl, width: targetW, height: targetH, mimeType };
}

export async function compressAndUploadGalleryImage(
  file: File,
  options?: { preferWebp?: boolean }
): Promise<UploadedImageResult> {
  if (!file.type.startsWith('image/')) {
    throw new Error('অনুগ্রহ করে শুধু ছবির ফাইল (JPG, PNG, WebP) সিলেক্ট করুন।');
  }
  if (file.size > 25 * 1024 * 1024) {
    throw new Error('ছবিটি ২৫ MB-এর বেশি বড়। অনুগ্রহ করে ছোট একটি ছবি বেছে নিন।');
  }

  let objectUrl: string | null = null;
  let img: HTMLImageElement;
  try {
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      objectUrl = URL.createObjectURL(file);
      img = await loadImageElement(objectUrl);
    } else {
      const rawUrl = await readFileAsDataUrl(file);
      img = await loadImageElement(rawUrl);
    }
  } catch {
    const rawUrl = await readFileAsDataUrl(file);
    img = await loadImageElement(rawUrl);
  } finally {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  }

  const preferWebp = options?.preferWebp !== false;
  let encoded = encodeCanvasImage(img, 1200, preferWebp ? 0.82 : 0.86);

  if (encoded.dataUrl.length > MAX_DATA_URI_LENGTH) {
    encoded = encodeCanvasImage(img, 960, 0.72);
  }
  if (encoded.dataUrl.length > MAX_DATA_URI_LENGTH) {
    encoded = encodeCanvasImage(img, 760, 0.62);
  }
  if (encoded.dataUrl.length > 440000) {
    throw new Error('ছবিটি অনেক বেশি ভারী। অনুগ্রহ করে তুলনামূলক হালকা ছবি দিন।');
  }

  const approxBytes = Math.round((encoded.dataUrl.length * 3) / 4);
  const sizeKb = Math.max(1, Math.round(approxBytes / 1024));
  const extTag = encoded.mimeType === 'image/webp' ? 'WebP' : 'JPG';
  const sizeLabel = `${sizeKb} KB (${extTag})`;
  const dimensions = `${encoded.width}x${encoded.height}`;

  const cleanName = (file.name || `photo-${Date.now()}.webp`).slice(0, 180);
  const altText = cleanName.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'News photo';

  const { item, synced } = await db.addMediaItemAsync({
    name: cleanName,
    url: encoded.dataUrl,
    type: 'image',
    size: sizeLabel,
    dimensions,
    format: encoded.mimeType,
    altText,
  });

  const adminSignedIn = isFirebaseAdminUser();
  const resolvedUrl = synced && adminSignedIn ? `/api/media?id=${encodeURIComponent(item.id)}` : encoded.dataUrl;

  return {
    url: resolvedUrl,
    previewDataUrl: encoded.dataUrl,
    mediaItem: item,
    synced: synced && adminSignedIn,
    dimensions,
    sizeLabel,
  };
}
