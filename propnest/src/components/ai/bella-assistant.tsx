"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Send, X, Minus, Sparkles, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";
import type { Listing } from "@/lib/types/database";
import { formatPrice } from "@/lib/constants";
import { useAuthStore } from "@/lib/store";

// ─── Types ───────────────────────────────────────────────
interface BellaAction {
  type: "theme" | "language" | "navigate" | "accessibility" | "read_aloud";
  value?: string;
}

interface Message {
  id: string;
  role: "user" | "bella";
  text: string;
  timestamp: Date;
  suggestions?: string[];
}

interface ConversationContext {
  lastCategory?: string;
  lastTransactionType?: string;
  lastLocation?: string;
  lastPriceRange?: { min?: number; max?: number };
  lastListings?: Listing[];
  turnCount: number;
}

// ─── Language Detection Map ──────────────────────────────
const LANG_DETECT: Record<string, string> = {
  english: "en", en: "en",
  kannada: "kn", kn: "kn",
  hindi: "hi", hi: "hi",
  telugu: "te", te: "te",
  malayalam: "ml", ml: "ml",
  tamil: "ta", ta: "ta",
};

// ─── Knowledge Base ──────────────────────────────────────
const KNOWLEDGE: Record<string, { keywords: string[]; response: string }> = {
  about: {
    keywords: [
      "what is bhoomi", "about bhoomi", "what is this", "about this app",
      "about this website", "tell me about bhoomi", "what does bhoomi",
      "about the app", "about the site", "what is the app", "what platform",
      "about your platform", "describe bhoomi", "explain bhoomi",
    ],
    response:
      "🏠 **BhoomiTayi** is India's trusted online marketplace for buying, selling, and renting properties, vehicles, and commodities.\n\nWe connect buyers, sellers, and service providers across India with:\n• 6 categories of listings\n• Multi-language support (6 languages)\n• Secure UPI payments\n• Verified listings\n\nThink of us as your one-stop marketplace for everything from houses to electronics!",
  },
  categories: {
    keywords: [
      "categor", "types of listing", "what can i find", "what do you offer",
      "what all", "what services", "what things", "sections", "what type",
      "listing types", "kinds of", "available categories",
    ],
    response:
      "📋 BhoomiTayi has **6 categories**:\n\n🏠 **Houses** — Apartments, villas, independent houses (buy/sell/rent)\n🌍 **Land** — Residential, commercial, agricultural, industrial plots\n🛏️ **PG** — Paying guest & hostel accommodations\n🏢 **Commercial** — Offices, shops, warehouses, co-working spaces\n🚗 **Vehicles** — Cars, bikes, scooters, trucks\n📦 **Commodities** — Electronics, furniture, appliances\n\nWhich category interests you?",
  },
  how_to_sell: {
    keywords: [
      "how to sell", "how to list", "how to register", "how to post",
      "list my", "sell my", "register my", "post my", "add listing",
      "create listing", "publish listing", "put up for sale", "want to sell",
      "i want to list", "add my property", "upload listing", "new listing",
      "submit listing", "place an ad", "post an ad",
    ],
    response:
      "📝 **How to list on BhoomiTayi:**\n\n1️⃣ Click **'Register Service'** in the navigation\n2️⃣ Choose a category (House, Land, PG, etc.)\n3️⃣ Fill the step-by-step form:\n   • Basic details (title, description, price)\n   • Service details (bedrooms, area, etc.)\n   • Location (address, pincode)\n   • Upload 1-4 images\n4️⃣ Preview your listing\n5️⃣ Complete UPI payment to publish\n\nYour listing goes live after verification! 🎉",
  },
  how_to_buy: {
    keywords: [
      "how to buy", "how to rent", "how to search", "how to find",
      "how to browse", "looking for", "searching for", "want to buy",
      "want to rent", "need a house", "need a flat", "find property",
      "search property", "browse listing", "how do i find",
    ],
    response:
      '🔍 **How to find what you need:**\n\n1️⃣ Browse categories from the **homepage** or **navigation bar**\n2️⃣ Use **filters** to narrow results:\n   • Transaction type (Buy/Sell/Rent)\n   • Price range (min-max)\n   • Sort by newest/price\n3️⃣ Click any listing to see **full details** with images\n4️⃣ Use the **inquiry form** to contact the seller\n\n💡 Tip: Use the search bar on the homepage for quick access!',
  },
  payment: {
    keywords: [
      "payment", "pay", "fee", "charge", "cost", "upi", "qr code",
      "how much", "listing fee", "subscription", "free or paid",
      "is it free", "pricing", "money", "amount", "payment gateway",
    ],
    response:
      "💳 **Payment Info:**\n\n• A small **₹10 listing fee** is charged via **UPI** when publishing\n• Simply scan the **QR code** and pay using any UPI app (GPay, PhonePe, Paytm, etc.)\n• UPI ID: **amoghabhat7403@oksbi**\n• This helps maintain quality & prevent spam\n• **Browsing is completely free** — no cost to search or view listings\n• **Contacting sellers is free** — use the inquiry form at no charge\n• Payment is only for listing a property/service\n\nAfter paying, your listing is reviewed by admin before going live!",
  },
  account: {
    keywords: [
      "account", "sign up", "login", "log in", "sign in", "register account",
      "create account", "dashboard", "profile", "my account", "settings",
      "edit profile", "update profile", "change password", "forgot password",
      "reset password", "my listings", "my properties",
    ],
    response:
      "👤 **Account & Dashboard:**\n\n• **Sign up** with email & password\n• **Login** to access your dashboard\n• **Dashboard** includes:\n  📋 My Listings — manage your active listings\n  ❤️ Favorites — saved properties\n  📨 Inquiries — messages from buyers\n  👤 Profile — update your info\n\n• **Forgot password?** Use the reset link on the login page\n• Visit **/dashboard** to manage everything!",
  },
  languages: {
    keywords: [
      "language", "translate", "change language", "multi language", "multilingual",
      "bhasha", "regional language", "local language",
    ],
    response:
      "🌐 **Language Support:**\n\nBhoomiTayi supports **6 languages**:\n\n🇬🇧 English\n🟠 ಕನ್ನಡ (Kannada)\n🟠 हिंदी (Hindi)\n🟠 తెలుగు (Telugu)\n🟠 മലయാളം (Malayalam)\n🟠 தமிழ் (Tamil)\n\n💡 **Want me to switch?** Just say:\n• *\"Change to Kannada\"*\n• *\"Switch to Hindi\"*\n• *\"Set language to Tamil\"*\n\nOr use the language button in the navbar!",
  },
  favorites: {
    keywords: [
      "favorite", "favourit", "save listing", "bookmark", "wishlist",
      "saved properties", "like listing", "heart", "shortlist",
    ],
    response:
      "❤️ **Favorites:**\n\n• Click the **heart icon** on any listing to save it\n• View all saved listings at **Dashboard > Favorites**\n• You must be **logged in** to use favorites\n• Favorites are synced across devices\n\nGreat for comparing properties before making a decision!",
  },
  inquiries: {
    keywords: [
      "contact seller", "inquir", "message seller", "reach seller",
      "talk to seller", "call seller", "contact owner", "reach owner",
      "send message", "enquiry", "enquire", "get in touch", "communicate",
    ],
    response:
      "📞 **Contacting Sellers:**\n\n1️⃣ Open any listing detail page\n2️⃣ Find the **inquiry form** on the right side\n3️⃣ Enter your **message** and **phone number**\n4️⃣ Click **Send Inquiry**\n\n• The seller sees your message in their **Dashboard > Inquiries**\n• Include your phone number so they can call back\n• It's completely **free** to send inquiries!",
  },
  safety: {
    keywords: [
      "safe", "trust", "fraud", "scam", "report", "verified", "fake",
      "genuine", "authentic", "legitimate", "security", "suspicious",
      "complaint", "flag", "block",
    ],
    response:
      "🛡️ **Safety & Trust:**\n\n• All listings are **reviewed before activation**\n• **Report suspicious listings** using the flag button\n• **Safety tips:**\n  ✅ Meet in public places for transactions\n  ✅ Verify property documents independently\n  ✅ Never share bank/financial details directly\n  ✅ Use the platform's inquiry system\n  ❌ Don't pay advances to unknown sellers\n\nSee something wrong? Hit the **Report** button on any listing.",
  },
  features: {
    keywords: [
      "feature", "what can bella", "accessibility", "dark mode", "theme",
      "read aloud", "pdf", "download", "share", "what can this app",
      "capabilities", "functionality", "tools", "options", "special",
    ],
    response:
      `✨ **BhoomiTayi Features & What I Can Do:**

┌─────────────────────────────────┐
│  **Feature**  →  **Bella Can Do It!**
├─────────────────────────────────┤
│ 🌙 Dark/Light Mode
│    Say: *"Switch to dark mode"*
├─────────────────────────────────┤
│ 🌐 Multi-language (6 languages)
│    Say: *"Change to Kannada"*
├─────────────────────────────────┤
│ 🔊 Read Aloud (all languages)
│    Say: *"Read this page aloud"*
├─────────────────────────────────┤
│ 🔍 Search & Filters
│    Say: *"Show houses under 50L"*
├─────────────────────────────────┤
│ ♿ Font Size Control
│    Say: *"Increase font size"*
├─────────────────────────────────┤
│ ⬛ High Contrast Mode
│    Say: *"Turn on high contrast"*
├─────────────────────────────────┤
│ 📖 Reading Guide
│    Say: *"Enable reading guide"*
├─────────────────────────────────┤
│ 🔤 Dyslexia-Friendly Font
│    Say: *"Turn on dyslexia font"*
├─────────────────────────────────┤
│ 🧭 Navigate Anywhere
│    Say: *"Take me to houses"*
├─────────────────────────────────┤
│ ❤️ Favorites  │ 📨 Inquiries
│ 📄 PDF Download │ 🔗 Share Link
│ 🚩 Report Listings │ 📱 Mobile Ready
└─────────────────────────────────┘

🐕 **Just tell me what to do!**`,
  },
  navigation: {
    keywords: [
      "navigate", "where is", "how to go", "find page", "where can i",
      "menu", "navbar", "sidebar", "header", "footer", "go to",
      "take me to", "open", "visit", "page",
    ],
    response:
      "🧭 **Navigating BhoomiTayi:**\n\n• **Homepage:** / — Search, browse categories\n• **Houses:** /houses\n• **Land:** /land\n• **PG:** /pg\n• **Commercial:** /commercial\n• **Vehicles:** /vehicles\n• **Commodities:** /commodities\n• **Sell/List:** /sell — Register a service\n• **Dashboard:** /dashboard — Manage your account\n• **Profile:** /dashboard/profile\n• **Favorites:** /dashboard/favorites\n\nUse the **navigation bar** at the top for quick access!",
  },
  edit_listing: {
    keywords: [
      "edit listing", "update listing", "modify listing", "change listing",
      "edit my property", "update my property", "change price", "update price",
      "delete listing", "remove listing", "deactivate", "mark as sold",
    ],
    response:
      "✏️ **Managing Your Listings:**\n\n• Go to **Dashboard > My Listings**\n• Click **Edit** on any listing to update details\n• You can change: title, description, price, images, etc.\n• **Delete** a listing from its detail page (if you're the owner)\n• Listing statuses: Active, Pending, Sold, Archived\n\nNeed help with a specific listing? Just ask!",
  },
  bella_info: {
    keywords: [
      "who are you", "your name", "bella", "what are you", "about you",
      "are you a bot", "are you ai", "are you real", "who made you",
      "your creator", "how do you work", "what can you do", "help me",
    ],
    response:
      `🐕 **Woof! I'm Bella!** Your BhoomiTayi AI assistant.

┌─────────────────────────────────┐
│ ⚡ **What I can do for you:**
├─────────────────────────────────┤
│ 🔍 **Search**
│    *"Show houses under 50 lakhs"*
│    *"Find PG in Bangalore"*
├─────────────────────────────────┤
│ 📊 **Live Stats**
│    *"How many listings?"*
│    *"Show stats"*
├─────────────────────────────────┤
│ 🌙 **Theme**
│    *"Switch to dark mode"*
│    *"Light mode"*
├─────────────────────────────────┤
│ 🌐 **Language**
│    *"Change to Kannada"*
│    *"Switch to Hindi"*
├─────────────────────────────────┤
│ 🔊 **Read Aloud**
│    *"Read this page"*
│    *"Stop reading"*
├─────────────────────────────────┤
│ ♿ **Accessibility**
│    *"Increase font size"*
│    *"High contrast on"*
│    *"Reading guide on"*
│    *"Dyslexia font on"*
├─────────────────────────────────┤
│ 🧭 **Navigate**
│    *"Take me to houses"*
│    *"Go to dashboard"*
│    *"Open sell page"*
└─────────────────────────────────┘

Just tell me what you need! 🐾`,
  },
};

// ─── Price Parsing ───────────────────────────────────────
function parsePrice(text: string): { min?: number; max?: number } | null {
  const t = text.toLowerCase().replace(/,/g, "");

  // "under X lakhs" / "below X lakhs" / "less than X lakhs"
  let m = t.match(/(?:under|below|less than|upto|up to|within|max|maximum)\s*(\d+(?:\.\d+)?)\s*(?:lakh|lac|l)\b/);
  if (m) return { max: parseFloat(m[1]) * 100000 };

  m = t.match(/(?:under|below|less than|upto|up to|within|max|maximum)\s*(\d+(?:\.\d+)?)\s*(?:crore|cr|c)\b/);
  if (m) return { max: parseFloat(m[1]) * 10000000 };

  m = t.match(/(?:under|below|less than|upto|up to|within|max|maximum)\s*(\d+(?:\.\d+)?)\s*(?:k|thousand)\b/);
  if (m) return { max: parseFloat(m[1]) * 1000 };

  // "above X lakhs" / "more than X lakhs" / "over X lakhs"
  m = t.match(/(?:above|over|more than|min|minimum|starting|from)\s*(\d+(?:\.\d+)?)\s*(?:lakh|lac|l)\b/);
  if (m) return { min: parseFloat(m[1]) * 100000 };

  m = t.match(/(?:above|over|more than|min|minimum|starting|from)\s*(\d+(?:\.\d+)?)\s*(?:crore|cr|c)\b/);
  if (m) return { min: parseFloat(m[1]) * 10000000 };

  // "X to Y lakhs" / "between X and Y lakhs"
  m = t.match(/(\d+(?:\.\d+)?)\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*(?:lakh|lac|l)\b/);
  if (m) return { min: parseFloat(m[1]) * 100000, max: parseFloat(m[2]) * 100000 };

  m = t.match(/(?:between)\s*(\d+(?:\.\d+)?)\s*(?:and)\s*(\d+(?:\.\d+)?)\s*(?:lakh|lac|l)\b/);
  if (m) return { min: parseFloat(m[1]) * 100000, max: parseFloat(m[2]) * 100000 };

  m = t.match(/(\d+(?:\.\d+)?)\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*(?:crore|cr|c)\b/);
  if (m) return { min: parseFloat(m[1]) * 10000000, max: parseFloat(m[2]) * 10000000 };

  // Plain numbers with lakhs/crores
  m = t.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|l)\b/);
  if (m) {
    const val = parseFloat(m[1]) * 100000;
    if (t.includes("cheap") || t.includes("budget") || t.includes("affordable")) return { max: val };
    return { min: val * 0.8, max: val * 1.2 }; // ±20% range
  }

  m = t.match(/(\d+(?:\.\d+)?)\s*(?:crore|cr|c)\b/);
  if (m) {
    const val = parseFloat(m[1]) * 10000000;
    return { min: val * 0.8, max: val * 1.2 };
  }

  return null;
}

// ─── Location Extraction ─────────────────────────────────
function extractLocation(text: string): string | null {
  const t = text.toLowerCase();
  // Match "in <location>" or "at <location>" or "near <location>"
  const m = t.match(/(?:in|at|near|around|from|located in|based in|within)\s+([a-zA-Z\s]{2,30})(?:\s|$|,|\.|!|\?)/);
  if (m) {
    const loc = m[1].trim();
    // Filter out common non-location words
    const stopWords = [
      "bhoomi", "bella", "the", "this", "app", "website", "price", "range",
      "budget", "my", "your", "our", "listing", "property", "house", "land",
      "market", "good", "best", "area", "condition",
    ];
    if (stopWords.some((w) => loc === w)) return null;
    return loc;
  }
  return null;
}

// ─── Category Detection ──────────────────────────────────
function detectCategory(text: string): string | null {
  const t = text.toLowerCase();
  const catMap: Record<string, string[]> = {
    house: ["house", "home", "apartment", "villa", "flat", "bhk", "bedroom", "3bhk", "2bhk", "1bhk", "duplex", "bungalow", "mansion", "residence", "residential"],
    land: ["land", "plot", "site", "acre", "guntha", "sqft area", "agricultural land", "farm land"],
    pg: ["pg", "paying guest", "hostel", "accommodation", "room for rent", "shared room", "dormitory", "boys pg", "girls pg"],
    commercial: ["commercial", "office", "shop", "warehouse", "showroom", "cowork", "retail", "godown", "mall space"],
    vehicle: ["vehicle", "car", "bike", "scooter", "truck", "motorcycle", "auto", "two wheeler", "four wheeler", "suv", "sedan", "hatchback"],
    commodity: ["commodit", "electronic", "furniture", "appliance", "phone", "laptop", "tv", "fridge", "washing machine", "sofa", "bed", "table", "chair", "gadget"],
  };

  for (const [cat, words] of Object.entries(catMap)) {
    if (words.some((w) => t.includes(w))) return cat;
  }
  return null;
}

// ─── Transaction Type Detection ──────────────────────────
function detectTransactionType(text: string): string | undefined {
  const t = text.toLowerCase();
  if (/\b(rent|rental|renting|monthly rent|lease|tenant)\b/.test(t)) return "rent";
  if (/\b(buy|purchase|buying|purchasing|invest|investment)\b/.test(t)) return "buy";
  if (/\b(sell|selling|sale|dispose)\b/.test(t)) return "sell";
  return undefined;
}

// ─── Fuzzy Match Score ───────────────────────────────────
function matchScore(text: string, keywords: string[]): number {
  const t = text.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (t.includes(kw)) {
      score += kw.length; // Longer matches score higher
    }
  }
  return score;
}

// ─── Category Emoji Map ──────────────────────────────────
const CAT_EMOJI: Record<string, string> = {
  house: "🏠", land: "🌍", pg: "🛏️", commercial: "🏢",
  vehicle: "🚗", commodity: "📦",
};
const CAT_LABEL: Record<string, string> = {
  house: "Houses", land: "Land", pg: "PG", commercial: "Commercial",
  vehicle: "Vehicles", commodity: "Commodities",
};
const CAT_ROUTE: Record<string, string> = {
  house: "/houses", land: "/land", pg: "/pg", commercial: "/commercial",
  vehicle: "/vehicles", commodity: "/commodities",
};

// ─── Component ───────────────────────────────────────────
export function BellaAssistant() {
  const { t, i18n } = useTranslation();
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const contextRef = useRef<ConversationContext>({ turnCount: 0 });

  // Draggable state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const hasDraggedRef = useRef(false);

  const userName = profile?.full_name || user?.displayName || "";
  const userEmail = user?.email || "";

  const getWelcomeMessage = useCallback((): Message => {
    const greeting = userName ? `Woof! 🐕 Hi **${userName}**, I'm **Bella**` : "Woof! 🐕 Hi, I'm **Bella**";
    const accountInfo = userEmail ? `\n\n👤 Logged in as: **${userEmail}**` : "\n\n👤 You're not logged in. Log in to list properties & manage your account!";
    return {
      id: "welcome",
      role: "bella",
      text: `${greeting} — your BhoomiTayi assistant!${accountInfo}\n\nHere's what I can help you with:\n\n🔍 **Search listings** — houses, land, PG, vehicles & more\n📝 **How to buy/sell/rent** — step-by-step guidance\n💰 **Payment info** — UPI listing fees explained\n📊 **Live stats** — real-time listing data\n\n⚡ **I can also control the app for you!**\n🌙 *\"Switch to dark mode\"*\n🌐 *\"Change language to Kannada\"*\n🔊 *\"Read this page aloud\"*\n♿ *\"Increase font size\"*\n🧭 *\"Take me to houses page\"*`,
      timestamp: new Date(),
      suggestions: [
        "Show all houses",
        "Switch to dark mode",
        "What can you do?",
        "What categories?",
      ],
    };
  }, [userName, userEmail]);

  useEffect(() => {
    setMounted(true);
    setMessages([getWelcomeMessage()]);
  }, [getWelcomeMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // ─── Drag Handlers ──────────────────────────────────
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isOpen) return;
      setIsDragging(true);
      hasDraggedRef.current = false;
      dragStartRef.current = { x: e.clientX, y: e.clientY, posX: position.x, posY: position.y };
      e.preventDefault();
    },
    [isOpen, position]
  );

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDraggedRef.current = true;
      setPosition({ x: dragStartRef.current.posX + dx, y: dragStartRef.current.posY + dy });
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [isDragging]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isOpen) return;
      const touch = e.touches[0];
      setIsDragging(true);
      hasDraggedRef.current = false;
      dragStartRef.current = { x: touch.clientX, y: touch.clientY, posX: position.x, posY: position.y };
    },
    [isOpen, position]
  );

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartRef.current.x;
      const dy = touch.clientY - dragStartRef.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDraggedRef.current = true;
      setPosition({ x: dragStartRef.current.posX + dx, y: dragStartRef.current.posY + dy });
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => { window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onUp); };
  }, [isDragging]);

  // ─── Firebase Queries ───────────────────────────────
  const queryListings = async (
    category?: string,
    txType?: string,
    priceRange?: { min?: number; max?: number },
    locationSearch?: string,
    maxResults = 5
  ): Promise<{ listings: Listing[]; count: number }> => {
    try {
      const listingsRef = collection(db, "listings");
      const constraints = [where("status", "==", "active")];
      if (category) constraints.push(where("category", "==", category));
      if (txType) constraints.push(where("transaction_type", "==", txType));

      // Price filters require orderBy price
      if (priceRange?.min) constraints.push(where("price", ">=", priceRange.min));
      if (priceRange?.max) constraints.push(where("price", "<=", priceRange.max));

      const sortField = (priceRange?.min || priceRange?.max) ? "price" : "created_at";
      const sortDir = (priceRange?.min || priceRange?.max) ? ("asc" as const) : ("desc" as const);

      const q = query(listingsRef, ...constraints, orderBy(sortField, sortDir), limit(maxResults));
      const snapshot = await getDocs(q);
      let listings = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Listing);

      // Client-side location filter (Firestore doesn't support text search)
      if (locationSearch) {
        const loc = locationSearch.toLowerCase();
        const filtered = listings.filter(
          (l) => l.address.toLowerCase().includes(loc) || l.pincode.includes(loc)
        );
        if (filtered.length > 0) listings = filtered;
      }

      // Get total count (without price/location filters for accuracy)
      const countConstraints = [where("status", "==", "active")];
      if (category) countConstraints.push(where("category", "==", category));
      if (txType) countConstraints.push(where("transaction_type", "==", txType));
      const countSnap = await getCountFromServer(query(listingsRef, ...countConstraints));

      return { listings, count: countSnap.data().count };
    } catch (error) {
      console.error("[Bella] Query error:", error);
      return { listings: [], count: 0 };
    }
  };

  const getCategoryCounts = async (): Promise<Record<string, number>> => {
    const cats = ["house", "land", "pg", "commercial", "vehicle", "commodity"];
    const counts: Record<string, number> = {};
    await Promise.all(
      cats.map(async (cat) => {
        try {
          const q = query(collection(db, "listings"), where("category", "==", cat), where("status", "==", "active"));
          const snap = await getCountFromServer(q);
          counts[cat] = snap.data().count;
        } catch { counts[cat] = 0; }
      })
    );
    return counts;
  };

  const getRecentListings = async (count = 5): Promise<Listing[]> => {
    try {
      const q = query(
        collection(db, "listings"),
        where("status", "==", "active"),
        orderBy("created_at", "desc"),
        limit(count)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Listing);
    } catch { return []; }
  };

  const getCheapestInCategory = async (category: string): Promise<Listing[]> => {
    try {
      const q = query(
        collection(db, "listings"),
        where("category", "==", category),
        where("status", "==", "active"),
        orderBy("price", "asc"),
        limit(5)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Listing);
    } catch { return []; }
  };

  // ─── Format Listing Results ─────────────────────────
  const formatListings = (listings: Listing[], category?: string): string => {
    const emoji = category ? CAT_EMOJI[category] || "📋" : "📋";
    return listings
      .map((l, i) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const details = l.details as Record<string, any>;
        let extra = "";
        if (l.category === "house" && details?.bedrooms) extra = ` | ${details.bedrooms} BHK`;
        if (l.category === "house" && details?.area_sqft) extra += ` | ${details.area_sqft} sqft`;
        if (l.category === "land" && details?.area_sqft) extra = ` | ${details.area_sqft} sqft`;
        if (l.category === "vehicle" && details?.brand) extra = ` | ${details.brand} ${details.model || ""}`;
        return `${emoji} ${i + 1}. **[[${l.title}|/listing/${l.id}]]**\n   💰 ${formatPrice(l.price)}${l.transaction_type === "rent" ? "/mo" : ""} | 📍 ${l.address}${extra}`;
      })
      .join("\n\n");
  };

  // ─── Format Listing Detail ─────────────────────────
  const formatListingDetail = (listing: Listing): string => {
    const emoji = CAT_EMOJI[listing.category] || "📋";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = listing.details as Record<string, any>;
    let info = `${emoji} **${listing.title}**\n\n`;
    info += `💰 **Price:** ${formatPrice(listing.price)}${listing.transaction_type === "rent" ? "/mo" : ""}\n`;
    info += `📍 **Location:** ${listing.address} (${listing.pincode})\n`;
    info += `🏷️ **Type:** ${listing.category} — ${listing.transaction_type}\n`;
    if (listing.images.length > 0) info += `📸 **Photos:** ${listing.images.length} image${listing.images.length > 1 ? "s" : ""}\n`;

    if (d) {
      info += "\n📋 **Details:**\n";
      if (listing.category === "house") {
        if (d.bedrooms) info += `   🛏️ ${d.bedrooms} BHK`;
        if (d.bathrooms) info += ` | 🚿 ${d.bathrooms} bath`;
        info += "\n";
        if (d.area_sqft) info += `   📐 ${d.area_sqft} sqft\n`;
        if (d.furnishing) info += `   🪑 ${d.furnishing}\n`;
        if (d.floors) info += `   🏢 ${d.floors} floor${d.floors > 1 ? "s" : ""}\n`;
        if (d.parking) info += `   🅿️ Parking available\n`;
        if (d.year_built) info += `   📅 Built in ${d.year_built}\n`;
        if (d.amenities?.length) info += `   ✨ ${d.amenities.join(", ")}\n`;
      } else if (listing.category === "land") {
        if (d.area_sqft) info += `   📐 ${d.area_sqft} sqft\n`;
        if (d.land_type) info += `   🏷️ ${d.land_type}\n`;
        if (d.facing) info += `   🧭 Facing ${d.facing}\n`;
        if (d.road_width_ft) info += `   🛣️ Road width: ${d.road_width_ft} ft\n`;
        if (d.is_corner_plot) info += `   📐 Corner plot\n`;
        if (d.legal_clearance) info += `   ✅ Legal clearance\n`;
      } else if (listing.category === "pg") {
        if (d.rent_per_month) info += `   💰 Rent: ${formatPrice(d.rent_per_month)}/mo\n`;
        if (d.security_deposit) info += `   🔒 Deposit: ${formatPrice(d.security_deposit)}\n`;
        if (d.gender_preference) info += `   👤 ${d.gender_preference}\n`;
        if (d.occupancy_type) info += `   🛏️ ${d.occupancy_type} occupancy\n`;
        if (d.meals_included) info += `   🍽️ Meals included\n`;
        if (d.wifi) info += `   📶 WiFi\n`;
        if (d.ac) info += `   ❄️ AC\n`;
      } else if (listing.category === "commercial") {
        if (d.commercial_type) info += `   🏢 ${d.commercial_type}\n`;
        if (d.area_sqft) info += `   📐 ${d.area_sqft} sqft\n`;
        if (d.furnishing) info += `   🪑 ${d.furnishing}\n`;
        if (d.power_backup) info += `   ⚡ Power backup\n`;
        if (d.lift) info += `   🛗 Lift available\n`;
      } else if (listing.category === "vehicle") {
        if (d.brand) info += `   🏭 ${d.brand} ${d.model || ""}\n`;
        if (d.year) info += `   📅 Year: ${d.year}\n`;
        if (d.fuel_type) info += `   ⛽ ${d.fuel_type}\n`;
        if (d.transmission) info += `   ⚙️ ${d.transmission}\n`;
        if (d.km_driven) info += `   🛣️ ${d.km_driven.toLocaleString()} km driven\n`;
        if (d.owner_number) info += `   👤 ${d.owner_number}${d.owner_number === 1 ? "st" : d.owner_number === 2 ? "nd" : "rd"} owner\n`;
      } else if (listing.category === "commodity") {
        if (d.commodity_type) info += `   📦 ${d.commodity_type}\n`;
        if (d.brand) info += `   🏭 ${d.brand}\n`;
        if (d.condition) info += `   📋 Condition: ${d.condition}\n`;
        if (d.warranty) info += `   🛡️ Warranty available\n`;
        if (d.age_months) info += `   ⏳ ${d.age_months} months old\n`;
      }
    }

    if (listing.description) {
      info += `\n📝 **Description:**\n${listing.description}\n`;
    }

    info += `\n👉 [[View full listing page|/listing/${listing.id}]]`;
    return info;
  };

  // ─── Action Executor ────────────────────────────────
  const executeAction = useCallback((action: BellaAction) => {
    switch (action.type) {
      case "theme":
        setTheme(action.value || (resolvedTheme === "dark" ? "light" : "dark"));
        break;
      case "language":
        if (action.value) {
          i18n.changeLanguage(action.value);
          localStorage.setItem("portal_lang", action.value);
          document.documentElement.lang = action.value;
        }
        break;
      case "navigate":
        if (action.value) router.push(action.value);
        break;
      case "accessibility": {
        // Dispatch custom event for accessibility toolbar to handle
        window.dispatchEvent(new CustomEvent("bella:accessibility", { detail: action.value }));
        break;
      }
      case "read_aloud":
        window.dispatchEvent(new CustomEvent("bella:read-aloud"));
        break;
    }
  }, [resolvedTheme, setTheme, i18n, router]);

  // ─── Action Detection ─────────────────────────────
  const detectAction = (msg: string): { action: BellaAction; text: string; suggestions?: string[] } | null => {
    const t = msg.toLowerCase().trim();

    // ── Theme toggle ──
    if (/\b(dark\s*mode|switch.*dark|enable.*dark|turn.*dark|go\s*dark|activate.*dark)\b/.test(t)) {
      return {
        action: { type: "theme", value: "dark" },
        text: "🌙 **Done!** Switched to **dark mode**. Easy on the eyes!\n\n💡 Want me to switch back? Just say *\"light mode\"*.",
        suggestions: ["Switch to light mode", "Change language", "Show houses"],
      };
    }
    if (/\b(light\s*mode|switch.*light|enable.*light|turn.*light|go\s*light|activate.*light)\b/.test(t)) {
      return {
        action: { type: "theme", value: "light" },
        text: "☀️ **Done!** Switched to **light mode**. Bright and clear!\n\n💡 Want dark mode? Just say *\"dark mode\"*.",
        suggestions: ["Switch to dark mode", "Change language", "Show houses"],
      };
    }
    if (/\b(toggle\s*theme|switch\s*theme|change\s*theme)\b/.test(t)) {
      const newTheme = resolvedTheme === "dark" ? "light" : "dark";
      return {
        action: { type: "theme", value: newTheme },
        text: `${newTheme === "dark" ? "🌙" : "☀️"} **Done!** Switched to **${newTheme} mode**!`,
        suggestions: ["Change language", "Show houses", "What can you do?"],
      };
    }

    // ── Language change ──
    for (const [name, code] of Object.entries(LANG_DETECT)) {
      const langRegex = new RegExp(`\\b(change|switch|set|convert|translate)\\s*(language\\s*)?(to\\s*)?${name}\\b|\\b${name}\\s*(language|lo|mein|li|la)\\b|\\bchange\\s*to\\s*${name}\\b|\\bswitch\\s*to\\s*${name}\\b`, "i");
      if (langRegex.test(t)) {
        const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === code);
        if (langInfo) {
          return {
            action: { type: "language", value: code },
            text: `🌐 **Done!** Language changed to **${langInfo.label}** (${langInfo.nativeLabel})!\n\nThe entire app is now in ${langInfo.label}. Want to switch to another language? Just tell me!`,
            suggestions: ["Switch to English", "Show houses", "What can you do?"],
          };
        }
      }
    }

    // ── Read aloud ──
    if (/\b(read\s*(this)?\s*(page)?\s*aloud|read\s*out|speak|read\s*to\s*me|read\s*this|voice|text\s*to\s*speech|tts)\b/.test(t)) {
      return {
        action: { type: "read_aloud" },
        text: "🔊 **Reading the page aloud!** I've started the read-aloud feature.\n\nTo stop, say *\"stop reading\"* or click the speaker button in the accessibility toolbar.",
        suggestions: ["Stop reading", "Increase font size", "Show houses"],
      };
    }
    if (/\b(stop\s*read|stop\s*speak|mute|quiet|silence|shut\s*up|stop\s*voice)\b/.test(t)) {
      return {
        action: { type: "read_aloud" },
        text: "🔇 **Stopped!** Read-aloud has been turned off.",
        suggestions: ["Read this page", "Show houses", "What can you do?"],
      };
    }

    // ── Accessibility: Font size ──
    if (/\b(increase|bigger|larger|enlarge|zoom\s*in|big)\s*(font|text|size)?\b/.test(t) && /\b(font|text|size|zoom)\b/.test(t)) {
      return {
        action: { type: "accessibility", value: "font_increase" },
        text: "🔍 **Done!** Font size increased. Text should be larger now!\n\n💡 Say *\"decrease font size\"* to make it smaller, or *\"reset font\"* to go back to normal.",
        suggestions: ["Decrease font size", "Reset font size", "High contrast"],
      };
    }
    if (/\b(decrease|smaller|reduce|shrink|zoom\s*out|small)\s*(font|text|size)?\b/.test(t) && /\b(font|text|size|zoom)\b/.test(t)) {
      return {
        action: { type: "accessibility", value: "font_decrease" },
        text: "🔍 **Done!** Font size decreased. Text should be smaller now!",
        suggestions: ["Increase font size", "Reset font size", "Show houses"],
      };
    }
    if (/\b(reset|normal|default)\s*(font|text|size)\b/.test(t)) {
      return {
        action: { type: "accessibility", value: "font_reset" },
        text: "🔍 **Done!** Font size reset to normal (100%).",
        suggestions: ["Increase font size", "High contrast", "Show houses"],
      };
    }

    // ── Accessibility: High contrast ──
    if (/\b(high\s*contrast|enable.*contrast|turn.*contrast.*on|contrast\s*mode)\b/.test(t)) {
      return {
        action: { type: "accessibility", value: "high_contrast_on" },
        text: "⬛ **Done!** High contrast mode is **ON**. Everything should be more visible now!\n\nSay *\"turn off contrast\"* to disable it.",
        suggestions: ["Turn off contrast", "Increase font size", "Show houses"],
      };
    }
    if (/\b(turn\s*off.*contrast|disable.*contrast|normal\s*contrast|remove.*contrast)\b/.test(t)) {
      return {
        action: { type: "accessibility", value: "high_contrast_off" },
        text: "✅ **Done!** High contrast mode is **OFF**. Back to normal colors.",
        suggestions: ["High contrast on", "Reading guide", "Show houses"],
      };
    }

    // ── Accessibility: Reading guide ──
    if (/\b(reading\s*guide|enable.*guide|turn.*guide.*on|line\s*guide|focus\s*guide)\b/.test(t)) {
      return {
        action: { type: "accessibility", value: "reading_guide_on" },
        text: "📖 **Done!** Reading guide is **ON**. A yellow highlight will follow your mouse to help you read!\n\nSay *\"turn off reading guide\"* to disable it.",
        suggestions: ["Turn off reading guide", "Increase font size", "Show houses"],
      };
    }
    if (/\b(turn\s*off.*guide|disable.*guide|remove.*guide|no\s*guide)\b/.test(t)) {
      return {
        action: { type: "accessibility", value: "reading_guide_off" },
        text: "✅ **Done!** Reading guide is **OFF**.",
        suggestions: ["Reading guide on", "High contrast", "Show houses"],
      };
    }

    // ── Accessibility: Dyslexia font ──
    if (/\b(dyslexia|dyslexic|easy\s*read\s*font)\b/.test(t) && /\b(on|enable|activate|font|turn)\b/.test(t)) {
      return {
        action: { type: "accessibility", value: "dyslexia_on" },
        text: "🔤 **Done!** Dyslexia-friendly font is **ON**. Text is now easier to read!",
        suggestions: ["Turn off dyslexia font", "Increase font size", "Show houses"],
      };
    }
    if (/\b(turn\s*off.*dyslexia|disable.*dyslexia|normal\s*font|remove.*dyslexia)\b/.test(t)) {
      return {
        action: { type: "accessibility", value: "dyslexia_off" },
        text: "✅ **Done!** Dyslexia font is **OFF**. Back to default font.",
        suggestions: ["Dyslexia font on", "Increase font size", "Show houses"],
      };
    }

    // ── Accessibility: Reset all ──
    if (/\b(reset\s*(all)?\s*accessibility|reset\s*all\s*settings|default\s*settings|normal\s*settings)\b/.test(t)) {
      return {
        action: { type: "accessibility", value: "reset_all" },
        text: "♿ **Done!** All accessibility settings have been reset to defaults.",
        suggestions: ["Increase font size", "Dark mode", "Show houses"],
      };
    }

    // ── Navigation ──
    // Order matters: longer/more-specific keys first so "my listings" matches before "list"
    const navMap: [string[], string, string][] = [
      // Dashboard pages
      [["my listing", "my listings", "my properties", "my property", "listed properties"], "/dashboard/my-listings", "My Listings"],
      [["favourite", "favorites", "favourites", "favorite", "saved", "saved listings", "bookmarks", "wishlist"], "/dashboard/favorites", "Favorites"],
      [["inquir", "inquiry", "inquiries", "enquir", "messages", "my messages", "my inquiries"], "/dashboard/inquiries", "Inquiries"],
      [["overview", "dashboard overview", "dashboard home", "dashboard"], "/dashboard", "Dashboard Overview"],
      [["profile", "my profile", "edit profile", "account settings", "my account"], "/dashboard/profile", "Profile"],
      // Category pages
      [["houses", "house", "homes"], "/houses", "Houses"],
      [["land", "plots", "sites"], "/land", "Land"],
      [["pg", "paying guest", "hostel"], "/pg", "PG"],
      [["commercial", "office", "shop"], "/commercial", "Commercial"],
      [["vehicles", "vehicle", "cars", "bikes"], "/vehicles", "Vehicles"],
      [["commodities", "commodity", "electronics", "furniture"], "/commodities", "Commodities"],
      // Other pages
      [["sell", "register service", "list property", "create listing", "post listing", "add listing"], "/sell", "Register Service"],
      [["home", "homepage", "main page", "home page"], "/", "Homepage"],
    ];

    // Flexible trigger: "take me to X", "go to X", "open X", or just "my listings", "favourites" etc.
    const hasNavIntent = /\b(take\s*me|go\s*to|open|navigate|visit|show\s*me|go)\s*(to\s*)?(the\s*)?(my\s*)?/i.test(t);
    const hasDashboardShortcut = /\b(my\s*listing|my\s*properties|favourit|favorite|saved|inquir|enquir|overview|my\s*profile|my\s*account|my\s*message|dashboard|wishlist|bookmark)\b/i.test(t);

    if (hasNavIntent || hasDashboardShortcut) {
      for (const [keywords, path, label] of navMap) {
        if (keywords.some((kw) => t.includes(kw))) {
          return {
            action: { type: "navigate", value: path },
            text: `🧭 **Navigating to ${label}!** Taking you there now...\n\n💡 I can take you anywhere! Just say *"take me to [page name]"*.`,
            suggestions: ["My listings", "My favorites", "My inquiries", "Take me home"],
          };
        }
      }
    }

    return null;
  };

  // ─── Generate Response ──────────────────────────────
  const generateResponse = async (userMessage: string): Promise<{ text: string; suggestions?: string[]; action?: BellaAction }> => {
    const msg = userMessage.toLowerCase().trim();
    const ctx = contextRef.current;
    ctx.turnCount++;

    // ── Greetings ──
    if (/^(hi|hello|hey|yo|sup|namaste|namaskar|vanakkam|namaskara|hola|howdy|good\s*(morning|afternoon|evening))[\s!.]*$/i.test(msg)) {
      const greetName = userName ? ` **${userName}**` : "";
      return {
        text: `Woof! 🐕 Hello${greetName}! Welcome to BhoomiTayi! How can I help you today?`,
        suggestions: ["Show houses", "How to sell?", "Browse categories", "Latest listings"],
      };
    }

    // ── Account / Who am I ──
    if (/who am i|my account|am i logged|which account|my profile|my email/i.test(msg)) {
      if (userEmail) {
        return {
          text: `👤 You're logged in as:\n\n• **Name:** ${userName || "Not set"}\n• **Email:** ${userEmail}\n\nVisit **/dashboard/profile** to update your info!`,
          suggestions: ["My listings", "My favorites", "How to sell?"],
        };
      }
      return {
        text: "👤 You're not currently logged in. Please **log in** or **sign up** to:\n\n• List properties\n• Save favorites\n• Manage inquiries\n• Access your dashboard\n\nGo to **/auth/login** to get started!",
        suggestions: ["How to sign up?", "Show categories", "How to buy?"],
      };
    }

    // ── Thanks / Bye ──
    if (/^(thanks|thank you|thanku|dhanyavad|nandri|shukriya|bye|goodbye|see you|tata)[\s!.]*$/i.test(msg)) {
      return {
        text: msg.includes("bye") || msg.includes("goodbye") || msg.includes("tata") || msg.includes("see you")
          ? "🐕 Bye bye! Come back anytime you need help with BhoomiTayi! Woof! 👋"
          : "🐕 You're welcome! Happy to help! Anything else you'd like to know?",
        suggestions: ["Show latest listings", "Browse categories", "How does it work?"],
      };
    }

    // ── Action Detection (theme, language, navigation, accessibility, read aloud) ──
    const actionResult = detectAction(msg);
    if (actionResult) {
      return { text: actionResult.text, suggestions: actionResult.suggestions, action: actionResult.action };
    }

    // ── Knowledge Base (fuzzy match) ──
    let bestMatch = "";
    let bestScore = 0;
    for (const [key, entry] of Object.entries(KNOWLEDGE)) {
      const score = matchScore(msg, entry.keywords);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = key;
      }
    }

    // Only use knowledge match if score is high enough
    if (bestScore >= 4 && bestMatch) {
      const entry = KNOWLEDGE[bestMatch];
      const suggestions = getSuggestionsForTopic(bestMatch);
      return { text: entry.response, suggestions };
    }

    // ── Price-based queries ──
    const priceRange = parsePrice(msg);
    const category = detectCategory(msg);
    const txType = detectTransactionType(msg);
    const location = extractLocation(msg);

    // Store context for follow-ups
    if (category) ctx.lastCategory = category;
    if (txType) ctx.lastTransactionType = txType;
    if (location) ctx.lastLocation = location;
    if (priceRange) ctx.lastPriceRange = priceRange;

    // ── Cheapest / Budget queries ──
    if ((msg.includes("cheap") || msg.includes("budget") || msg.includes("affordable") || msg.includes("lowest price") || msg.includes("most affordable")) && (category || ctx.lastCategory)) {
      const cat = category || ctx.lastCategory!;
      const listings = await getCheapestInCategory(cat);
      if (listings.length === 0) {
        return {
          text: `${CAT_EMOJI[cat]} No ${CAT_LABEL[cat]?.toLowerCase()} listings found right now. Check back soon!`,
          suggestions: ["Show all categories", "Latest listings", "How to list?"],
        };
      }
      ctx.lastListings = listings;
      return {
        text: `${CAT_EMOJI[cat]} **Most affordable ${CAT_LABEL[cat]}** on BhoomiTayi:\n\n${formatListings(listings, cat)}\n\n💡 Visit **${CAT_ROUTE[cat]}** to see all with price filters!`,
        suggestions: [`${CAT_LABEL[cat]} for rent`, `${CAT_LABEL[cat]} to buy`, "Details of listing 1", "Show stats"],
      };
    }

    // ── Category + Filters query ──
    if (category || priceRange || txType) {
      const cat = category || ctx.lastCategory;
      const tx = txType || (cat ? ctx.lastTransactionType : undefined);
      const price = priceRange || ctx.lastPriceRange;
      const loc = location || ctx.lastLocation;

      const { listings, count } = await queryListings(cat, tx, price, loc);
      const catLabel = cat ? CAT_LABEL[cat] : "listing";
      const emoji = cat ? CAT_EMOJI[cat] : "📋";

      if (count === 0 && listings.length === 0) {
        let noResult = `${emoji} No ${catLabel.toLowerCase()}s found`;
        if (tx) noResult += ` for ${tx}`;
        if (price?.max) noResult += ` under ${formatPrice(price.max)}`;
        if (price?.min) noResult += ` above ${formatPrice(price.min)}`;
        if (loc) noResult += ` in ${loc}`;
        noResult += ".\n\nTry broadening your search or check back later!";
        return {
          text: noResult,
          suggestions: [`All ${catLabel}`, "Show categories", "Latest listings"],
        };
      }

      let header = `${emoji} `;
      if (count > 0) header += `Found **${count} ${catLabel.toLowerCase()}${count > 1 ? "s" : ""}**`;
      if (tx) header += ` for **${tx}**`;
      if (price?.max) header += ` under **${formatPrice(price.max)}**`;
      if (price?.min && !price?.max) header += ` above **${formatPrice(price.min)}**`;
      if (price?.min && price?.max) header = `${emoji} Found **${count}** in range **${formatPrice(price.min)} — ${formatPrice(price.max)}**`;
      if (loc) header += ` in **${loc}**`;
      header += "!";

      if (listings.length > 0) ctx.lastListings = listings;
      const body = listings.length > 0
        ? `\n\n${formatListings(listings, cat || undefined)}`
        : "";
      const footer = cat ? `\n\n👉 Visit **${CAT_ROUTE[cat]}** for full list with filters!` : "";

      const sug: string[] = [];
      if (cat && !tx) sug.push(`${catLabel} for rent`, `${catLabel} to buy`);
      if (!price) sug.push(`Cheapest ${catLabel.toLowerCase()}`);
      if (listings.length > 0) sug.push("Details of listing 1");
      sug.push("Show stats");

      return { text: header + body + footer, suggestions: sug };
    }

    // ── Stats / Count queries ──
    if (/how many|total|count|statistic|stats|number of|listings on/i.test(msg)) {
      const counts = await getCategoryCounts();
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      return {
        text: `📊 **BhoomiTayi Live Stats:**\n\nTotal active listings: **${total}**\n\n${Object.entries(counts)
          .map(([cat, n]) => `${CAT_EMOJI[cat]} ${CAT_LABEL[cat]}: **${n}**`)
          .join("\n")}\n\nNew listings are added every day!`,
        suggestions: ["Show latest listings", "Most affordable houses", "Browse categories"],
      };
    }

    // ── Latest / Recent / New ──
    if (/latest|recent|new|newest|just added|fresh|today/i.test(msg)) {
      const listings = await getRecentListings(5);
      if (listings.length === 0) {
        return { text: "📋 No listings found right now. Check back soon!", suggestions: ["Show categories", "How to list?"] };
      }
      ctx.lastListings = listings;
      return {
        text: `🆕 **Latest Listings on BhoomiTayi:**\n\n${formatListings(listings)}\n\n👉 Browse categories for more!`,
        suggestions: ["Show houses", "Show vehicles", "Details of listing 1", "Show stats"],
      };
    }

    // ── Detail / "Tell me more" queries ──
    const detailMatch = msg.match(/(?:tell\s*(?:me\s*)?more\s*(?:about\s*)?|details?\s*(?:of|about|for)\s*|info\s*(?:on|about)\s*|more\s*info\s*(?:on|about)\s*)(?:listing\s*#?\s*(\d+)|(?:the\s*)?(.+))/i);
    if (detailMatch) {
      if (!ctx.lastListings || ctx.lastListings.length === 0) {
        return {
          text: "🐕 I don't have any previous listings to reference! Ask me to show some listings first, then you can ask for details.\n\nTry: *\"Show houses\"* or *\"Latest listings\"*",
          suggestions: ["Show houses", "Latest listings", "Show categories"],
        };
      }
      const indexStr = detailMatch[1];
      const titleQuery = detailMatch[2]?.trim().toLowerCase();
      let matched: Listing | undefined;

      if (indexStr) {
        const idx = parseInt(indexStr, 10) - 1;
        if (idx >= 0 && idx < ctx.lastListings.length) {
          matched = ctx.lastListings[idx];
        } else {
          return {
            text: `🐕 I only showed ${ctx.lastListings.length} listing${ctx.lastListings.length > 1 ? "s" : ""}. Try *\"details of listing 1\"* through *\"listing ${ctx.lastListings.length}\"*.`,
            suggestions: ctx.lastListings.slice(0, 3).map((_, i) => `Details of listing ${i + 1}`),
          };
        }
      } else if (titleQuery) {
        matched = ctx.lastListings.find((l) => l.title.toLowerCase().includes(titleQuery));
        if (!matched) {
          return {
            text: `🐕 I couldn't find a listing matching *\"${titleQuery}\"* in the results I showed. Try referring by number instead!`,
            suggestions: ctx.lastListings.slice(0, 3).map((_, i) => `Details of listing ${i + 1}`),
          };
        }
      }

      if (matched) {
        return {
          text: formatListingDetail(matched),
          suggestions: ["Show more listings", "Show categories", "How to buy?"],
        };
      }
    }

    // ── "Show me" / "List" / "Get" + anything ──
    if (/^(show|list|get|display|find|search|give|tell)\s/i.test(msg)) {
      // Try to detect what they want
      const cat = detectCategory(msg);
      if (cat) {
        const { listings, count } = await queryListings(cat, detectTransactionType(msg));
        if (count === 0) {
          return { text: `${CAT_EMOJI[cat]} No ${CAT_LABEL[cat]?.toLowerCase()} found right now.`, suggestions: ["Show categories", "Latest listings"] };
        }
        ctx.lastListings = listings;
        return {
          text: `${CAT_EMOJI[cat]} **${CAT_LABEL[cat]}** — ${count} listing${count > 1 ? "s" : ""} available!\n\n${formatListings(listings, cat)}\n\n👉 Visit **${CAT_ROUTE[cat]}** for all!`,
          suggestions: [`Cheapest ${CAT_LABEL[cat]?.toLowerCase()}`, `${CAT_LABEL[cat]} for rent`, "Details of listing 1", "Show stats"],
        };
      }

      // "show all" / "show everything"
      if (/all|everything|every/i.test(msg)) {
        const counts = await getCategoryCounts();
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        return {
          text: `📋 BhoomiTayi has **${total}** active listings across 6 categories!\n\n${Object.entries(counts)
            .map(([cat, n]) => `${CAT_EMOJI[cat]} **${CAT_LABEL[cat]}**: ${n} listings`)
            .join("\n")}\n\nWhich category would you like to explore?`,
          suggestions: ["Show houses", "Show vehicles", "Show land", "Show PG"],
        };
      }
    }

    // ── Comparison / vs queries ──
    if (/\bvs\b|versus|compare|difference between|better/i.test(msg)) {
      return {
        text: "🔍 **Comparing options?** Here's what I suggest:\n\n1️⃣ Browse the category pages to see all listings\n2️⃣ Use **price filters** to match your budget\n3️⃣ **Save favorites** (❤️) to shortlist\n4️⃣ Compare details on each listing page\n5️⃣ Send **inquiries** to multiple sellers\n\nWant me to show listings in a specific category?",
        suggestions: ["Show houses", "Show land", "Show vehicles", "Show stats"],
      };
    }

    // ── Follow-up with context ──
    if (ctx.turnCount > 1 && (msg.includes("more") || msg.includes("other") || msg.includes("another") || msg.includes("else") || msg.includes("also"))) {
      if (ctx.lastCategory) {
        const { listings, count } = await queryListings(ctx.lastCategory, undefined, undefined, undefined, 10);
        const nextBatch = listings.slice(5);
        if (nextBatch.length > 0) {
          ctx.lastListings = nextBatch;
          return {
            text: `${CAT_EMOJI[ctx.lastCategory]} **More ${CAT_LABEL[ctx.lastCategory]}:**\n\n${formatListings(nextBatch, ctx.lastCategory)}\n\nTotal: ${count} available`,
            suggestions: ["Details of listing 1", "Show stats", "Change category", "How to buy?"],
          };
        }
      }
    }

    // ── Fallback: Not about BhoomiTayi ──
    return {
      text: "🐕 Woof! That information is not available. I can only help with **BhoomiTayi** topics:\n\n• 🏠 Finding properties, vehicles, commodities\n• 📝 How to buy, sell, or rent\n• 👤 Account & payment info\n• ✨ App features & settings\n• 📊 Live listing stats & data\n\nTry asking something like: *\"Show houses under 50 lakhs\"* or *\"How do I list my property?\"*",
      suggestions: ["Show categories", "How to sell?", "Latest listings", "Show stats"],
    };
  };

  // ─── Contextual Suggestions ─────────────────────────
  function getSuggestionsForTopic(topic: string): string[] {
    const map: Record<string, string[]> = {
      about: ["Show categories", "How to sell?", "Switch to dark mode"],
      categories: ["Show houses", "Show vehicles", "Show land"],
      how_to_sell: ["Take me to sell page", "Payment info", "My account"],
      how_to_buy: ["Show houses", "Show latest", "Take me to houses"],
      payment: ["How to sell?", "Take me to sell page", "My account"],
      account: ["Take me to dashboard", "My favorites", "Go to profile"],
      languages: ["Change to Kannada", "Change to Hindi", "Change to Tamil"],
      favorites: ["Take me to favorites", "Show houses", "How to buy?"],
      inquiries: ["How to buy?", "Safety tips", "My account"],
      safety: ["Report listing", "How to buy?", "About BhoomiTayi"],
      features: ["Switch to dark mode", "Change language", "Read this page"],
      navigation: ["Take me home", "Go to sell page", "Take me to dashboard"],
      edit_listing: ["Take me to my listings", "How to sell?", "Go to dashboard"],
      bella_info: ["Switch to dark mode", "Change language", "Show houses"],
    };
    return map[topic] || ["Show categories", "Show stats", "What can you do?"];
  }

  // ─── Send Message ───────────────────────────────────
  const handleSend = async (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: msgText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const { text: responseText, suggestions, action } = await generateResponse(msgText);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "bella",
          text: responseText,
          timestamp: new Date(),
          suggestions,
        },
      ]);
      // Execute the action after showing the response
      if (action) {
        setTimeout(() => executeAction(action), 300);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "bella",
          text: "🐕 Woof! Sorry, something went wrong. Please try again!",
          timestamp: new Date(),
          suggestions: ["Show categories", "Show stats"],
        },
      ]);
    }

    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleButtonClick = () => {
    if (!hasDraggedRef.current) setIsOpen(!isOpen);
  };

  const resetChat = () => {
    setMessages([getWelcomeMessage()]);
    contextRef.current = { turnCount: 0 };
  };

  if (!mounted) return null;

  // ─── Render ─────────────────────────────────────────
  return (
    <div
      ref={dragRef}
      className="fixed z-[99998]"
      style={{
        bottom: "calc(6rem + 3.5rem + 8px)",
        right: "1.5rem",
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-24 right-6 w-[340px] sm:w-[400px] max-h-[calc(100vh-7rem)] rounded-2xl border border-zinc-200/80 dark:border-zinc-700/50 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden flex flex-col z-[99999]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-4 py-3 flex items-center gap-3">
              <div className="size-10 rounded-full overflow-hidden border-2 border-white/50 shrink-0">
                <img src="/bella-avatar.jpg" alt="Bella" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-white text-sm">Bella AI Assistant</h3>
                  <Sparkles className="size-3.5 text-yellow-200" />
                </div>
                <p className="text-white/80 text-xs">BhoomiTayi&apos;s friendly helper</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={resetChat}
                  className="size-7 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                  title="Reset chat"
                >
                  <RotateCcw className="size-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="size-7 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                >
                  <Minus className="size-4" />
                </button>
                <button
                  onClick={() => { setIsOpen(false); resetChat(); }}
                  className="size-7 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 min-h-0 max-h-[380px] overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-amber-50/30 to-white dark:from-zinc-900 dark:to-zinc-900">
              {messages.map((m) => (
                <div key={m.id}>
                  <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        m.role === "user"
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-md"
                          : "bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/50 text-foreground rounded-bl-md shadow-sm"
                      }`}
                    >
                      {m.role === "bella" && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="size-4 rounded-full overflow-hidden">
                            <img src="/bella-avatar.jpg" alt="" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">Bella</span>
                        </div>
                      )}
                      <div className="whitespace-pre-line">
                        {m.text.split(/(\*\*.*?\*\*|\*[^*]+\*|\[\[.*?\]\])/).map((part, i) => {
                          if (part.startsWith("**") && part.endsWith("**")) {
                            const inner = part.slice(2, -2);
                            // Check if bold text contains a link
                            const linkMatch = inner.match(/^\[\[(.+?)\|(.+?)\]\]$/);
                            if (linkMatch) {
                              return (
                                <strong key={i}>
                                  <button
                                    onClick={() => router.push(linkMatch[2])}
                                    className="text-amber-600 dark:text-amber-400 underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                                  >
                                    {linkMatch[1]}
                                  </button>
                                </strong>
                              );
                            }
                            return <strong key={i}>{inner}</strong>;
                          }
                          if (part.startsWith("[[") && part.endsWith("]]")) {
                            const linkMatch = part.slice(2, -2).split("|");
                            if (linkMatch.length === 2) {
                              return (
                                <button
                                  key={i}
                                  onClick={() => router.push(linkMatch[1])}
                                  className="text-amber-600 dark:text-amber-400 underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                                >
                                  {linkMatch[0]}
                                </button>
                              );
                            }
                          }
                          if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
                            return <em key={i} className="text-amber-600 dark:text-amber-400 not-italic text-[12px]">{part.slice(1, -1)}</em>;
                          }
                          return <span key={i}>{part}</span>;
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Suggestion Chips */}
                  {m.role === "bella" && m.suggestions && m.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 ml-1">
                      {m.suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSend(s)}
                          disabled={isTyping}
                          className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors disabled:opacity-50"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/50 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="size-4 rounded-full overflow-hidden">
                        <img src="/bella-avatar.jpg" alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex gap-1">
                        <span className="size-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0ms]" />
                        <span className="size-2 rounded-full bg-amber-400 animate-bounce [animation-delay:150ms]" />
                        <span className="size-2 rounded-full bg-amber-400 animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-zinc-200/80 dark:border-zinc-700/50 p-3 bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Bella anything about BhoomiTayi..."
                  disabled={isTyping}
                  className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 border border-transparent focus:border-amber-400 dark:focus:border-amber-500 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500 disabled:opacity-50"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  className="size-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-center hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30"
                >
                  <Send className="size-4" />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
                Bella answers BhoomiTayi questions only | Powered by live data
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Dog Button */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleButtonClick}
        className={`relative size-14 rounded-full overflow-hidden cursor-grab active:cursor-grabbing shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-shadow border-2 ${
          isOpen
            ? "border-amber-500 ring-2 ring-amber-400/50"
            : "border-white dark:border-zinc-700"
        }`}
        style={{ userSelect: "none" }}
      >
        <img
          src="/bella-avatar.jpg"
          alt="Bella AI Assistant"
          className="w-full h-full object-cover pointer-events-none"
          draggable={false}
        />
        <div className="absolute bottom-0 right-0 size-5 rounded-full bg-green-500 border-2 border-white dark:border-zinc-900" />
        {!isOpen && (
          <div className="absolute inset-0 rounded-full border-2 border-amber-400 animate-ping opacity-30 pointer-events-none" />
        )}
      </motion.div>

      {/* Tooltip */}
      {!isOpen && !isDragging && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute bottom-4 right-16 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 shadow-lg whitespace-nowrap pointer-events-none"
        >
          <p className="text-xs font-medium text-foreground">Ask Bella 🐕</p>
          <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-white dark:bg-zinc-800 border-r border-b border-zinc-200 dark:border-zinc-700 rotate-[-45deg]" />
        </motion.div>
      )}
    </div>
  );
}
