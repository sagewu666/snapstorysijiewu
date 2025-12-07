// Client-side wrappers: call secure server API at /api/gemini.
// This file intentionally does NOT import @google/genai to avoid leaking API keys to client bundles.

import { StoryPage, Theme, LearnedWord, KidProfile } from "../types";

const cleanBase64 = (base64: string) => {
  return base64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
};

const resizeImage = (base64Str: string, maxWidth = 800): Promise<string> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(base64Str);
    const img = new Image();
    img.src = base64Str;
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width));
          width = maxWidth;
        }
      } else {
        if (height > maxWidth) {
          width = Math.round(width * (maxWidth / height));
          height = maxWidth;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
};

const callApi = async (payload: any) => {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Server error: ${res.status} ${text}`);
  }
  return res.json();
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  if (!text || !text.trim()) return null;
  const result = await callApi({ action: 'generateSpeech', text });
  return result?.audioBase64 ?? null;
};

export const identifyObject = async (
  imageBase64: string,
  theme?: Theme
): Promise<{ word: string; definition: string; visualDetail: string; matchesTheme: boolean; feedback?: string }> => {
  const resized = await resizeImage(imageBase64, 800);
  const clean = cleanBase64(resized);
  const result = await callApi({ action: 'identifyObject', imageBase64: clean, theme });
  return result;
};

export const lookupWordDefinition = async (word: string, context: string, ageGroup: string) => {
  const result = await callApi({ action: 'lookupWord', word, context, ageGroup });
  return result;
};

export const generateStoryContent = async (
  items: LearnedWord[],
  theme: Theme,
  kidProfile: KidProfile,
  userPrompt?: string
): Promise<{ title: string; pages: StoryPage[]; mainCharacterVisual: string }> => {
  const result = await callApi({ action: 'generateStory', items, theme, kidProfile, userPrompt });
  return result;
};

export const generateIllustration = async (prompt: string, style: string, characterVisual: string): Promise<string | null> => {
  const result = await callApi({ action: 'generateIllustration', prompt, style, characterVisual });
  return result?.imageBase64 ?? null;
};

export const generateSticker = async (imageBase64: string, word: string): Promise<string | null> => {
  const resized = await resizeImage(imageBase64, 512);
  const clean = cleanBase64(resized);
  const result = await callApi({ action: 'generateSticker', imageBase64: clean, word });
  return result?.imageBase64 ?? null;
};

