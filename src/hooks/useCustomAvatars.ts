import { useState } from "react";

const AVATAR_KEY_PREFIX = "0brain-custom-avatar:";
const COLOR_KEY = "0brain…lors";

const MAX_INPUT_SIZE = 5 * 1024 * 1024;
const AVATAR_SIZE = 192;
const OUTPUT_QUALITY = 0.78;

const VALID_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

function avatarKey(agentId: string): string {
  return `${AVATAR_KEY_PREFIX}${agentId}`;
}

function loadAvatar(agentId: string): string | null {
  try {
    return localStorage.getItem(avatarKey(agentId));
  } catch {
    return null;
  }
}

function loadAllAvatars(agentIds: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const id of agentIds) {
    const val = loadAvatar(id);
    if (val) result[id] = val;
  }
  return result;
}

function loadColors(defaultColors: Record<string, string>): Record<string, string> {
  try {
    const stored = JSON.parse(localStorage.getItem(COLOR_KEY) || "{}");
    return { ...defaultColors, ...stored };
  } catch {
    return { ...defaultColors };
  }
}

function saveColors(colors: Record<string, string>): void {
  localStorage.setItem(COLOR_KEY, JSON.stringify(colors));
}

async function compressAvatar(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image.");
  }
  if (!VALID_TYPES.includes(file.type) && file.type !== "image/gif") {
    throw new Error(
      `Unsupported format: ${file.type.split("/")[1] || file.type}. Use JPEG, PNG, WebP, or AVIF.`
    );
  }
  if (file.size > MAX_INPUT_SIZE) {
    const mb = (MAX_INPUT_SIZE / 1024 / 1024).toFixed(0);
    throw new Error(
      `Image too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is ${mb} MB.`
    );
  }

  let imageSource: ImageBitmap | HTMLImageElement;
  try {
    imageSource = await createImageBitmap(file);
  } catch {
    imageSource = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to decode image.")); };
      img.src = url;
    });
  }

  const width = imageSource.width;
  const height = imageSource.height;
  const size = Math.min(width, height);
  const sx = (width - size) / 2;
  const sy = (height - size) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(imageSource, sx, sy, size, size, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

  if ("close" in imageSource && typeof imageSource.close === "function") {
    imageSource.close();
  }

  const preferredTypes = ["image/webp", "image/jpeg"];
  let mimeType = "image/jpeg";
  for (const t of preferredTypes) {
    try {
      const test = canvas.toDataURL(t, 0.5);
      if (test.startsWith(`data:${t}`)) {
        mimeType = t;
        break;
      }
    } catch {
      // fall through
    }
  }

  return new Promise<string>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to compress image."));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read compressed image."));
        reader.readAsDataURL(blob);
      },
      mimeType,
      OUTPUT_QUALITY
    );
  });
}

function safeSetAvatar(agentId: string, dataUrl: string): { ok: boolean; error?: string } {
  const key = avatarKey(agentId);
  try {
    localStorage.setItem(key, dataUrl);
    return { ok: true };
  } catch (err) {
    if (err instanceof DOMException && err.name === "QuotaExceededError") {
      try {
        localStorage.removeItem(key);
        localStorage.setItem(key, dataUrl);
        return { ok: true };
      } catch {
        return { ok: false, error: "Storage is full. Clear some custom avatars or use a smaller image." };
      }
    }
    return { ok: false, error: err instanceof Error ? err.message : "Failed to save avatar." };
  }
}

export function useCustomAvatars(
  defaultColors: Record<string, string> = {},
  agentIds: string[] = []
) {
  const [avatars, setAvatars] = useState<Record<string, string>>(() => loadAllAvatars(agentIds));
  const [agentColors, setAgentColors] = useState<Record<string, string>>(() => loadColors(defaultColors));
  const [avatarError, setAvatarError] = useState<string>("");

  const getCustomAvatar = (agentId: string): string | null => {
    return avatars[agentId] ?? null;
  };

  const setCustomAvatar = async (agentId: string, file: File): Promise<void> => {
    setAvatarError("");
    try {
      const dataUrl = await compressAvatar(file);
      const result = safeSetAvatar(agentId, dataUrl);
      if (result.ok) {
        setAvatars((prev) => ({ ...prev, [agentId]: dataUrl }));
      } else {
        setAvatarError(result.error || "Failed to save avatar.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to process image.";
      setAvatarError(msg);
    }
  };

  const clearCustomAvatar = (agentId: string): void => {
    try {
      localStorage.removeItem(avatarKey(agentId));
    } catch {
      // ignore
    }
    setAvatars((prev) => {
      const next = { ...prev };
      delete next[agentId];
      return next;
    });
  };

  const getAgentColor = (agentId: string): string | undefined => {
    return agentColors[agentId];
  };

  const setAgentColor = (agentId: string, color: string): void => {
    const next = { ...agentColors, [agentId]: color };
    saveColors(next);
    setAgentColors(next);
  };

  return { getCustomAvatar, setCustomAvatar, clearCustomAvatar, getAgentColor, setAgentColor, avatarError, setAvatarError };
}
