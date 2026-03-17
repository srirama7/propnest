"use client";

import { useState, useRef } from "react";
import {
  CheckCircle2,
  IndianRupee,
  X,
  Smartphone,
  Clock,
  ScanLine,
  CircleDot,
  Send,
  Upload,
  FileText,
  AlertTriangle,
  ImageIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

const LISTING_FEE = 10;

interface PaymentProof {
  upiTransactionId: string;
  screenshotFile: File | null;
}

interface PaymentGatewayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentConfirmed: (proof: PaymentProof) => void;
  submitting: boolean;
}

type GatewayStep = "instructions" | "qr" | "proof" | "confirmed";

export function PaymentGateway({
  open,
  onOpenChange,
  onPaymentConfirmed,
  submitting,
}: PaymentGatewayProps) {
  const [step, setStep] = useState<GatewayStep>("instructions");
  const [upiTransactionId, setUpiTransactionId] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [proofError, setProofError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleClose() {
    if (submitting) return;
    setStep("instructions");
    setUpiTransactionId("");
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setProofError("");
    onOpenChange(false);
  }

  function handleShowQR() {
    setStep("qr");
  }

  function handlePaidConfirm() {
    setStep("proof");
  }

  function handleScreenshotSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProofError("Please upload an image file (PNG, JPG, etc.)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProofError("Screenshot must be under 5MB");
      return;
    }

    setScreenshotFile(file);
    setProofError("");
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshotPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleProofSubmit() {
    const trimmedId = upiTransactionId.trim();
    if (!trimmedId) {
      setProofError("Please enter your UPI Transaction ID / UTR number");
      return;
    }
    if (trimmedId.length < 6) {
      setProofError("Transaction ID seems too short. Please enter the full UTR number.");
      return;
    }
    if (!screenshotFile) {
      setProofError("Please upload a screenshot of your payment confirmation");
      return;
    }
    setProofError("");
    setStep("confirmed");
  }

  function handleSubmitListing() {
    onPaymentConfirmed({
      upiTransactionId: upiTransactionId.trim(),
      screenshotFile,
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent showCloseButton={false} className="sm:max-w-[440px] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-white/20">
                <IndianRupee className="size-5" />
              </div>
              <div>
                <DialogHeader className="p-0">
                  <DialogTitle className="text-white text-base font-bold">Listing Fee — ₹{LISTING_FEE} only</DialogTitle>
                </DialogHeader>
                <DialogDescription className="text-blue-100 text-xs mt-0.5">Simple UPI payment, no payment gateway</DialogDescription>
              </div>
            </div>
            <button onClick={handleClose} disabled={submitting} className="rounded-full p-1.5 hover:bg-white/20 transition-colors disabled:opacity-50">
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Step 1: Instructions — explain what will happen */}
        {step === "instructions" && (
          <div className="px-6 py-5 space-y-4">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground">How payment works:</h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold">1</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Scan QR Code</p>
                    <p className="text-xs text-muted-foreground">We&apos;ll show you a QR code. Scan it with any UPI app on your phone.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold">2</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Pay ₹{LISTING_FEE} via UPI</p>
                    <p className="text-xs text-muted-foreground">Use GPay, PhonePe, Paytm, or any UPI app. It&apos;s a direct UPI transfer — no payment gateway involved.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold">3</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Confirm &amp; Submit</p>
                    <p className="text-xs text-muted-foreground">After paying, click &quot;I&apos;ve Paid&quot; and submit your listing. Admin will verify and make it live.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 px-4 py-3">
              <p className="text-xs text-blue-700 dark:text-blue-400 text-center">
                This is a one-time ₹{LISTING_FEE} fee per listing. Browsing and contacting sellers is always free!
              </p>
            </div>

            <Button
              type="button"
              onClick={handleShowQR}
              className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white h-12 text-base"
            >
              <ScanLine className="size-5" />
              Show QR Code to Pay
            </Button>
          </div>
        )}

        {/* Step 2: QR Code */}
        {step === "qr" && (
          <div className="px-6 py-5 space-y-4">
            <div className="flex flex-col items-center gap-3">
              {/* Amount badge */}
              <div className="inline-flex items-center gap-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full px-4 py-1.5">
                <IndianRupee className="size-4" />
                <span className="text-lg font-bold">{LISTING_FEE}.00</span>
              </div>

              <div className="relative w-[220px] h-[220px] rounded-xl overflow-hidden border-2 border-gray-200">
                <Image
                  src="/qr_code.png"
                  alt="UPI QR Code"
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              <div className="text-center space-y-1.5">
                <div className="flex items-center justify-center gap-2">
                  <Smartphone className="size-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Scan with any UPI app</p>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">GPay</span>
                  <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">PhonePe</span>
                  <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">Paytm</span>
                  <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">Any UPI</span>
                </div>
              </div>

              <div className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-2.5 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Or pay manually to UPI ID</p>
                <p className="text-sm font-mono font-medium text-foreground select-all">amoghabhat7403@oksbi</p>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-2.5">
              <div className="flex items-start gap-2">
                <CircleDot className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  After paying ₹{LISTING_FEE} on your UPI app, come back here and click the button below.
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={handlePaidConfirm}
              className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white h-12 text-base"
            >
              <CheckCircle2 className="size-5" />
              I&apos;ve Paid ₹{LISTING_FEE}
            </Button>

            <button
              onClick={() => setStep("instructions")}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
            >
              Go back to instructions
            </button>
          </div>
        )}

        {/* Step 3: Payment Proof — UTR + Screenshot */}
        {step === "proof" && (
          <div className="px-6 py-5 space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-2.5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  To prevent fraud, we require proof of payment. Please provide both your UPI Transaction ID and a screenshot.
                </p>
              </div>
            </div>

            {/* UPI Transaction ID */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <FileText className="size-4 text-blue-600" />
                UPI Transaction ID / UTR Number
              </label>
              <Input
                type="text"
                placeholder="e.g. 412345678901 or UTR number from your UPI app"
                value={upiTransactionId}
                onChange={(e) => { setUpiTransactionId(e.target.value); setProofError(""); }}
                className="font-mono text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Find this in your UPI app → Transaction History → tap the ₹{LISTING_FEE} payment
              </p>
            </div>

            {/* Screenshot Upload */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <ImageIcon className="size-4 text-blue-600" />
                Payment Screenshot
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleScreenshotSelect}
                className="hidden"
              />
              {screenshotPreview ? (
                <div className="relative rounded-lg border-2 border-green-300 bg-green-50 dark:bg-green-950/20 p-2">
                  <img
                    src={screenshotPreview}
                    alt="Payment screenshot"
                    className="w-full max-h-48 object-contain rounded"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setScreenshotFile(null);
                      setScreenshotPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                  >
                    <X className="size-3" />
                  </button>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-1.5 text-center font-medium">Screenshot uploaded</p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 px-4 py-6 text-center hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors"
                >
                  <Upload className="size-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">Click to upload screenshot</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">PNG, JPG — max 5MB</p>
                </button>
              )}
            </div>

            {proofError && (
              <p className="text-xs text-red-600 font-medium">{proofError}</p>
            )}

            <Button
              type="button"
              onClick={handleProofSubmit}
              className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white h-12 text-base"
            >
              <CheckCircle2 className="size-5" />
              Verify & Continue
            </Button>

            <button
              onClick={() => setStep("qr")}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
            >
              Go back to QR code
            </button>
          </div>
        )}

        {/* Step 4: Confirmed — submit listing */}
        {step === "confirmed" && (
          <div className="px-6 py-8 flex flex-col items-center gap-4 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="size-9 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-700 dark:text-green-400">Payment Proof Received!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Now submit your listing. Our admin will verify your ₹{LISTING_FEE} payment using the details you provided and make your listing live within 24 hours.
              </p>
            </div>

            <div className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3 text-left space-y-1">
              <p className="text-xs font-medium text-foreground">Your payment details:</p>
              <p className="text-xs text-muted-foreground">UTR: <span className="font-mono font-bold text-foreground">{upiTransactionId.trim()}</span></p>
              <p className="text-xs text-muted-foreground">Screenshot: <span className="font-medium text-green-600">Uploaded</span></p>
            </div>

            <div className="w-full rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 px-4 py-3 text-left space-y-1.5">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-400">What happens next:</p>
              <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-300">
                <Send className="size-3 shrink-0" />
                <span>Your listing is submitted for review</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-300">
                <Clock className="size-3 shrink-0" />
                <span>Admin verifies your UPI payment using UTR & screenshot</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-300">
                <CheckCircle2 className="size-3 shrink-0" />
                <span>Your listing goes live on BhoomiTayi!</span>
              </div>
            </div>

            <Button
              onClick={handleSubmitListing}
              disabled={submitting}
              className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white mt-2 h-12 text-base"
            >
              {submitting ? (
                <>
                  <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting listing...
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Submit Listing for Review
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
