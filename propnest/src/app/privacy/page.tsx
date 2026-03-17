"use client";

import { Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function PrivacyPolicyPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      {/* Page Hero */}
      <div className="relative overflow-hidden border-b border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-background dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-background">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-blue-200/30 dark:bg-blue-800/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-indigo-200/30 dark:bg-indigo-800/10 blur-3xl" />
        </div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
              <Shield className="size-5 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">{t("privacy.title")}</h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-xl">
            {t("privacy.last_updated")}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="max-w-3xl mx-auto space-y-8">
          <Section title={t("privacy.section1_title")}>
            <p>{t("privacy.section1_intro")}</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li dangerouslySetInnerHTML={{ __html: t("privacy.section1_item1") }} />
              <li dangerouslySetInnerHTML={{ __html: t("privacy.section1_item2") }} />
              <li dangerouslySetInnerHTML={{ __html: t("privacy.section1_item3") }} />
              <li dangerouslySetInnerHTML={{ __html: t("privacy.section1_item4") }} />
            </ul>
          </Section>

          <Section title={t("privacy.section2_title")}>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t("privacy.section2_item1")}</li>
              <li>{t("privacy.section2_item2")}</li>
              <li>{t("privacy.section2_item3")}</li>
              <li>{t("privacy.section2_item4")}</li>
              <li>{t("privacy.section2_item5")}</li>
            </ul>
          </Section>

          <Section title={t("privacy.section3_title")}>
            <p>{t("privacy.section3_intro")}</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li dangerouslySetInnerHTML={{ __html: t("privacy.section3_item1") }} />
              <li dangerouslySetInnerHTML={{ __html: t("privacy.section3_item2") }} />
              <li dangerouslySetInnerHTML={{ __html: t("privacy.section3_item3") }} />
            </ul>
          </Section>

          <Section title={t("privacy.section4_title")}>
            <p>{t("privacy.section4_body")}</p>
          </Section>

          <Section title={t("privacy.section5_title")}>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t("privacy.section5_item1")}</li>
              <li>{t("privacy.section5_item2")}</li>
              <li>{t("privacy.section5_item3")}</li>
              <li>{t("privacy.section5_item4")}</li>
            </ul>
          </Section>

          <Section title={t("privacy.section6_title")}>
            <p>{t("privacy.section6_body")}</p>
          </Section>

          <Section title={t("privacy.section7_title")}>
            <p>
              {t("privacy.section7_body")}{" "}
              <a href="mailto:privacy@bhoomitayi.in" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                privacy@bhoomitayi.in
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
