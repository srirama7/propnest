"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

// ─── Field-level tips: each field ID → tip text ─────────
interface FieldTip {
  label: string;
  tip: string;
}

// ─── Helper to build tips from translation keys ─────────
function tTips(t: (key: string) => string, keys: [string, string][]): FieldTip[] {
  return keys.map(([labelKey, tipKey]) => ({
    label: t(labelKey),
    tip: t(tipKey),
  }));
}

// ─── Hub /sell page step keys (category-independent) ─────
const HUB_STEP_KEYS: Record<number, [string, string][]> = {
  0: [
    ["tommy.hub_category_label", "tommy.hub_category_tip"],
    ["tommy.hub_transaction_label", "tommy.hub_transaction_tip"],
  ],
  2: [
    ["tommy.hub_address_label", "tommy.hub_address_tip"],
    ["tommy.hub_pincode_label", "tommy.hub_pincode_tip"],
    ["tommy.hub_images_label", "tommy.hub_images_tip"],
  ],
  3: [
    ["tommy.hub_owner_label", "tommy.hub_owner_tip"],
    ["tommy.hub_phone_label", "tommy.hub_phone_tip"],
    ["tommy.hub_email_label", "tommy.hub_email_tip"],
  ],
  4: [
    ["tommy.hub_review_label", "tommy.hub_review_tip"],
  ],
};

// ─── Hub /sell page: category-specific keys for step 1 ──
const HUB_CATEGORY_KEYS: Record<string, [string, string][]> = {
  house: [
    ["form.title", "tommy.hub_category_tip"],
    ["form.description", "tommy.hub_category_tip"],
    ["form.price", "tommy.hub_category_tip"],
    ["form.bedrooms", "tommy.hub_category_tip"],
    ["form.bathrooms", "tommy.hub_category_tip"],
    ["form.area_sqft", "tommy.hub_category_tip"],
    ["form.furnishing", "tommy.hub_category_tip"],
    ["form.floors", "tommy.hub_category_tip"],
    ["form.year_built", "tommy.hub_category_tip"],
    ["form.parking", "tommy.hub_category_tip"],
    ["form.amenities", "tommy.hub_category_tip"],
  ],
  land: [
    ["form.title", "tommy.hub_category_tip"],
    ["form.description", "tommy.hub_category_tip"],
    ["form.price", "tommy.hub_category_tip"],
    ["form.area_sqft", "tommy.hub_category_tip"],
    ["form.land_type", "tommy.hub_category_tip"],
    ["form.facing", "tommy.hub_category_tip"],
    ["form.road_width", "tommy.hub_category_tip"],
    ["form.boundary_wall", "tommy.hub_category_tip"],
    ["form.corner_plot", "tommy.hub_category_tip"],
  ],
  pg: [
    ["form.title", "tommy.hub_category_tip"],
    ["form.description", "tommy.hub_category_tip"],
    ["form.price", "tommy.hub_category_tip"],
    ["form.security_deposit", "tommy.hub_category_tip"],
    ["form.gender_preference", "tommy.hub_category_tip"],
    ["form.occupancy_type", "tommy.hub_category_tip"],
    ["form.meals_included", "tommy.hub_category_tip"],
    ["form.wifi", "tommy.hub_category_tip"],
    ["form.ac", "tommy.hub_category_tip"],
    ["form.attached_bathroom", "tommy.hub_category_tip"],
    ["form.rules", "tommy.hub_category_tip"],
  ],
  commercial: [
    ["form.title", "tommy.hub_category_tip"],
    ["form.description", "tommy.hub_category_tip"],
    ["form.price", "tommy.hub_category_tip"],
    ["form.commercial_type", "tommy.hub_category_tip"],
    ["form.area_sqft", "tommy.hub_category_tip"],
    ["form.furnishing", "tommy.hub_category_tip"],
    ["form.floors", "tommy.hub_category_tip"],
    ["form.parking", "tommy.hub_category_tip"],
    ["form.power_backup", "tommy.hub_category_tip"],
    ["form.lift", "tommy.hub_category_tip"],
  ],
  vehicle: [
    ["form.title", "tommy.hub_category_tip"],
    ["form.description", "tommy.hub_category_tip"],
    ["form.price", "tommy.hub_category_tip"],
    ["form.vehicle_type", "tommy.hub_category_tip"],
    ["form.brand", "tommy.hub_category_tip"],
    ["form.model", "tommy.hub_category_tip"],
    ["form.year", "tommy.hub_category_tip"],
    ["form.fuel_type", "tommy.hub_category_tip"],
    ["form.transmission", "tommy.hub_category_tip"],
    ["form.km_driven", "tommy.hub_category_tip"],
    ["form.owner_number", "tommy.hub_category_tip"],
    ["form.registration_state", "tommy.hub_category_tip"],
    ["form.insurance_valid", "tommy.hub_category_tip"],
  ],
  commodity: [
    ["form.title", "tommy.hub_category_tip"],
    ["form.description", "tommy.hub_category_tip"],
    ["form.price", "tommy.hub_category_tip"],
    ["form.commodity_type", "tommy.hub_category_tip"],
    ["form.brand", "tommy.hub_category_tip"],
    ["form.condition", "tommy.hub_category_tip"],
    ["form.age_months", "tommy.hub_category_tip"],
    ["form.warranty", "tommy.hub_category_tip"],
  ],
};

// ─── Individual sell page step keys ─────────────────────
const SELL_PAGE_KEYS: Record<string, Record<number, [string, string][]>> = {
  "/sell/house": {
    0: [
      ["form.transaction_type", "tommy.hub_transaction_tip"],
      ["form.title", "tommy.hub_category_tip"],
      ["form.description", "tommy.hub_category_tip"],
      ["form.price", "tommy.hub_category_tip"],
    ],
    1: [
      ["form.bedrooms", "tommy.hub_category_tip"],
      ["form.bathrooms", "tommy.hub_category_tip"],
      ["form.area_sqft", "tommy.hub_category_tip"],
      ["form.furnishing", "tommy.hub_category_tip"],
      ["form.floors", "tommy.hub_category_tip"],
      ["form.year_built", "tommy.hub_category_tip"],
      ["form.parking", "tommy.hub_category_tip"],
      ["form.amenities", "tommy.hub_category_tip"],
    ],
    2: [
      ["tommy.hub_address_label", "tommy.hub_address_tip"],
      ["tommy.hub_pincode_label", "tommy.hub_pincode_tip"],
    ],
    3: [
      ["tommy.hub_images_label", "tommy.hub_images_tip"],
    ],
    4: [
      ["tommy.hub_review_label", "tommy.hub_review_tip"],
    ],
  },
  "/sell/land": {
    0: [
      ["form.transaction_type", "tommy.hub_transaction_tip"],
      ["form.title", "tommy.hub_category_tip"],
      ["form.description", "tommy.hub_category_tip"],
      ["form.price", "tommy.hub_category_tip"],
    ],
    1: [
      ["form.area_sqft", "tommy.hub_category_tip"],
      ["form.land_type", "tommy.hub_category_tip"],
    ],
    2: [
      ["tommy.hub_address_label", "tommy.hub_address_tip"],
      ["tommy.hub_pincode_label", "tommy.hub_pincode_tip"],
    ],
    3: [
      ["tommy.hub_images_label", "tommy.hub_images_tip"],
    ],
    4: [
      ["tommy.hub_review_label", "tommy.hub_review_tip"],
    ],
  },
  "/sell/pg": {
    0: [
      ["form.transaction_type", "tommy.hub_transaction_tip"],
      ["form.title", "tommy.hub_category_tip"],
      ["form.description", "tommy.hub_category_tip"],
      ["form.price", "tommy.hub_category_tip"],
    ],
    1: [
      ["form.occupancy_type", "tommy.hub_category_tip"],
      ["form.wifi", "tommy.hub_category_tip"],
    ],
    2: [
      ["tommy.hub_address_label", "tommy.hub_address_tip"],
      ["tommy.hub_pincode_label", "tommy.hub_pincode_tip"],
    ],
    3: [
      ["tommy.hub_images_label", "tommy.hub_images_tip"],
    ],
    4: [
      ["tommy.hub_review_label", "tommy.hub_review_tip"],
    ],
  },
  "/sell/commercial": {
    0: [
      ["form.transaction_type", "tommy.hub_transaction_tip"],
      ["form.title", "tommy.hub_category_tip"],
      ["form.description", "tommy.hub_category_tip"],
      ["form.price", "tommy.hub_category_tip"],
    ],
    1: [
      ["form.commercial_type", "tommy.hub_category_tip"],
      ["form.area_sqft", "tommy.hub_category_tip"],
    ],
    2: [
      ["tommy.hub_address_label", "tommy.hub_address_tip"],
      ["tommy.hub_pincode_label", "tommy.hub_pincode_tip"],
    ],
    3: [
      ["tommy.hub_images_label", "tommy.hub_images_tip"],
    ],
    4: [
      ["tommy.hub_review_label", "tommy.hub_review_tip"],
    ],
  },
};

// ─── General page tip keys ──────────────────────────────
const PAGE_TIP_KEYS: Record<string, [string, string][]> = {
  "/": [
    ["tommy.home_welcome_label", "tommy.home_welcome_tip"],
  ],
  "/sell": [
    ["tommy.sell_category_label", "tommy.sell_category_tip"],
  ],
  "/listings": [
    ["tommy.listings_label", "tommy.listings_tip"],
  ],
  "/auth/login": [
    ["tommy.login_label", "tommy.login_tip"],
  ],
  "/dashboard": [
    ["tommy.dashboard_overview_label", "tommy.dashboard_overview_tip"],
  ],
  "/dashboard/my-listings": [
    ["tommy.dashboard_listings_label", "tommy.dashboard_listings_tip"],
  ],
  "/dashboard/my-listings/edit": [
    ["tommy.dashboard_edit_label", "tommy.dashboard_edit_tip"],
  ],
  "/dashboard/favorites": [
    ["tommy.dashboard_favorites_label", "tommy.dashboard_favorites_tip"],
  ],
  "/dashboard/inquiries": [
    ["tommy.dashboard_inquiries_label", "tommy.dashboard_inquiries_tip"],
  ],
  "/dashboard/profile": [
    ["tommy.dashboard_profile_label", "tommy.dashboard_profile_tip"],
  ],
};

// ─── Category-specific detailed tips (hardcoded, English-only for sell form fields) ──
// These are the detailed per-field tips for the hub /sell page step 1
const HUB_CATEGORY_TIPS: Record<string, FieldTip[]> = {
  house: [
    { label: "Title", tip: "Write a catchy title like \"Beautiful 3BHK in JP Nagar with Garden View\" — it's the first thing buyers see!" },
    { label: "Description", tip: "Describe your property in detail — mention highlights like location benefits, amenities, nearby schools/hospitals." },
    { label: "Price", tip: "Set a competitive price. Check similar listings to get an idea. For rent, enter the monthly amount." },
    { label: "Bedrooms", tip: "How many bedrooms does the house have? Enter a number between 1-20." },
    { label: "Bathrooms", tip: "Count all the bathrooms including attached ones. Enter 1-10." },
    { label: "Area (sq.ft)", tip: "Enter the total built-up area in square feet. You'll find this in your property documents." },
    { label: "Furnishing", tip: "Is it fully furnished, semi-furnished, or unfurnished?" },
    { label: "Floors", tip: "Optional! How many floors/storeys does the building have?" },
    { label: "Year Built", tip: "Optional! When was the property built? Newer properties attract more buyers." },
    { label: "Parking", tip: "Toggle ON if parking space is available. A big plus for buyers!" },
    { label: "Amenities", tip: "Optional! List extras like Gym, Swimming Pool, Garden, Security — separated by commas." },
  ],
  land: [
    { label: "Title", tip: "Example: \"1200 sqft Residential Plot in Yelahanka\" — mention size and location!" },
    { label: "Description", tip: "Describe the land — mention soil type, road access, water availability, nearby landmarks." },
    { label: "Price", tip: "Set the price for the total plot. Check local rates per sqft for reference." },
    { label: "Area", tip: "Enter total area in square feet. 1 guntha = 1089 sqft, 1 acre = 43,560 sqft." },
    { label: "Land Type", tip: "Is it residential, commercial, agricultural, or industrial? This helps buyers filter." },
    { label: "Facing", tip: "Which direction does the plot face? North and East facing are popular choices." },
    { label: "Road Width", tip: "Width of the road adjacent to the plot in feet. Wider roads = better access." },
    { label: "Boundary Wall", tip: "Toggle ON if the plot has a boundary wall/compound." },
    { label: "Corner Plot", tip: "Toggle ON if it's a corner plot — these are usually more valuable!" },
  ],
  pg: [
    { label: "Title", tip: "Example: \"Girls PG near Christ University with AC Rooms\" — mention gender & location!" },
    { label: "Description", tip: "Mention room types, meals included, house rules, timings, and nearby places." },
    { label: "Price", tip: "Enter the monthly rent per person/bed." },
    { label: "Security Deposit", tip: "How much security deposit do you charge? This is usually 1-2 months rent." },
    { label: "Gender Preference", tip: "Is this PG for boys, girls, or any gender? Be specific to attract the right tenants." },
    { label: "Occupancy Type", tip: "Single, double, or triple sharing? Mention what's available." },
    { label: "Meals Included", tip: "Toggle ON if meals are included in the rent." },
    { label: "WiFi", tip: "Toggle ON if WiFi is provided." },
    { label: "AC", tip: "Toggle ON if rooms have air conditioning." },
    { label: "Attached Bathroom", tip: "Toggle ON if rooms have attached bathrooms." },
    { label: "Rules", tip: "Optional! Mention any rules like curfew timings, visitor policies, etc." },
  ],
  commercial: [
    { label: "Title", tip: "Example: \"500 sqft Office Space in MG Road\" — be specific about type and location!" },
    { label: "Description", tip: "Mention floor, lift access, power backup, internet, washroom availability." },
    { label: "Price", tip: "For rent, enter monthly amount. For sale, enter the total price." },
    { label: "Commercial Type", tip: "Office, shop, warehouse, showroom, or co-working? Specify clearly." },
    { label: "Area (sq.ft)", tip: "Enter the usable carpet area in sqft (not super built-up area)." },
    { label: "Furnishing", tip: "Is the space furnished, semi-furnished, or bare shell?" },
    { label: "Floors", tip: "Which floor is the space on? Ground floor shops are premium!" },
    { label: "Parking", tip: "Toggle ON if parking is available for the commercial space." },
    { label: "Power Backup", tip: "Toggle ON if the building has power backup — essential for offices!" },
    { label: "Lift", tip: "Toggle ON if the building has a lift/elevator." },
  ],
  vehicle: [
    { label: "Title", tip: "Example: \"2020 Honda City ZX Petrol — Single Owner\" — mention year, brand, and highlights!" },
    { label: "Description", tip: "Describe the vehicle condition, service history, modifications, and any issues." },
    { label: "Price", tip: "Set a fair price. Check OLX/CarDekho for similar vehicles to compare." },
    { label: "Vehicle Type", tip: "Car, bike, scooter, truck, or other? Select the right type." },
    { label: "Brand", tip: "Enter the manufacturer brand — Honda, Maruti, Hyundai, etc." },
    { label: "Model", tip: "Enter the specific model name — City, Swift, i20, etc." },
    { label: "Year", tip: "Manufacturing year of the vehicle." },
    { label: "Fuel Type", tip: "Petrol, diesel, electric, CNG, or hybrid?" },
    { label: "Transmission", tip: "Manual or automatic? This is a key filter for buyers." },
    { label: "KM Driven", tip: "Total kilometers driven. Check your odometer for the exact reading." },
    { label: "Owner Number", tip: "Are you the 1st, 2nd, or 3rd owner? First owner vehicles sell faster." },
    { label: "Registration State", tip: "Which state is the vehicle registered in? E.g., Karnataka, Maharashtra." },
    { label: "Insurance", tip: "Toggle ON if the vehicle has valid insurance." },
  ],
  commodity: [
    { label: "Title", tip: "Example: \"Samsung 55-inch 4K Smart TV — 1 Year Old\" — mention brand and condition!" },
    { label: "Description", tip: "Describe the item, its condition, any defects, and what's included (box, accessories)." },
    { label: "Price", tip: "Set a fair second-hand price. Usually 40-70% of the original price depending on condition." },
    { label: "Commodity Type", tip: "Electronics, furniture, appliance, or other? Select the right category." },
    { label: "Brand", tip: "Enter the brand name of the item." },
    { label: "Condition", tip: "Is it like new, good, fair, or needs repair? Be honest — it builds trust!" },
    { label: "Age (Months)", tip: "How old is the item in months? Newer items fetch better prices." },
    { label: "Warranty", tip: "Toggle ON if the item still has valid warranty." },
  ],
};

export function TommyGuide() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<number | undefined>(undefined);
  const [currentCategory, setCurrentCategory] = useState<string>("");
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [fields, setFields] = useState<FieldTip[]>([]);

  // Draggable state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const hasDraggedRef = useRef(false);

  // Listen for step changes from listing forms
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setCurrentStep(detail?.step);
      if (detail?.category) setCurrentCategory(detail.category);
      setCurrentFieldIndex(0);
      setIsDismissed(false);
    };
    window.addEventListener("tommy-step-change", handler);
    return () => window.removeEventListener("tommy-step-change", handler);
  }, []);

  // Reset step-based tips when navigating away from sell pages
  useEffect(() => {
    if (!pathname.startsWith("/sell")) {
      setCurrentStep(undefined);
      setCurrentFieldIndex(0);
    }
  }, [pathname]);

  // Get current fields based on page and step — rebuilds when language changes via `t`
  useEffect(() => {
    // Hub sell page (/sell exactly) — use hub tips with category awareness
    if (pathname === "/sell" && currentStep !== undefined) {
      if (currentStep === 1 && currentCategory && HUB_CATEGORY_TIPS[currentCategory]) {
        setFields(HUB_CATEGORY_TIPS[currentCategory]);
      } else if (HUB_STEP_KEYS[currentStep]) {
        setFields(tTips(t, HUB_STEP_KEYS[currentStep]));
      } else {
        setFields([]);
      }
    } else if (pathname.startsWith("/sell/") && SELL_PAGE_KEYS[pathname] && currentStep !== undefined) {
      // Individual sell pages (/sell/house, etc.)
      const stepKeys = SELL_PAGE_KEYS[pathname][currentStep];
      if (stepKeys) {
        setFields(tTips(t, stepKeys));
      } else {
        setFields([]);
      }
    } else {
      // General page tips (dashboard, home, listings, login, etc.)
      const keys = PAGE_TIP_KEYS[pathname];
      if (keys) {
        setFields(tTips(t, keys));
      } else {
        setFields([]);
      }
    }
    setCurrentFieldIndex(0);
    setIsDismissed(false);
  }, [pathname, currentStep, currentCategory, t]);

  // Show Tommy with delay when fields change
  useEffect(() => {
    if (fields.length > 0 && !isDismissed) {
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [fields, isDismissed]);

  // Auto-advance through fields every 8 seconds
  useEffect(() => {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    if (!isVisible || isDismissed || fields.length <= 1) return;

    autoAdvanceRef.current = setTimeout(() => {
      setCurrentFieldIndex((prev) => {
        const next = prev + 1;
        if (next >= fields.length) {
          setIsVisible(false);
          return 0;
        }
        return next;
      });
    }, 8000);

    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, [isVisible, isDismissed, currentFieldIndex, fields.length]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ─── Drag Handlers ──────────────────────────────────
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      hasDraggedRef.current = false;
      dragStartRef.current = { x: e.clientX, y: e.clientY, posX: position.x, posY: position.y };
      e.preventDefault();
    },
    [position]
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
      const touch = e.touches[0];
      setIsDragging(true);
      hasDraggedRef.current = false;
      dragStartRef.current = { x: touch.clientX, y: touch.clientY, posX: position.x, posY: position.y };
    },
    [position]
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

  const handleButtonClick = () => {
    if (hasDraggedRef.current) return;
    if (isVisible) {
      setIsVisible(false);
      setIsDismissed(true);
    } else if (fields.length > 0) {
      setCurrentFieldIndex(0);
      setIsVisible(true);
      setIsDismissed(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
  };

  const handleNext = () => {
    if (currentFieldIndex < fields.length - 1) {
      setCurrentFieldIndex((prev) => prev + 1);
    } else {
      setIsVisible(false);
    }
  };

  const handlePrev = () => {
    if (currentFieldIndex > 0) {
      setCurrentFieldIndex((prev) => prev - 1);
    }
  };

  if (!mounted) return null;

  const currentField = fields[currentFieldIndex];

  return (
    <div
      className="fixed z-[99997]"
      style={{
        left: "1.5rem",
        bottom: "1.5rem",
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      <div className="relative">
        <AnimatePresence mode="wait">
          {isVisible && currentField && (
            <motion.div
              key={`${currentStep}-${currentFieldIndex}`}
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute bottom-20 left-0 w-[27rem] rounded-2xl border border-blue-200/80 dark:border-blue-800/50 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 px-4 py-3 flex items-center gap-2.5">
                <div className="size-8 rounded-full overflow-hidden border-2 border-white/50 shrink-0">
                  <img src="/tommy-avatar.png" alt="Tommy" className="w-full h-full object-cover" />
                </div>
                <span className="font-bold text-white text-sm flex-1">{t("tommy.says")}</span>
                <span className="text-white/70 text-xs">
                  {currentFieldIndex + 1}/{fields.length}
                </span>
                <button
                  onClick={handleDismiss}
                  className="size-6 rounded flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Tip Content */}
              <div className="px-4 py-3">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="size-6 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">
                    {currentFieldIndex + 1}
                  </span>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {currentField.label}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed ml-8">
                  {currentField.tip}
                </p>
              </div>

              {/* Navigation */}
              {fields.length > 1 && (
                <div className="px-4 pb-3 flex items-center justify-between">
                  <button
                    onClick={handlePrev}
                    disabled={currentFieldIndex === 0}
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-30"
                  >
                    {t("tommy.prev")}
                  </button>
                  <div className="flex gap-1.5">
                    {fields.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentFieldIndex(i)}
                        className={`size-2 rounded-full transition-colors ${
                          i === currentFieldIndex
                            ? "bg-blue-500"
                            : "bg-zinc-300 dark:bg-zinc-600"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleNext}
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    {currentFieldIndex === fields.length - 1 ? t("tommy.done") : t("tommy.next")}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tommy avatar button — draggable */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={handleButtonClick}
          className={`relative size-16 rounded-full overflow-hidden cursor-grab active:cursor-grabbing shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-shadow border-2 ${
            isVisible
              ? "border-blue-500 ring-2 ring-blue-400/50"
              : "border-white dark:border-zinc-700"
          }`}
          style={{ userSelect: "none" }}
        >
          <img
            src="/tommy-avatar.png"
            alt="Tommy Guide"
            className="w-full h-full object-cover pointer-events-none"
            draggable={false}
          />
          {/* Blue dot when tips available but hidden */}
          {!isVisible && fields.length > 0 && (
            <div className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-blue-500 border-2 border-white dark:border-zinc-900 animate-pulse" />
          )}
        </motion.div>

        {/* "Click me" tooltip on first appearance */}
        {!isVisible && fields.length > 0 && !isDismissed && !isDragging && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="absolute bottom-4 left-[4.5rem] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2.5 py-1 shadow-lg whitespace-nowrap pointer-events-none"
          >
            <p className="text-[10px] font-medium text-foreground">{t("tommy.click_hint")}</p>
            <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-white dark:bg-zinc-800 border-l border-b border-zinc-200 dark:border-zinc-700 rotate-45" />
          </motion.div>
        )}
      </div>
    </div>
  );
}
