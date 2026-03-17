"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export default function ContactPage() {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const CONTACT_INFO = [
    {
      icon: Mail,
      title: t("contact.email_label"),
      value: "support@bhoomitayi.in",
      href: "mailto:support@bhoomitayi.in",
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      icon: Phone,
      title: t("contact.phone_label"),
      value: "+91 98765 43210",
      href: "tel:+919876543210",
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      icon: MapPin,
      title: t("contact.address_label"),
      value: t("contact.address_value"),
      href: null,
      gradient: "from-violet-500 to-purple-600",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error(t("contact.error_required"));
      return;
    }

    setSending(true);

    // Simulate sending (since there's no backend endpoint for contact form)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success(t("contact.success_message"));
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Page Hero */}
      <div className="relative overflow-hidden border-b border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-background dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-background">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-emerald-200/30 dark:bg-emerald-800/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-teal-200/30 dark:bg-teal-800/10 blur-3xl" />
        </div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
              <MessageSquare className="size-5 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">{t("contact.title")}</h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-xl">
            {t("contact.subtitle")}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="max-w-5xl mx-auto">
          {/* Contact Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            {CONTACT_INFO.map((item) => (
              <Card key={item.title} className="rounded-2xl border-zinc-200/80 dark:border-zinc-800/80 shadow-3d bg-white dark:bg-zinc-900/80 hover:-translate-y-0.5 transition-all duration-300">
                <CardContent className="flex items-center gap-4 py-5">
                  <div className={`flex items-center justify-center size-12 rounded-xl bg-gradient-to-br ${item.gradient} shadow-lg shrink-0`}>
                    <item.icon className="size-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{item.title}</p>
                    {item.href ? (
                      <a href={item.href} className="font-medium text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {item.value}
                      </a>
                    ) : (
                      <p className="font-medium text-foreground">{item.value}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contact Form */}
          <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800/80 shadow-3d bg-white dark:bg-zinc-900/80 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
            <CardContent className="p-6 sm:p-10">
              <h2 className="text-2xl font-bold text-foreground mb-2">{t("contact.form_title")}</h2>
              <p className="text-muted-foreground mb-8">{t("contact.form_subtitle")}</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("contact.name_label")}</Label>
                    <Input
                      id="name"
                      placeholder={t("contact.name_placeholder")}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={sending}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("contact.email_field_label")}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("contact.email_placeholder")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={sending}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">{t("contact.subject_label")}</Label>
                  <Input
                    id="subject"
                    placeholder={t("contact.subject_placeholder")}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={sending}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">{t("contact.message_label")}</Label>
                  <Textarea
                    id="message"
                    placeholder={t("contact.message_placeholder")}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    disabled={sending}
                    rows={5}
                    maxLength={2000}
                    className="rounded-xl"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={sending}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-600/20 px-8 h-11"
                >
                  <Send className="size-4 mr-2" />
                  {sending ? t("contact.sending") : t("contact.send_message")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
