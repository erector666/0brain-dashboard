import { useState } from "react";

const STORAGE_KEY = "0brain-custom-avatars";
const COLOR_STORAGE_KEY = "0brain-agent-colors";

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

function loadColors(defaultColors: Record<string, string>): Record<string, string> {
  try {
    const stored = JSON.parse(localStorage.getItem(COLOR_STORAGE_KEY) || "{}");
    return { ...defaultColors, ...stored };
  } catch {
    return { ...defaultColors };
  }
}

function saveColors(colors: Record<string, string>): void {
  localStorage.setItem(COLOR_STORAGE_KEY, JSON.stringify(colors));
}

export function useCustomAvatars(defaultColors: Record<string, string> = {}) {
  const [avatars, setAvatars] = useState<Record<string, string>>(loadAvatars);
  const [agentColors, setAgentColors] = useState<Record<string, string>>(() => loadColors(defaultColors));

  const persistAndUpdateAvatars = (next: Record<string, string>) => {
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
    persistAndUpdateAvatars({ ...avatars, [agentId]: dataUrl });
  };

  const clearCustomAvatar = (agentId: string): void => {
    const next = { ...avatars };
    delete next[agentId];
    persistAndUpdateAvatars(next);
  };

  const getAgentColor = (agentId: string): string | undefined => {
    return agentColors[agentId];
  };

  const setAgentColor = (agentId: string, color: string): void => {
    const next = { ...agentColors, [agentId]: color };
    saveColors(next);
    setAgentColors(next);
  };

  return { getCustomAvatar, setCustomAvatar, clearCustomAvatar, getAgentColor, setAgentColor };
}
