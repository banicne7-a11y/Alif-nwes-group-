import firebaseConfig from '../../firebase-applet-config.json' with { type: 'json' };

export type ResolvedMediaAsset =
  | { kind: 'binary'; contentType: string; buffer: Buffer }
  | { kind: 'redirect'; location: string }
  | { kind: 'not_found' };

const SAFE_MEDIA_ID = /^[a-zA-Z0-9_-]{1,128}$/;

export async function resolveMediaAsset(rawId: string): Promise<ResolvedMediaAsset> {
  const mediaId = String(rawId || '').trim();
  if (!SAFE_MEDIA_ID.test(mediaId)) {
    return { kind: 'not_found' };
  }

  const projectId = firebaseConfig.projectId;
  const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
  const apiKey = firebaseConfig.apiKey;
  const endpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    projectId
  )}/databases/${encodeURIComponent(databaseId)}/documents/media/${encodeURIComponent(
    mediaId
  )}?key=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) {
      return { kind: 'not_found' };
    }
    const docData: any = await res.json();
    const rawUrl = String(docData?.fields?.url?.stringValue || '').trim();
    if (!rawUrl) {
      return { kind: 'not_found' };
    }

    if (rawUrl.startsWith('data:image/')) {
      const match = rawUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/);
      if (!match) {
        return { kind: 'not_found' };
      }
      const contentType = match[1];
      const base64Body = match[2].replace(/\s+/g, '');
      const buffer = Buffer.from(base64Body, 'base64');
      if (buffer.length === 0) {
        return { kind: 'not_found' };
      }
      return { kind: 'binary', contentType, buffer };
    }

    if (/^https?:\/\//i.test(rawUrl)) {
      return { kind: 'redirect', location: rawUrl };
    }

    return { kind: 'not_found' };
  } catch {
    return { kind: 'not_found' };
  }
}
