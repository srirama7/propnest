"use client";

import { ScrollText } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      {/* Page Hero */}
      <div className="relative overflow-hidden border-b border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-br from-violet-50 via-purple-50/50 to-background dark:from-violet-950/30 dark:via-purple-950/20 dark:to-background">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-violet-200/30 dark:bg-violet-800/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-purple-200/30 dark:bg-purple-800/10 blur-3xl" />
        </div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
              <ScrollText className="size-5 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">{t("terms.title")}</h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-xl">
            {t("terms.last_updated")}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="max-w-3xl mx-auto space-y-8">
          <Section title={t("terms.section1_title")}>
            <p>{t("terms.section1_body")}</p>
          </Section>

          <Section title={t("terms.section2_title")}>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t("terms.section2_item1")}</li>
              <li>{t("terms.section2_item2")}</li>
              <li>{t("terms.section2_item3")}</li>
              <li>{t("terms.section2_item4")}</li>
            </ul>
          </Section>

          <Section title={t("terms.section3_title")}>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t("terms.section3_item1")}</li>
              <li>{t("terms.section3_item2")}</li>
              <li>{t("terms.section3_item3")}</li>
              <li>{t("terms.section3_item4")}</li>
              <li>{t("terms.section3_item5")}</li>
            </ul>
          </Section>

          <Section title={t("terms.section4_title")}>
            <p>{t("terms.section4_intro")}</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>{t("terms.section4_item1")}</li>
              <li>{t("terms.section4_item2")}</li>
              <li>{t("terms.section4_item3")}</li>
              <li>{t("terms.section4_item4")}</li>
              <li>{t("terms.section4_item5")}</li>
            </ul>
          </Section>

          <Section title={t("terms.section5_title")}>
            <p>{t("terms.section5_intro")}</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>{t("terms.section5_item1")}</li>
              <li>{t("terms.section5_item2")}</li>
              <li>{t("terms.section5_item3")}</li>
              <li>{t("terms.section5_item4")}</li>
            </ul>
          </Section>

          <Section title={t("terms.section6_title")}>
            <p>{t("terms.section6_body")}</p>
          </Section>

          <Section title={t("terms.section7_title")}>
            <p>{t("terms.section7_body")}</p>
          </Section>

          <Section title={t("terms.section8_title")}>
            <p>{t("terms.section8_body")}</p>
          </Section>

          <Section title={t("terms.section9_title")}>
            <p>
              {t("terms.section9_body")}{" "}
              <a href="mailto:legal@bhoomitayi.in" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                legal@bhoomitayi.in
              </a>
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-3d p-6 sm:p-8">
      <h2 className="text-xl font-semibold text-foreground mb-4">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </div>
  );
}
