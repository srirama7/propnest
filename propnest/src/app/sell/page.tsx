"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Home,
  Mountain,
  Bed,
  Building2,
  Car,
  Package,
  Upload,
  X,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ImageIcon,
  User,
  Phone,
  Mail,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/lib/store";
import { db, storage } from "@/lib/firebase/config";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { validateImage, validateImageCount } from "@/lib/image-upload";
import { PaymentGateway } from "@/components/listings/upi-payment-dialog";
import { PageSettings } from "@/components/layout/page-settings";
import {
  FURNISHING_OPTIONS,
  LAND_TYPES,
  FACING_OPTIONS,
  GENDER_OPTIONS,
  OCCUPANCY_OPTIONS,
  COMMERCIAL_TYPES,
  VEHICLE_TYPES,
  FUEL_TYPES,
  TRANSMISSION_TYPES,
  COMMODITY_TYPES,
  CONDITION_OPTIONS,
  INDIAN_STATES,
} from "@/lib/constants";

type PropertyCategory = "house" | "land" | "pg" | "commercial" | "vehicle" | "commodity";
type TransactionType = "sell" | "rent" | "commercial_lease";

const CATEGORY_OPTIONS = [
  { value: "house" as const, label: "House / Apartment", Icon: Home, emoji: "🏡" },
  { value: "land" as const, label: "Land / Plot", Icon: Mountain, emoji: "🌍" },
  { value: "pg" as const, label: "PG / Hostel", Icon: Bed, emoji: "🛏️" },
  { value: "commercial" as const, label: "Commercial", Icon: Building2, emoji: "🏢" },
  { value: "vehicle" as const, label: "Vehicle", Icon: Car, emoji: "🚗" },
  { value: "commodity" as const, label: "Other Commodity", Icon: Package, emoji: "📦" },
];

const TRANSACTION_OPTIONS: Record<PropertyCategory, { value: TransactionType; label: string }[]> = {
  house: [
    { value: "sell", label: "Sell" },
    { value: "rent", label: "Rent" },
  ],
  land: [
    { value: "sell", label: "Sell" },
  ],
  pg: [
    { value: "rent", label: "Rent" },
  ],
  commercial: [
    { value: "sell", label: "Sell" },
    { value: "rent", label: "Rent" },
    { value: "commercial_lease", label: "Lease" },
  ],
  vehicle: [
    { value: "sell", label: "Sell" },
  ],
  commodity: [
    { value: "sell", label: "Sell" },
  ],
};

const STEPS = [
  "Service Type",
  "Service Details",
  "Location & Images",
  "Personal Details",
  "Preview & Submit",
];

export default function SellPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>}>
      <SellPageContent />
    </Suspense>
  );
}

function SellPageContent() {
  const { t } = useTranslation();
  const TRANSLATED_STEPS = [
    t("sell_page.step_service_type"),
    t("sell_page.step_service_details"),
    t("sell_page.step_location_images"),
    t("sell_page.step_personal_details"),
    t("sell_page.step_preview_submit"),
  ];
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const loading = useAuthStore((s) => s.loading);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setRedirecting(true);
      router.replace("/auth/login?redirectTo=/sell");
    }
  }, [user, loading, router]);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [pendingListingData, setPendingListingData] = useState<Record<string, unknown> | null>(null);

  // Step 1: Service Type
  const [category, setCategory] = useState<PropertyCategory | "">("");
  const [transactionType, setTransactionType] = useState<TransactionType | "">("");

  // Step 2: Service Details (varies by category)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">("");
  // House-specific
  const [bedrooms, setBedrooms] = useState<number | "">("");
  const [bathrooms, setBathrooms] = useState<number | "">("");
  const [areaSqft, setAreaSqft] = useState<number | "">("");
  const [furnishing, setFurnishing] = useState("");
  const [floors, setFloors] = useState<number | "">("");
  const [parking, setParking] = useState(false);
  const [yearBuilt, setYearBuilt] = useState<number | "">("");
  const [amenities, setAmenities] = useState("");
  // Land-specific
  const [landType, setLandType] = useState("");
  const [facing, setFacing] = useState("");
  const [roadWidthFt, setRoadWidthFt] = useState<number | "">("");
  const [boundaryWall, setBoundaryWall] = useState(false);
  const [isCornerPlot, setIsCornerPlot] = useState(false);
  // PG-specific
  const [securityDeposit, setSecurityDeposit] = useState<number | "">("");
  const [genderPreference, setGenderPreference] = useState("");
  const [occupancyType, setOccupancyType] = useState("");
  const [mealsIncluded, setMealsIncluded] = useState(false);
  const [wifi, setWifi] = useState(false);
  const [ac, setAc] = useState(false);
  const [attachedBathroom, setAttachedBathroom] = useState(false);
  const [pgRules, setPgRules] = useState("");
  // Commercial-specific
  const [commercialType, setCommercialType] = useState("");
  const [powerBackup, setPowerBackup] = useState(false);
  const [lift, setLift] = useState(false);
  // Vehicle-specific
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState<number | "">("");
  const [fuelType, setFuelType] = useState("");
  const [transmission, setTransmission] = useState("");
  const [kmDriven, setKmDriven] = useState<number | "">("");
  const [ownerNumber, setOwnerNumber] = useState<number | "">("");
  const [registrationState, setRegistrationState] = useState("");
  const [insuranceValid, setInsuranceValid] = useState(false);
  // Commodity-specific
  const [commodityType, setCommodityType] = useState("");
  const [commodityBrand, setCommodityBrand] = useState("");
  const [commodityCondition, setCommodityCondition] = useState("");
  const [warranty, setWarranty] = useState(false);
  const [ageMonths, setAgeMonths] = useState<number | "">("");

  // Step 3: Location
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");

  // Step 4: Personal Details
  const [ownerName, setOwnerName] = useState(profile?.full_name || "");
  const [ownerPhone, setOwnerPhone] = useState(profile?.phone || "");
  const [ownerEmail, setOwnerEmail] = useState(user?.email || "");

  // Dispatch tommy-step-change for guide tips
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("tommy-step-change", { detail: { step, category } }));
  }, [step, category]);

  // Update personal details when profile loads
  useEffect(() => {
    if (profile?.full_name && !ownerName) setOwnerName(profile.full_name);
    if (profile?.phone && !ownerPhone) setOwnerPhone(profile.phone);
    if (user?.email && !ownerEmail) setOwnerEmail(user.email);
  }, [profile, user, ownerName, ownerPhone, ownerEmail]);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const countError = validateImageCount(images.length, files.length);
    if (countError) {
      toast.error(countError);
      return;
    }

    const validFiles: File[] = [];
    for (const file of files) {
      const error = validateImage(file);
      if (error) {
        toast.error(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length > 0) {
      const newPreviews = validFiles.map((f) => URL.createObjectURL(f));
      setImages((prev) => [...prev, ...validFiles]);
      setPreviews((prev) => [...prev, ...newPreviews]);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(previews[index]);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const countError = validateImageCount(images.length, files.length);
    if (countError) {
      toast.error(countError);
      return;
    }

    const validFiles: File[] = [];
    for (const file of files) {
      const error = validateImage(file);
      if (error) {
        toast.error(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length > 0) {
      const newPreviews = validFiles.map((f) => URL.createObjectURL(f));
      setImages((prev) => [...prev, ...validFiles]);
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  }

  function validateStep(): boolean {
    switch (step) {
      case 0:
        if (!category) { toast.error(t("sell_page.select_category_error")); return false; }
        if (!transactionType) { toast.error(t("sell_page.select_transaction_error")); return false; }
        return true;
      case 1:
        if (!title.trim()) { toast.error(t("sell_page.enter_title_error")); return false; }
        if (title.length > 120) { toast.error(t("sell_page.title_max_error")); return false; }
        if (!description.trim()) { toast.error(t("sell_page.enter_description_error")); return false; }
        if (!price || Number(price) <= 0) { toast.error(t("sell_page.enter_valid_price_error")); return false; }
        if (category === "house") {
          if (!bedrooms || Number(bedrooms) < 1) { toast.error(t("sell_page.enter_bedrooms_error")); return false; }
          if (!bathrooms || Number(bathrooms) < 1) { toast.error(t("sell_page.enter_bathrooms_error")); return false; }
          if (!areaSqft || Number(areaSqft) <= 0) { toast.error(t("sell_page.enter_area_error")); return false; }
          if (!furnishing) { toast.error(t("sell_page.select_furnishing_error")); return false; }
        }
        if (category === "land") {
          if (!areaSqft || Number(areaSqft) <= 0) { toast.error(t("sell_page.enter_area_error")); return false; }
          if (!landType) { toast.error(t("sell_page.select_land_type_error")); return false; }
        }
        if (category === "pg") {
          if (!genderPreference) { toast.error(t("sell_page.select_gender_error")); return false; }
          if (!occupancyType) { toast.error(t("sell_page.select_occupancy_error")); return false; }
        }
        if (category === "commercial") {
          if (!commercialType) { toast.error(t("sell_page.select_commercial_error")); return false; }
          if (!areaSqft || Number(areaSqft) <= 0) { toast.error(t("sell_page.enter_area_error")); return false; }
        }
        if (category === "vehicle") {
          if (!vehicleType) { toast.error(t("sell_page.select_vehicle_error")); return false; }
          if (!vehicleBrand.trim()) { toast.error(t("sell_page.enter_brand_error")); return false; }
          if (!vehicleModel.trim()) { toast.error(t("sell_page.enter_model_error")); return false; }
          if (!vehicleYear || Number(vehicleYear) < 1900) { toast.error(t("sell_page.enter_year_error")); return false; }
        }
        if (category === "commodity") {
          if (!commodityType) { toast.error(t("sell_page.select_commodity_error")); return false; }
          if (!commodityCondition) { toast.error(t("sell_page.select_condition_error")); return false; }
        }
        return true;
      case 2:
        if (!address.trim()) { toast.error(t("sell_page.enter_address_error")); return false; }
        if (!pincode.trim() || !/^\d{6}$/.test(pincode)) { toast.error(t("sell_page.enter_pincode_error")); return false; }
        return true;
      case 3:
        if (!ownerName.trim()) { toast.error(t("sell_page.enter_name_error")); return false; }
        if (!ownerPhone.trim() || !/^\d{10}$/.test(ownerPhone)) { toast.error(t("sell_page.enter_phone_error")); return false; }
        if (!ownerEmail.trim()) { toast.error(t("sell_page.enter_email_error")); return false; }
        return true;
      default:
        return true;
    }
  }

  function handleNext() {
    if (validateStep()) setStep((prev) => Math.min(prev + 1, TRANSLATED_STEPS.length - 1));
  }

  function handlePrevious() {
    setStep((prev) => Math.max(prev - 1, 0));
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Remove undefined values from an object (Firestore rejects undefined)
  function cleanObject(obj: Record<string, unknown>): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) cleaned[key] = value;
    }
    return cleaned;
  }

  async function handleSubmit() {
    if (!user) {
      toast.error(t("sell_page.login_error"));
      return;
    }

    setSubmitting(true);

    try {
      // Upload images to Firebase Storage
      const imageUrls: string[] = [];
      for (const file of images) {
        const storageRef = ref(storage, `listings/${user.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        imageUrls.push(url);
      }

      // Build category-specific details
      let details: Record<string, unknown> = {};

      if (category === "house") {
        details = cleanObject({
          bedrooms: Number(bedrooms),
          bathrooms: Number(bathrooms),
          area_sqft: Number(areaSqft),
          furnishing,
          floors: floors ? Number(floors) : undefined,
          parking,
          year_built: yearBuilt ? Number(yearBuilt) : undefined,
          amenities: amenities ? amenities.split(",").map((a) => a.trim()).filter(Boolean) : undefined,
        });
      } else if (category === "land") {
        details = cleanObject({
          area_sqft: Number(areaSqft),
          land_type: landType,
          facing: facing || undefined,
          road_width_ft: roadWidthFt ? Number(roadWidthFt) : undefined,
          boundary_wall: boundaryWall,
          is_corner_plot: isCornerPlot,
        });
      } else if (category === "pg") {
        details = cleanObject({
          rent_per_month: Number(price),
          security_deposit: securityDeposit ? Number(securityDeposit) : undefined,
          gender_preference: genderPreference,
          occupancy_type: occupancyType,
          meals_included: mealsIncluded,
          wifi,
          ac,
          attached_bathroom: attachedBathroom,
          rules: pgRules || undefined,
        });
      } else if (category === "commercial") {
        details = cleanObject({
          commercial_type: commercialType,
          area_sqft: Number(areaSqft),
          furnishing: furnishing || undefined,
          floors: floors ? Number(floors) : undefined,
          parking,
          power_backup: powerBackup,
          lift,
        });
      } else if (category === "vehicle") {
        details = cleanObject({
          vehicle_type: vehicleType,
          brand: vehicleBrand.trim(),
          model: vehicleModel.trim(),
          year: Number(vehicleYear),
          fuel_type: fuelType || undefined,
          transmission: transmission || undefined,
          km_driven: kmDriven ? Number(kmDriven) : undefined,
          owner_number: ownerNumber ? Number(ownerNumber) : undefined,
          registration_state: registrationState || undefined,
          insurance_valid: insuranceValid,
        });
      } else if (category === "commodity") {
        details = cleanObject({
          commodity_type: commodityType,
          brand: commodityBrand.trim() || undefined,
          condition: commodityCondition,
          warranty,
          age_months: ageMonths ? Number(ageMonths) : undefined,
        });
      }

      // Map transaction type for storage
      const dbTransactionType = transactionType === "commercial_lease" ? "rent" : transactionType;

      // Store listing data and show payment dialog instead of saving directly
      setPendingListingData({
        user_id: user.uid,
        category,
        transaction_type: dbTransactionType,
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        address: address.trim(),
        pincode: pincode.trim(),
        images: imageUrls,
        details,
        owner_name: ownerName.trim(),
        owner_phone: ownerPhone.trim(),
        owner_email: ownerEmail.trim(),
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      setShowPaymentDialog(true);
    } catch (err) {
      console.error("Submit error:", err);
      toast.error(err instanceof Error ? err.message : t("sell_page.failed_create"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePaymentConfirmed(proof: { upiTransactionId: string; screenshotFile: File | null }) {
    if (!pendingListingData || !user) return;

    setSubmitting(true);
    try {
      // Upload payment screenshot to Firebase Storage
      let paymentScreenshotUrl = "";
      if (proof.screenshotFile) {
        const screenshotRef = ref(storage, `listings/${user.uid}/payment_${Date.now()}_${proof.screenshotFile.name}`);
        await uploadBytes(screenshotRef, proof.screenshotFile);
        paymentScreenshotUrl = await getDownloadURL(screenshotRef);
      }

      await addDoc(collection(db, "listings"), {
        ...pendingListingData,
        payment_status: "pending",
        status: "pending_payment",
        payment_ref: proof.upiTransactionId,
        payment_screenshot: paymentScreenshotUrl,
      });

      setShowPaymentDialog(false);
      setPendingListingData(null);
      toast.success(t("sell_page.listing_submitted"));
      router.push("/dashboard/my-listings");
    } catch (err) {
      console.error("Submit error:", err);
      toast.error(err instanceof Error ? err.message : t("sell_page.failed_create"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">{t("sell_page.loading")}</p>
        </div>
      </main>
    );
  }

  if (!user || redirecting) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <div className="size-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">{t("sell_page.login_required")}</p>
          <p className="text-sm text-muted-foreground">{t("sell_page.redirecting")}</p>
        </div>
      </main>
    );
  }

  const priceLabel = transactionType === "rent" || transactionType === "commercial_lease"
    ? t("sell_page.rent_per_month_inr")
    : t("sell_page.price_inr");

  return (
    <main className="min-h-screen bg-background">
      {/* Page Hero */}
      <div className="relative overflow-hidden border-b border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-br from-green-50 via-emerald-50/50 to-background dark:from-green-950/30 dark:via-emerald-950/20 dark:to-background">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 right-1/4 h-72 w-72 rounded-full bg-green-200/20 dark:bg-green-800/10 blur-3xl" />
          <div className="absolute -bottom-20 left-1/4 h-60 w-60 rounded-full bg-emerald-200/20 dark:bg-emerald-800/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-green-50 dark:bg-green-950/40 px-4 py-1.5 text-sm font-medium text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/50 mb-4">
            <Sparkles className="size-4" />
            {t("sell_page.for_providers")}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-2">
            {t("sell_page.register_title_1")}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600">
              {t("sell_page.register_title_2")}
            </span>
          </h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            {t("sell_page.register_subtitle")}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {TRANSLATED_STEPS.map((label, i) => (
              <div key={label} className="flex flex-col items-center flex-1">
                <div
                  className={`flex items-center justify-center size-9 rounded-full text-sm font-semibold transition-colors ${
                    i < step
                      ? "bg-green-600 text-white"
                      : i === step
                        ? "bg-green-600 text-white ring-4 ring-green-100 dark:ring-green-900"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <CheckCircle2 className="size-5" /> : i + 1}
                </div>
                <span className="hidden sm:block text-xs mt-1.5 text-muted-foreground text-center max-w-[80px]">
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div className="w-full bg-muted rounded-full h-2 mt-4">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / TRANSLATED_STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Service Type */}
        {step === 0 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>{t("sell_page.what_type")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>{t("sell_page.service_category")}</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {CATEGORY_OPTIONS.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => {
                          setCategory(cat.value);
                          setTransactionType("");
                        }}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                          category === cat.value
                            ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                        }`}
                      >
                        <cat.Icon className={`size-6 ${category === cat.value ? "text-green-600" : "text-muted-foreground"}`} />
                        <div>
                          <span className="text-sm font-medium">{cat.value === "house" ? t("sell_page.house_apartment") : cat.value === "land" ? t("sell_page.land_plot") : cat.value === "pg" ? t("sell_page.pg_hostel") : t(`listing_card.category_${cat.value}`)}</span>
                          <span className="ml-1.5">{cat.emoji}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {category && (
                  <div className="space-y-3">
                    <Label>{t("sell_page.what_to_do")}</Label>
                    <div className="flex flex-wrap gap-3">
                      {TRANSACTION_OPTIONS[category].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setTransactionType(opt.value)}
                          className={`px-6 py-3 rounded-xl border-2 font-medium transition-all ${
                            transactionType === opt.value
                              ? "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                              : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-muted-foreground"
                          }`}
                        >
                          {opt.value === "commercial_lease" ? t("sell_page.lease") : t(`listing_card.transaction_${opt.value}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Service Details */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>{t("sell_page.service_details")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="title">{t("form.title")}</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder={t("sell_page.title_placeholder")} />
                  <p className="text-xs text-muted-foreground">{title.length}/120</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t("form.description")}</Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} rows={4} placeholder={t("sell_page.description_placeholder")} />
                  <p className="text-xs text-muted-foreground">{description.length}/2000</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">{priceLabel}</Label>
                  <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : "")} min={0} placeholder={t("sell_page.enter_amount")} />
                </div>

                {/* House-specific fields */}
                {category === "house" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bedrooms">{t("form.bedrooms")}</Label>
                        <Input id="bedrooms" type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value ? Number(e.target.value) : "")} min={1} max={20} placeholder="1-20" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bathrooms">{t("form.bathrooms")}</Label>
                        <Input id="bathrooms" type="number" value={bathrooms} onChange={(e) => setBathrooms(e.target.value ? Number(e.target.value) : "")} min={1} max={10} placeholder="1-10" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="area">{t("form.area_sqft")}</Label>
                      <Input id="area" type="number" value={areaSqft} onChange={(e) => setAreaSqft(e.target.value ? Number(e.target.value) : "")} min={1} placeholder={t("sell_page.enter_area")} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("form.furnishing")}</Label>
                      <Select value={furnishing} onValueChange={setFurnishing}>
                        <SelectTrigger><SelectValue placeholder={t("sell_page.select_furnishing")} /></SelectTrigger>
                        <SelectContent>
                          {FURNISHING_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="floors">{t("form.floors")}</Label>
                        <Input id="floors" type="number" value={floors} onChange={(e) => setFloors(e.target.value ? Number(e.target.value) : "")} min={1} placeholder={t("sell_page.optional")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="yearBuilt">{t("form.year_built")}</Label>
                        <Input id="yearBuilt" type="number" value={yearBuilt} onChange={(e) => setYearBuilt(e.target.value ? Number(e.target.value) : "")} min={1900} max={new Date().getFullYear()} placeholder="e.g. 2020" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch id="parking" checked={parking} onCheckedChange={setParking} />
                      <Label htmlFor="parking">{t("sell_page.parking_available")}</Label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amenities">{t("form.amenities")}</Label>
                      <Input id="amenities" value={amenities} onChange={(e) => setAmenities(e.target.value)} placeholder={t("sell_page.amenities_placeholder")} />
                    </div>
                  </>
                )}

                {/* Land-specific fields */}
                {category === "land" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="landArea">{t("form.area_sqft")}</Label>
                      <Input id="landArea" type="number" value={areaSqft} onChange={(e) => setAreaSqft(e.target.value ? Number(e.target.value) : "")} min={1} placeholder={t("sell_page.enter_area")} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("form.land_type")}</Label>
                      <Select value={landType} onValueChange={setLandType}>
                        <SelectTrigger><SelectValue placeholder={t("sell_page.select_land_type")} /></SelectTrigger>
                        <SelectContent>
                          {LAND_TYPES.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t("form.facing")}</Label>
                        <Select value={facing} onValueChange={setFacing}>
                          <SelectTrigger><SelectValue placeholder={t("sell_page.optional")} /></SelectTrigger>
                          <SelectContent>
                            {FACING_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="roadWidth">{t("form.road_width")}</Label>
                        <Input id="roadWidth" type="number" value={roadWidthFt} onChange={(e) => setRoadWidthFt(e.target.value ? Number(e.target.value) : "")} min={1} placeholder={t("sell_page.optional")} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center gap-3">
                        <Switch id="boundaryWall" checked={boundaryWall} onCheckedChange={setBoundaryWall} />
                        <Label htmlFor="boundaryWall">{t("form.boundary_wall")}</Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch id="cornerPlot" checked={isCornerPlot} onCheckedChange={setIsCornerPlot} />
                        <Label htmlFor="cornerPlot">{t("form.corner_plot")}</Label>
                      </div>
                    </div>
                  </>
                )}

                {/* PG-specific fields */}
                {category === "pg" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="securityDeposit">{t("sell_page.security_deposit_inr")}</Label>
                      <Input id="securityDeposit" type="number" value={securityDeposit} onChange={(e) => setSecurityDeposit(e.target.value ? Number(e.target.value) : "")} min={0} placeholder={t("sell_page.optional")} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t("form.gender_preference")}</Label>
                        <Select value={genderPreference} onValueChange={setGenderPreference}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {GENDER_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t("form.occupancy_type")}</Label>
                        <Select value={occupancyType} onValueChange={setOccupancyType}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {OCCUPANCY_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center gap-3">
                        <Switch id="meals" checked={mealsIncluded} onCheckedChange={setMealsIncluded} />
                        <Label htmlFor="meals">{t("form.meals_included")}</Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch id="wifi" checked={wifi} onCheckedChange={setWifi} />
                        <Label htmlFor="wifi">{t("form.wifi")}</Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch id="ac" checked={ac} onCheckedChange={setAc} />
                        <Label htmlFor="ac">{t("form.ac")}</Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch id="attachedBath" checked={attachedBathroom} onCheckedChange={setAttachedBathroom} />
                        <Label htmlFor="attachedBath">{t("form.attached_bathroom")}</Label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pgRules">{t("sell_page.house_rules")}</Label>
                      <Textarea id="pgRules" value={pgRules} onChange={(e) => setPgRules(e.target.value)} rows={3} placeholder={t("sell_page.house_rules_placeholder")} />
                    </div>
                  </>
                )}

                {/* Commercial-specific fields */}
                {category === "commercial" && (
                  <>
                    <div className="space-y-2">
                      <Label>{t("form.commercial_type")}</Label>
                      <Select value={commercialType} onValueChange={setCommercialType}>
                        <SelectTrigger><SelectValue placeholder={t("sell_page.select_type")} /></SelectTrigger>
                        <SelectContent>
                          {COMMERCIAL_TYPES.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="commArea">{t("form.area_sqft")}</Label>
                      <Input id="commArea" type="number" value={areaSqft} onChange={(e) => setAreaSqft(e.target.value ? Number(e.target.value) : "")} min={1} placeholder={t("sell_page.enter_area")} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("form.furnishing")}</Label>
                      <Select value={furnishing} onValueChange={setFurnishing}>
                        <SelectTrigger><SelectValue placeholder={t("sell_page.select_furnishing")} /></SelectTrigger>
                        <SelectContent>
                          {FURNISHING_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="commFloors">{t("form.floors")}</Label>
                      <Input id="commFloors" type="number" value={floors} onChange={(e) => setFloors(e.target.value ? Number(e.target.value) : "")} min={1} placeholder={t("sell_page.optional")} />
                    </div>
                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center gap-3">
                        <Switch id="commParking" checked={parking} onCheckedChange={setParking} />
                        <Label htmlFor="commParking">{t("form.parking")}</Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch id="powerBackup" checked={powerBackup} onCheckedChange={setPowerBackup} />
                        <Label htmlFor="powerBackup">{t("form.power_backup")}</Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch id="lift" checked={lift} onCheckedChange={setLift} />
                        <Label htmlFor="lift">{t("form.lift")}</Label>
                      </div>
                    </div>
                  </>
                )}

                {/* Vehicle-specific fields */}
                {category === "vehicle" && (
                  <>
                    <div className="space-y-2">
                      <Label>{t("form.vehicle_type")}</Label>
                      <Select value={vehicleType} onValueChange={setVehicleType}>
                        <SelectTrigger><SelectValue placeholder={t("sell_page.select_vehicle_type")} /></SelectTrigger>
                        <SelectContent>
                          {VEHICLE_TYPES.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="vehicleBrand">{t("form.brand")}</Label>
                        <Input id="vehicleBrand" value={vehicleBrand} onChange={(e) => setVehicleBrand(e.target.value)} placeholder={t("sell_page.brand_placeholder")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vehicleModel">{t("form.model")}</Label>
                        <Input id="vehicleModel" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} placeholder={t("sell_page.model_placeholder")} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="vehicleYear">{t("form.year")}</Label>
                        <Input id="vehicleYear" type="number" value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value ? Number(e.target.value) : "")} min={1900} max={new Date().getFullYear()} placeholder={t("sell_page.year_placeholder")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="kmDriven">{t("form.km_driven")}</Label>
                        <Input id="kmDriven" type="number" value={kmDriven} onChange={(e) => setKmDriven(e.target.value ? Number(e.target.value) : "")} min={0} placeholder={t("sell_page.optional")} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t("form.fuel_type")}</Label>
                        <Select value={fuelType} onValueChange={setFuelType}>
                          <SelectTrigger><SelectValue placeholder={t("sell_page.optional")} /></SelectTrigger>
                          <SelectContent>
                            {FUEL_TYPES.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t("form.transmission")}</Label>
                        <Select value={transmission} onValueChange={setTransmission}>
                          <SelectTrigger><SelectValue placeholder={t("sell_page.optional")} /></SelectTrigger>
                          <SelectContent>
                            {TRANSMISSION_TYPES.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ownerNumber">{t("form.owner_number")}</Label>
                        <Input id="ownerNumber" type="number" value={ownerNumber} onChange={(e) => setOwnerNumber(e.target.value ? Number(e.target.value) : "")} min={1} max={10} placeholder={t("sell_page.owner_number_placeholder")} />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("form.registration_state")}</Label>
                        <Select value={registrationState} onValueChange={setRegistrationState}>
                          <SelectTrigger><SelectValue placeholder={t("sell_page.optional")} /></SelectTrigger>
                          <SelectContent>
                            {INDIAN_STATES.map((state) => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch id="insuranceValid" checked={insuranceValid} onCheckedChange={setInsuranceValid} />
                      <Label htmlFor="insuranceValid">{t("form.insurance_valid")}</Label>
                    </div>
                  </>
                )}

                {/* Commodity-specific fields */}
                {category === "commodity" && (
                  <>
                    <div className="space-y-2">
                      <Label>{t("form.commodity_type")}</Label>
                      <Select value={commodityType} onValueChange={setCommodityType}>
                        <SelectTrigger><SelectValue placeholder={t("sell_page.select_type")} /></SelectTrigger>
                        <SelectContent>
                          {COMMODITY_TYPES.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="commodityBrand">{t("sell_page.brand_optional")}</Label>
                      <Input id="commodityBrand" value={commodityBrand} onChange={(e) => setCommodityBrand(e.target.value)} placeholder={t("sell_page.brand_optional_placeholder")} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("form.condition")}</Label>
                      <Select value={commodityCondition} onValueChange={setCommodityCondition}>
                        <SelectTrigger><SelectValue placeholder={t("sell_page.select_condition")} /></SelectTrigger>
                        <SelectContent>
                          {CONDITION_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ageMonths">{t("sell_page.age_months_optional")}</Label>
                      <Input id="ageMonths" type="number" value={ageMonths} onChange={(e) => setAgeMonths(e.target.value ? Number(e.target.value) : "")} min={0} placeholder={t("sell_page.age_item_placeholder")} />
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch id="warranty" checked={warranty} onCheckedChange={setWarranty} />
                      <Label htmlFor="warranty">{t("sell_page.warranty_available")}</Label>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Location & Images */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>{t("sell_page.location_images")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="address">{t("sell_page.full_address")}</Label>
                  <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t("sell_page.enter_full_address")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pincode">{t("form.pincode")}</Label>
                  <Input id="pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} maxLength={6} placeholder={t("sell_page.pincode_6digit")} />
                </div>

                <div className="space-y-3">
                  <Label>{t("sell_page.images_1_4")}</Label>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-8 text-center cursor-pointer hover:border-green-400 dark:hover:border-green-600 transition-colors"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center justify-center size-14 rounded-2xl bg-green-50 dark:bg-green-950/30">
                        <ImageIcon className="size-7 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{t("sell_page.drop_images")}</p>
                        <p className="text-sm text-muted-foreground mt-1">{t("sell_page.image_hint")} {images.length}/4 {t("sell_page.uploaded")}.</p>
                      </div>
                      <Button type="button" variant="outline" size="sm" className="mt-2">
                        <Upload className="size-4 mr-1.5" />
                        {t("sell_page.choose_files")}
                      </Button>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />

                  {previews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                      {previews.map((src, i) => (
                        <div key={i} className="relative group rounded-lg overflow-hidden border">
                          <img src={src} alt={`Preview ${i + 1}`} className="w-full h-28 object-cover" />
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                            className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full size-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 4: Personal Details */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>{t("sell_page.your_contact_details")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm text-muted-foreground">
                  {t("sell_page.contact_details_desc")}
                </p>

                <div className="space-y-2">
                  <Label htmlFor="ownerName" className="flex items-center gap-1.5">
                    <User className="size-4 text-muted-foreground" />
                    {t("auth.full_name")}
                  </Label>
                  <Input id="ownerName" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder={t("sell_page.your_full_name")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerPhone" className="flex items-center gap-1.5">
                    <Phone className="size-4 text-muted-foreground" />
                    {t("auth.phone_number")}
                  </Label>
                  <Input id="ownerPhone" type="tel" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} maxLength={10} placeholder={t("sell_page.phone_10digit")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerEmail" className="flex items-center gap-1.5">
                    <Mail className="size-4 text-muted-foreground" />
                    {t("auth.email")}
                  </Label>
                  <Input id="ownerEmail" type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="your@email.com" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 5: Preview & Submit */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>{t("sell_page.review_listing")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Service Type */}
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">{t("sell_page.service_type")}</h3>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">{t("pdf.category")}</dt>
                      <dd className="font-medium capitalize">{category}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{t("sell_page.transaction")}</dt>
                      <dd className="font-medium capitalize">{transactionType === "commercial_lease" ? t("sell_page.lease") : transactionType}</dd>
                    </div>
                  </dl>
                </div>

                {/* Basic Details */}
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">{t("sell_page.basic_details")}</h3>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div className="sm:col-span-2">
                      <dt className="text-muted-foreground">{t("form.title")}</dt>
                      <dd className="font-medium">{title}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-muted-foreground">{t("form.description")}</dt>
                      <dd className="font-medium whitespace-pre-wrap text-muted-foreground">{description}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{priceLabel}</dt>
                      <dd className="font-medium">{Number(price).toLocaleString("en-IN")}</dd>
                    </div>
                  </dl>
                </div>

                {/* Category-specific details */}
                {category === "house" && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">{t("sell_page.house_details")}</h3>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div><dt className="text-muted-foreground">{t("form.bedrooms")}</dt><dd className="font-medium">{bedrooms}</dd></div>
                      <div><dt className="text-muted-foreground">{t("form.bathrooms")}</dt><dd className="font-medium">{bathrooms}</dd></div>
                      <div><dt className="text-muted-foreground">{t("sell_page.area")}</dt><dd className="font-medium">{areaSqft} {t("listing_card.sqft")}</dd></div>
                      <div><dt className="text-muted-foreground">{t("form.furnishing")}</dt><dd className="font-medium capitalize">{FURNISHING_OPTIONS.find(o => o.value === furnishing)?.label || furnishing}</dd></div>
                      {floors && <div><dt className="text-muted-foreground">{t("form.floors")}</dt><dd className="font-medium">{floors}</dd></div>}
                      <div><dt className="text-muted-foreground">{t("form.parking")}</dt><dd className="font-medium">{parking ? t("common.yes") : t("common.no")}</dd></div>
                    </dl>
                  </div>
                )}

                {category === "land" && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">{t("sell_page.land_details")}</h3>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div><dt className="text-muted-foreground">{t("sell_page.area")}</dt><dd className="font-medium">{areaSqft} {t("listing_card.sqft")}</dd></div>
                      <div><dt className="text-muted-foreground">{t("form.land_type")}</dt><dd className="font-medium capitalize">{LAND_TYPES.find(o => o.value === landType)?.label || landType}</dd></div>
                      {facing && <div><dt className="text-muted-foreground">{t("form.facing")}</dt><dd className="font-medium capitalize">{facing}</dd></div>}
                      <div><dt className="text-muted-foreground">{t("form.boundary_wall")}</dt><dd className="font-medium">{boundaryWall ? t("common.yes") : t("common.no")}</dd></div>
                      <div><dt className="text-muted-foreground">{t("form.corner_plot")}</dt><dd className="font-medium">{isCornerPlot ? t("common.yes") : t("common.no")}</dd></div>
                    </dl>
                  </div>
                )}

                {category === "pg" && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">{t("sell_page.pg_details")}</h3>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div><dt className="text-muted-foreground">{t("form.gender_preference")}</dt><dd className="font-medium capitalize">{genderPreference}</dd></div>
                      <div><dt className="text-muted-foreground">{t("sell_page.occupancy")}</dt><dd className="font-medium capitalize">{occupancyType}</dd></div>
                      <div><dt className="text-muted-foreground">{t("sell_page.meals")}</dt><dd className="font-medium">{mealsIncluded ? t("common.yes") : t("common.no")}</dd></div>
                      <div><dt className="text-muted-foreground">{t("form.wifi")}</dt><dd className="font-medium">{wifi ? t("common.yes") : t("common.no")}</dd></div>
                      <div><dt className="text-muted-foreground">{t("form.ac")}</dt><dd className="font-medium">{ac ? t("common.yes") : t("common.no")}</dd></div>
                      <div><dt className="text-muted-foreground">{t("form.attached_bathroom")}</dt><dd className="font-medium">{attachedBathroom ? t("common.yes") : t("common.no")}</dd></div>
                    </dl>
                  </div>
                )}

                {category === "commercial" && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">{t("sell_page.commercial_details")}</h3>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div><dt className="text-muted-foreground">{t("sell_page.type")}</dt><dd className="font-medium capitalize">{COMMERCIAL_TYPES.find(o => o.value === commercialType)?.label || commercialType}</dd></div>
                      <div><dt className="text-muted-foreground">{t("sell_page.area")}</dt><dd className="font-medium">{areaSqft} {t("listing_card.sqft")}</dd></div>
                      {furnishing && <div><dt className="text-muted-foreground">{t("form.furnishing")}</dt><dd className="font-medium capitalize">{FURNISHING_OPTIONS.find(o => o.value === furnishing)?.label || furnishing}</dd></div>}
                      <div><dt className="text-muted-foreground">{t("form.parking")}</dt><dd className="font-medium">{parking ? t("common.yes") : t("common.no")}</dd></div>
                      <div><dt className="text-muted-foreground">{t("form.power_backup")}</dt><dd className="font-medium">{powerBackup ? t("common.yes") : t("common.no")}</dd></div>
                      <div><dt className="text-muted-foreground">{t("form.lift")}</dt><dd className="font-medium">{lift ? t("common.yes") : t("common.no")}</dd></div>
                    </dl>
                  </div>
                )}

                {category === "vehicle" && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">{t("sell_page.vehicle_details")}</h3>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div><dt className="text-muted-foreground">{t("sell_page.type")}</dt><dd className="font-medium capitalize">{VEHICLE_TYPES.find(o => o.value === vehicleType)?.label || vehicleType}</dd></div>
                      <div><dt className="text-muted-foreground">{t("form.brand")}</dt><dd className="font-medium">{vehicleBrand}</dd></div>
                      <div><dt className="text-muted-foreground">{t("form.model")}</dt><dd className="font-medium">{vehicleModel}</dd></div>
                      <div><dt className="text-muted-foreground">{t("form.year")}</dt><dd className="font-medium">{vehicleYear}</dd></div>
                      {fuelType && <div><dt className="text-muted-foreground">{t("form.fuel_type")}</dt><dd className="font-medium capitalize">{FUEL_TYPES.find(o => o.value === fuelType)?.label || fuelType}</dd></div>}
                      {transmission && <div><dt className="text-muted-foreground">{t("form.transmission")}</dt><dd className="font-medium capitalize">{TRANSMISSION_TYPES.find(o => o.value === transmission)?.label || transmission}</dd></div>}
                      {kmDriven && <div><dt className="text-muted-foreground">{t("form.km_driven")}</dt><dd className="font-medium">{Number(kmDriven).toLocaleString("en-IN")} km</dd></div>}
                      {ownerNumber && <div><dt className="text-muted-foreground">{t("form.owner_number")}</dt><dd className="font-medium">{ownerNumber}</dd></div>}
                      {registrationState && <div><dt className="text-muted-foreground">{t("sell_page.registration")}</dt><dd className="font-medium">{registrationState}</dd></div>}
                      <div><dt className="text-muted-foreground">{t("sell_page.insurance")}</dt><dd className="font-medium">{insuranceValid ? t("sell_page.valid") : t("sell_page.expired_na")}</dd></div>
                    </dl>
                  </div>
                )}

                {category === "commodity" && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">{t("sell_page.commodity_details")}</h3>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div><dt className="text-muted-foreground">{t("sell_page.type")}</dt><dd className="font-medium capitalize">{COMMODITY_TYPES.find(o => o.value === commodityType)?.label || commodityType}</dd></div>
                      {commodityBrand && <div><dt className="text-muted-foreground">{t("form.brand")}</dt><dd className="font-medium">{commodityBrand}</dd></div>}
                      <div><dt className="text-muted-foreground">{t("form.condition")}</dt><dd className="font-medium capitalize">{CONDITION_OPTIONS.find(o => o.value === commodityCondition)?.label || commodityCondition}</dd></div>
                      <div><dt className="text-muted-foreground">{t("form.warranty")}</dt><dd className="font-medium">{warranty ? t("common.yes") : t("common.no")}</dd></div>
                      {ageMonths && <div><dt className="text-muted-foreground">{t("sell_page.age")}</dt><dd className="font-medium">{ageMonths} {t("sell_page.months")}</dd></div>}
                    </dl>
                  </div>
                )}

                {/* Location */}
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">{t("sell_page.location")}</h3>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div className="sm:col-span-2"><dt className="text-muted-foreground">{t("form.address")}</dt><dd className="font-medium">{address}</dd></div>
                    <div><dt className="text-muted-foreground">{t("form.pincode")}</dt><dd className="font-medium">{pincode}</dd></div>
                  </dl>
                </div>

                {/* Images */}
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">{t("sell_page.images")} ({images.length})</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {previews.map((src, i) => (
                      <img key={i} src={src} alt={`Image ${i + 1}`} className="w-full h-20 object-cover rounded-lg border" />
                    ))}
                  </div>
                </div>

                {/* Personal Details */}
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">{t("sell_page.contact_details")}</h3>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div><dt className="text-muted-foreground">{t("sell_page.name")}</dt><dd className="font-medium">{ownerName}</dd></div>
                    <div><dt className="text-muted-foreground">{t("sell_page.phone")}</dt><dd className="font-medium">{ownerPhone}</dd></div>
                    <div><dt className="text-muted-foreground">{t("auth.email")}</dt><dd className="font-medium">{ownerEmail}</dd></div>
                  </dl>
                </div>

              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8">
          <Button variant="outline" onClick={handlePrevious} disabled={step === 0} className="gap-1.5">
            <ArrowLeft className="size-4" />
            {t("sell_page.previous")}
          </Button>

          {step < TRANSLATED_STEPS.length - 1 ? (
            <Button onClick={handleNext} className="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
              {t("sell_page.next")}
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting} className="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
              {submitting ? (
                <>
                  <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t("sell_page.submitting")}
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  {t("sell_page.submit_listing")}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <PaymentGateway
        open={showPaymentDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowPaymentDialog(false);
            setPendingListingData(null);
          }
        }}
        onPaymentConfirmed={handlePaymentConfirmed}
        submitting={submitting}
      />
      <PageSettings />
    </main>
  );
}
