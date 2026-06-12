import { useState } from "react";

const STORAGE_KEY = "0brain-custom-avatars";

function loadAvatars(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveAvatars(avatars: Record<string, string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(avatars));
}

export function useCustomAvatars() {
  const [avatars, setAvatars] = useState<Record<string, string>>(loadAvatars);

  const persistAndUpdate = (next: Record<string, string>) => {
    saveAvatars(next);
    setAvatars(next);
  };

  const getCustomAvatar = (agentId: string): string | null => {
    return avatars[agentId] ?? null;
  };

  const setCustomAvatar = async (agentId: string, file: File): Promise<void> => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    persistAndUpdate({ ...avatars, [agentId]: dataUrl });
  };

  const clearCustomAvatar = (agentId: string): void => {
    const next = { ...avatars };
    delete next[agentId];
    persistAndUpdate(next);
  };

  return { getCustomAvatar, setCustomAvatar, clearCustomAvatar };
}
