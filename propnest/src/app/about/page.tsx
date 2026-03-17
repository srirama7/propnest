"use client";

import { Building2, Users, Shield, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

const FEATURES = [
  {
    icon: Building2,
    titleKey: "about.feature_verified_listings",
    descKey: "about.feature_verified_listings_desc",
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    icon: Users,
    titleKey: "about.feature_verified_sellers",
    descKey: "about.feature_verified_sellers_desc",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    icon: Shield,
    titleKey: "about.feature_secure",
    descKey: "about.feature_secure_desc",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: Zap,
    titleKey: "about.feature_fast",
    descKey: "about.feature_fast_desc",
    gradient: "from-amber-500 to-orange-600",
  },
];

export default function AboutPage() {
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
              <Building2 className="size-5 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">{t("about.title")}</h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-xl">
            {t("about.subtitle")}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Mission */}
          <div className="bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-3d p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">{t("about.mission_title")}</h2>
            <div className="text-muted-foreground leading-relaxed space-y-4">
              <p dangerouslySetInnerHTML={{ __html: t("about.mission_p1") }} />
              <p>{t("about.mission_p2")}</p>
              <p>{t("about.mission_p3")}</p>
            </div>
          </div>

          {/* What We Do */}
          <div className="bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-3d p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">{t("about.what_we_do_title")}</h2>
            <div className="text-muted-foreground leading-relaxed space-y-4">
              <p dangerouslySetInnerHTML={{ __html: t("about.what_we_do_intro") }} />
              <ul className="list-disc pl-6 space-y-2">
                <li>{t("about.what_we_do_1")}</li>
                <li>{t("about.what_we_do_2")}</li>
                <li>{t("about.what_we_do_3")}</li>
                <li>{t("about.what_we_do_4")}</li>
                <li>{t("about.what_we_do_5")}</li>
              </ul>
            </div>
          </div>

          {/* Features Grid */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6 text-center">{t("about.why_choose")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FEATURES.map((feature) => (
                <div key={feature.titleKey} className="bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-3d p-6">
                  <div className={`flex items-center justify-center size-12 rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg mb-4`}>
                    <feature.icon className="size-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{t(feature.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(feature.descKey)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-3d p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">{t("about.contact_title")}</h2>
            <div className="text-muted-foreground leading-relaxed space-y-2">
              <p><strong>{t("about.contact_email_label")}</strong>{" "}<a href="mailto:support@bhoomitayi.in" className="text-blue-600 dark:text-blue-400 hover:underline">support@bhoomitayi.in</a></p>
              <p><strong>{t("about.contact_phone_label")}</strong>{" "}<a href="tel:+919876543210" className="text-blue-600 dark:text-blue-400 hover:underline">+91 98765 43210</a></p>
              <p><strong>{t("about.contact_address_label")}</strong> {t("about.contact_address_value")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
