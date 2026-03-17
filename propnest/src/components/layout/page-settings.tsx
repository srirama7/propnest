"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check, Settings, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { SUPPORTED_LANGUAGES, type LanguageCode } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function PageSettings() {
  const { i18n, t } = useTranslation();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) ||
    SUPPORTED_LANGUAGES[0];

  const handleChange = (code: LanguageCode) => {
    i18n.changeLanguage(code);
    localStorage.setItem("portal_lang", code);
    document.documentElement.lang = code;
  };

  return (
    <div className="fixed bottom-24 right-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-14 right-0 w-64 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/50 bg-white dark:bg-zinc-900 shadow-2xl backdrop-blur-xl p-4 space-y-4"
          >
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {t("common.theme", "Theme")}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-lg"
                onClick={() =>
                  setTheme(resolvedTheme === "dark" ? "light" : "dark")
                }
              >
                {resolvedTheme === "dark" ? (
                  <Moon className="size-3.5 text-blue-400" />
                ) : (
                  <Sun className="size-3.5 text-amber-500" />
                )}
                <span className="text-xs">
                  {resolvedTheme === "dark"
                    ? t("common.dark", "Dark")
                    : t("common.light", "Light")}
                </span>
              </Button>
            </div>

            {/* Language Selection */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Globe className="size-3" />
                {t("common.language", "Language")}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleChange(lang.code)}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-left text-sm transition-all duration-150 ${
                      i18n.language === lang.code
                        ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-foreground"
                    }`}
                  >
                    {i18n.language === lang.code && (
                      <Check className="size-3 shrink-0" />
                    )}
                    <span className="font-medium truncate">
                      {lang.nativeLabel}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          onClick={() => setOpen(!open)}
          size="icon"
          className={`size-12 rounded-full shadow-lg transition-all duration-200 ${
            open
              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30"
              : "bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-foreground border border-zinc-200 dark:border-zinc-700 shadow-zinc-200/50 dark:shadow-black/30"
          }`}
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.div
                key="globe"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Globe className="size-5" />
              </motion.div>
            ) : (
              <motion.div
                key="settings"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Settings className="size-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* Current language indicator */}
      {!open && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-1 -left-1 size-5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-zinc-900"
        >
          {currentLang.code.toUpperCase()}
        </motion.div>
      )}
    </div>
  );
}
