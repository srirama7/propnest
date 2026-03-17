"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Settings,
  X,
  ZoomIn,
  ZoomOut,
  Type,
  Contrast,
  MousePointer2,
  Underline,
  Space,
  Eye,
  RotateCcw,
  Volume2,
  VolumeX,
  Minus,
  Plus,
} from "lucide-react";

interface AccessibilitySettings {
  fontSize: number; // percentage: 100 = normal
  highContrast: boolean;
  dyslexiaFont: boolean;
  highlightLinks: boolean;
  bigCursor: boolean;
  textSpacing: boolean;
  saturation: number; // 0 = grayscale, 100 = normal
  readingGuide: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSize: 100,
  highContrast: false,
  dyslexiaFont: false,
  highlightLinks: false,
  bigCursor: false,
  textSpacing: false,
  saturation: 100,
  readingGuide: false,
};

const STORAGE_KEY = "accessibility_settings";

export function AccessibilityToolbar() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch {
      // ignore
    }
  }, []);

  // Apply settings to DOM
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const body = document.body;

    // Font size
    root.style.fontSize = `${settings.fontSize}%`;

    // High contrast
    if (settings.highContrast) {
      body.classList.add("a11y-high-contrast");
    } else {
      body.classList.remove("a11y-high-contrast");
    }

    // Dyslexia font
    if (settings.dyslexiaFont) {
      body.classList.add("a11y-dyslexia-font");
    } else {
      body.classList.remove("a11y-dyslexia-font");
    }

    // Highlight links
    if (settings.highlightLinks) {
      body.classList.add("a11y-highlight-links");
    } else {
      body.classList.remove("a11y-highlight-links");
    }

    // Big cursor
    if (settings.bigCursor) {
      body.classList.add("a11y-big-cursor");
    } else {
      body.classList.remove("a11y-big-cursor");
    }

    // Text spacing
    if (settings.textSpacing) {
      body.classList.add("a11y-text-spacing");
    } else {
      body.classList.remove("a11y-text-spacing");
    }

    // Saturation (grayscale)
    if (settings.saturation < 100) {
      root.style.filter = `saturate(${settings.saturation}%)`;
    } else {
      root.style.filter = "";
    }

    // Reading guide
    if (settings.readingGuide) {
      body.classList.add("a11y-reading-guide");
    } else {
      body.classList.remove("a11y-reading-guide");
    }

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings, mounted]);

  // Reading guide mouse follower
  useEffect(() => {
    if (!settings.readingGuide || !mounted) return;

    let guide = document.getElementById("a11y-reading-guide-el");
    if (!guide) {
      guide = document.createElement("div");
      guide.id = "a11y-reading-guide-el";
      guide.style.cssText = `
        position: fixed;
        left: 0;
        right: 0;
        height: 40px;
        background: rgba(255, 255, 0, 0.15);
        border-top: 2px solid rgba(255, 200, 0, 0.5);
        border-bottom: 2px solid rgba(255, 200, 0, 0.5);
        pointer-events: none;
        z-index: 99998;
        transition: top 0.1s ease;
      `;
      document.body.appendChild(guide);
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (guide) guide.style.top = `${e.clientY - 20}px`;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      guide?.remove();
    };
  }, [settings.readingGuide, mounted]);

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetAll = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    if (typeof window !== "undefined") {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Store audio element ref for Google TTS cleanup
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleReadAloud = useCallback(() => {
    if (isSpeaking) {
      // Stop everything
      window.speechSynthesis?.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsSpeaking(false);
      return;
    }

    const main = document.querySelector("main");
    const text = main?.innerText || document.body.innerText;
    if (!text.trim()) return;

    const langMap: Record<string, string> = {
      en: "en-IN", kn: "kn-IN", hi: "hi-IN",
      te: "te-IN", ml: "ml-IN", ta: "ta-IN",
    };
    // Google TTS uses simpler language codes
    const googleLangMap: Record<string, string> = {
      en: "en-in", kn: "kn", hi: "hi", te: "te", ml: "ml", ta: "ta",
    };
    const currentLang = localStorage.getItem("portal_lang") || "en";
    const targetLang = langMap[currentLang] || "en-IN";
    const googleLang = googleLangMap[currentLang] || "en-in";

    // Find native voice for this language
    const findNativeVoice = (voiceList: SpeechSynthesisVoice[]) => {
      const langPrefix = currentLang;
      // Exact lang match (e.g. kn-IN)
      let voice = voiceList.find((v) => v.lang === targetLang);
      if (voice) return voice;
      // Partial match (e.g. starts with "kn")
      voice = voiceList.find((v) => v.lang.startsWith(langPrefix));
      if (voice) return voice;
      // For English, look for Indian English
      if (langPrefix === "en") {
        voice = voiceList.find((v) => v.lang === "en-IN");
        if (voice) return voice;
      }
      return null;
    };

    // Google Translate TTS fallback — works for all Indian languages
    const speakWithGoogleTTS = (fullText: string) => {
      // Google TTS has a ~200 char limit per request, so split into sentences
      const sentences: string[] = [];
      const raw = fullText.substring(0, 5000);
      // Split by sentence boundaries
      const parts = raw.match(/[^.!?।\n]+[.!?।\n]*/g) || [raw];
      let current = "";
      for (const part of parts) {
        if ((current + part).length > 180) {
          if (current.trim()) sentences.push(current.trim());
          current = part;
        } else {
          current += part;
        }
      }
      if (current.trim()) sentences.push(current.trim());

      let index = 0;
      setIsSpeaking(true);

      const playNext = () => {
        if (index >= sentences.length) {
          setIsSpeaking(false);
          audioRef.current = null;
          return;
        }
        const encoded = encodeURIComponent(sentences[index]);
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${googleLang}&client=tw-ob`;
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.playbackRate = 0.9;
        audio.onended = () => {
          index++;
          playNext();
        };
        audio.onerror = () => {
          // If Google TTS fails, fall back to native speechSynthesis
          console.warn("[ReadAloud] Google TTS failed, falling back to native voice");
          speakWithNative(sentences.slice(index).join(" "));
        };
        audio.play().catch(() => {
          // Autoplay blocked or network error — fall back to native
          speakWithNative(sentences.slice(index).join(" "));
        });
      };

      playNext();
    };

    // Native speechSynthesis (used as primary for supported voices, or fallback)
    const speakWithNative = (fullText: string) => {
      if (!("speechSynthesis" in window)) return;

      const maxChunk = 2000;
      const chunks: string[] = [];
      const trimmed = fullText.substring(0, 10000);
      for (let i = 0; i < trimmed.length; i += maxChunk) {
        chunks.push(trimmed.substring(i, i + maxChunk));
      }

      const voiceList = window.speechSynthesis.getVoices();
      const matchedVoice = findNativeVoice(voiceList);

      chunks.forEach((chunk, idx) => {
        const utterance = new SpeechSynthesisUtterance(chunk);
        utterance.lang = targetLang;
        if (matchedVoice) {
          utterance.voice = matchedVoice;
          utterance.lang = matchedVoice.lang;
        }
        utterance.rate = 0.9;
        utterance.pitch = 1;

        if (idx === chunks.length - 1) {
          utterance.onend = () => setIsSpeaking(false);
        }
        utterance.onerror = () => {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
      });

      setIsSpeaking(true);
    };

    // Decide: use Google TTS (better for Indian languages) or native voice
    const voices = window.speechSynthesis?.getVoices() || [];
    const nativeVoice = findNativeVoice(voices);

    // If no native voice exists for this language, OR it's a non-English Indian language,
    // prefer Google TTS as it has proper pronunciation for Indian languages
    if (!nativeVoice || (currentLang !== "en" && !nativeVoice.lang.startsWith(currentLang))) {
      speakWithGoogleTTS(text);
    } else {
      speakWithNative(text);
    }
  }, [isSpeaking]);

  // Listen for Bella AI commands
  useEffect(() => {
    const handleBellaAccessibility = (e: Event) => {
      const detail = (e as CustomEvent).detail as string;
      switch (detail) {
        case "font_increase":
          setSettings((prev) => ({ ...prev, fontSize: Math.min(prev.fontSize + 10, 150) }));
          break;
        case "font_decrease":
          setSettings((prev) => ({ ...prev, fontSize: Math.max(prev.fontSize - 10, 80) }));
          break;
        case "font_reset":
          setSettings((prev) => ({ ...prev, fontSize: 100 }));
          break;
        case "high_contrast_on":
          setSettings((prev) => ({ ...prev, highContrast: true }));
          break;
        case "high_contrast_off":
          setSettings((prev) => ({ ...prev, highContrast: false }));
          break;
        case "reading_guide_on":
          setSettings((prev) => ({ ...prev, readingGuide: true }));
          break;
        case "reading_guide_off":
          setSettings((prev) => ({ ...prev, readingGuide: false }));
          break;
        case "dyslexia_on":
          setSettings((prev) => ({ ...prev, dyslexiaFont: true }));
          break;
        case "dyslexia_off":
          setSettings((prev) => ({ ...prev, dyslexiaFont: false }));
          break;
        case "reset_all":
          resetAll();
          break;
      }
    };

    const handleBellaReadAloud = () => {
      toggleReadAloud();
    };

    window.addEventListener("bella:accessibility", handleBellaAccessibility);
    window.addEventListener("bella:read-aloud", handleBellaReadAloud);
    return () => {
      window.removeEventListener("bella:accessibility", handleBellaAccessibility);
      window.removeEventListener("bella:read-aloud", handleBellaReadAloud);
    };
  }, [resetAll, toggleReadAloud]);

  if (!mounted) return null;

  const isModified = JSON.stringify(settings) !== JSON.stringify(DEFAULT_SETTINGS);

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[99999] flex items-center justify-center size-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-400/50"
        aria-label={t("a11y.title")}
        title={t("a11y.title")}
      >
        {isOpen ? <X className="size-6" /> : <Settings className="size-6" />}
        {isModified && !isOpen && (
          <span className="absolute -top-1 -right-1 size-4 rounded-full bg-green-500 border-2 border-white" />
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[99999] w-[320px] max-h-[80vh] overflow-y-auto overflow-x-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-2xl shadow-black/20">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="size-5" />
                <h2 className="text-base font-bold">{t("a11y.title")}</h2>
              </div>
              <button
                onClick={resetAll}
                className="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 px-2.5 py-1.5 rounded-lg transition-colors"
                title={t("a11y.reset")}
              >
                <RotateCcw className="size-3" />
                {t("a11y.reset")}
              </button>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {/* Font Size */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Type className="size-4 text-blue-600" />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("a11y.font_size")}</span>
                <span className="ml-auto text-xs text-zinc-500 font-mono">{settings.fontSize}%</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateSetting("fontSize", Math.max(80, settings.fontSize - 10))}
                  className="flex items-center justify-center size-8 rounded-lg bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-600 transition-colors"
                  disabled={settings.fontSize <= 80}
                >
                  <ZoomOut className="size-4" />
                </button>
                <input
                  type="range"
                  min={80}
                  max={150}
                  step={10}
                  value={settings.fontSize}
                  onChange={(e) => updateSetting("fontSize", Number(e.target.value))}
                  className="flex-1 h-2 rounded-lg appearance-none bg-zinc-200 dark:bg-zinc-600 accent-blue-600"
                />
                <button
                  onClick={() => updateSetting("fontSize", Math.min(150, settings.fontSize + 10))}
                  className="flex items-center justify-center size-8 rounded-lg bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-600 transition-colors"
                  disabled={settings.fontSize >= 150}
                >
                  <ZoomIn className="size-4" />
                </button>
              </div>
            </div>

            {/* Toggle Options */}
            <ToggleOption
              icon={<Contrast className="size-4" />}
              label={t("a11y.high_contrast")}
              active={settings.highContrast}
              onToggle={() => updateSetting("highContrast", !settings.highContrast)}
            />

            <ToggleOption
              icon={<Type className="size-4" />}
              label={t("a11y.friendly_font")}
              active={settings.dyslexiaFont}
              onToggle={() => updateSetting("dyslexiaFont", !settings.dyslexiaFont)}
            />

            <ToggleOption
              icon={<Underline className="size-4" />}
              label={t("a11y.highlight_links")}
              active={settings.highlightLinks}
              onToggle={() => updateSetting("highlightLinks", !settings.highlightLinks)}
            />

            <ToggleOption
              icon={<MousePointer2 className="size-4" />}
              label={t("a11y.big_cursor")}
              active={settings.bigCursor}
              onToggle={() => updateSetting("bigCursor", !settings.bigCursor)}
            />

            <ToggleOption
              icon={<Space className="size-4" />}
              label={t("a11y.text_spacing")}
              active={settings.textSpacing}
              onToggle={() => updateSetting("textSpacing", !settings.textSpacing)}
            />

            <ToggleOption
              icon={<Eye className="size-4" />}
              label={t("a11y.reading_guide")}
              active={settings.readingGuide}
              onToggle={() => updateSetting("readingGuide", !settings.readingGuide)}
            />

            {/* Saturation */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="size-4 text-blue-600" />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("a11y.saturation")}</span>
                <span className="ml-auto text-xs text-zinc-500 font-mono">{settings.saturation}%</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateSetting("saturation", Math.max(0, settings.saturation - 25))}
                  className="flex items-center justify-center size-8 rounded-lg bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-600 transition-colors"
                  disabled={settings.saturation <= 0}
                >
                  <Minus className="size-4" />
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={25}
                  value={settings.saturation}
                  onChange={(e) => updateSetting("saturation", Number(e.target.value))}
                  className="flex-1 h-2 rounded-lg appearance-none bg-zinc-200 dark:bg-zinc-600 accent-blue-600"
                />
                <button
                  onClick={() => updateSetting("saturation", Math.min(100, settings.saturation + 25))}
                  className="flex items-center justify-center size-8 rounded-lg bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-600 transition-colors"
                  disabled={settings.saturation >= 100}
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>

            {/* Read Aloud */}
            {"speechSynthesis" in (typeof window !== "undefined" ? window : {}) && (
              <button
                onClick={toggleReadAloud}
                className={`w-full flex items-center gap-3 rounded-xl p-3 transition-all ${
                  isSpeaking
                    ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
                    : "bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent"
                }`}
              >
                {isSpeaking ? (
                  <VolumeX className="size-4 text-red-500" />
                ) : (
                  <Volume2 className="size-4 text-blue-600" />
                )}
                <span className="text-sm font-medium">
                  {isSpeaking ? t("a11y.stop_reading") : t("a11y.read_aloud")}
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ToggleOption({
  icon,
  label,
  active,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-3 rounded-xl p-3 transition-all ${
        active
          ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
          : "bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent"
      }`}
    >
      <span className={active ? "text-blue-600" : "text-zinc-500"}>{icon}</span>
      <span className={`text-sm font-medium ${active ? "text-blue-700 dark:text-blue-400" : "text-zinc-700 dark:text-zinc-300"}`}>
        {label}
      </span>
      <span
        className={`ml-auto inline-flex flex-shrink-0 items-center w-9 h-5 rounded-full transition-colors duration-200 ${
          active ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-600"
        }`}
        style={{ minWidth: "36px", maxWidth: "36px" }}
      >
        <span
          className={`inline-block w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all duration-200 ${
            active ? "ml-[18px]" : "ml-[3px]"
          }`}
        />
      </span>
    </button>
  );
}
