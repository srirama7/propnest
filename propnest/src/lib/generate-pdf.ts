import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import type { Listing } from "@/lib/types/database";

async function getTranslations(lang: string) {
  const translations = await import(`../../public/locales/${lang}/common.json`);
  return translations.default || translations;
}

function formatDateForLocale(dateStr: string, lang: string): string {
  try {
    const date = new Date(dateStr);
    const localeMap: Record<string, string> = {
      en: "en-IN", kn: "kn-IN", hi: "hi-IN",
      te: "te-IN", ml: "ml-IN", ta: "ta-IN",
    };
    return date.toLocaleDateString(localeMap[lang] || "en-IN", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatPrice(price: number): string {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
  if (price >= 1000) return `₹${(price / 1000).toFixed(1)}K`;
  return `₹${price.toLocaleString("en-IN")}`;
}

function getFontFamily(lang: string): string {
  const fontMap: Record<string, string> = {
    en: "'Noto Sans', sans-serif",
    kn: "'Noto Sans Kannada', 'Noto Sans', sans-serif",
    hi: "'Noto Sans Devanagari', 'Noto Sans', sans-serif",
    te: "'Noto Sans Telugu', 'Noto Sans', sans-serif",
    ml: "'Noto Sans Malayalam', 'Noto Sans', sans-serif",
    ta: "'Noto Sans Tamil', 'Noto Sans', sans-serif",
  };
  return fontMap[lang] || fontMap.en;
}

function getFontImport(lang: string): string {
  const imports: Record<string, string> = {
    en: "Noto+Sans:wght@400;600;700",
    kn: "Noto+Sans+Kannada:wght@400;600;700|Noto+Sans:wght@400;600;700",
    hi: "Noto+Sans+Devanagari:wght@400;600;700|Noto+Sans:wght@400;600;700",
    te: "Noto+Sans+Telugu:wght@400;600;700|Noto+Sans:wght@400;600;700",
    ml: "Noto+Sans+Malayalam:wght@400;600;700|Noto+Sans:wght@400;600;700",
    ta: "Noto+Sans+Tamil:wght@400;600;700|Noto+Sans:wght@400;600;700",
  };
  return `https://fonts.googleapis.com/css2?family=${imports[lang] || imports.en}&display=swap`;
}

async function loadFont(lang: string): Promise<void> {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = getFontImport(lang);
  document.head.appendChild(link);
  // Wait for font to load
  await new Promise((resolve) => setTimeout(resolve, 1500));
}

async function fetchImageAsDataUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return url; // fallback to original URL if fetch fails
  }
}

async function renderPageToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  return html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
  });
}

export async function generateListingPDF(listing: Listing, lang: string = "en") {
  const t = await getTranslations(lang);
  const pdf = t.pdf;
  const form = t.form;
  const fontFamily = getFontFamily(lang);

  // Load fonts
  await loadFont(lang);

  const refId = `BT-${listing.id.substring(0, 8).toUpperCase()}`;
  const listingAny = listing as unknown as Record<string, unknown>;
  const details = listing.details as Record<string, unknown> | null;

  // Build detail rows for property-specific fields
  const detailRows: [string, string][] = [];

  // Basic info
  detailRows.push([form.title || "Title", listing.title]);
  detailRows.push([form.description || "Description", listing.description?.substring(0, 300) || "N/A"]);
  detailRows.push([form.price || "Price", formatPrice(listing.price)]);
  detailRows.push([form.address || "Address", listing.address]);
  detailRows.push([form.pincode || "Pincode", listing.pincode]);
  detailRows.push([pdf.category || "Category", listing.category]);
  detailRows.push([form.transaction_type || "Transaction Type", listing.transaction_type]);

  // Contact info
  if (listingAny.owner_name) detailRows.push([form.owner_name || "Owner Name", String(listingAny.owner_name)]);
  if (listingAny.owner_phone) detailRows.push([form.owner_phone || "Phone", String(listingAny.owner_phone)]);
  if (listingAny.owner_email) detailRows.push([form.owner_email || "Email", String(listingAny.owner_email)]);

  // Property-specific details
  if (details) {
    const detailFieldMap: Record<string, string> = {
      bedrooms: form.bedrooms || "Bedrooms",
      bathrooms: form.bathrooms || "Bathrooms",
      area_sqft: form.area_sqft || "Area (sq.ft)",
      furnishing: form.furnishing || "Furnishing",
      floors: form.floors || "Floors",
      parking: form.parking || "Parking",
      year_built: form.year_built || "Year Built",
      land_type: form.land_type || "Land Type",
      facing: form.facing || "Facing",
      road_width_ft: form.road_width || "Road Width (ft)",
      boundary_wall: form.boundary_wall || "Boundary Wall",
      is_corner_plot: form.corner_plot || "Corner Plot",
      legal_clearance: form.legal_clearance || "Legal Clearance",
      rent_per_month: form.rent_per_month || "Rent per Month",
      security_deposit: form.security_deposit || "Security Deposit",
      gender_preference: form.gender_preference || "Gender Preference",
      occupancy_type: form.occupancy_type || "Occupancy Type",
      meals_included: form.meals_included || "Meals Included",
      wifi: form.wifi || "WiFi",
      ac: form.ac || "AC",
      laundry: form.laundry || "Laundry",
      attached_bathroom: form.attached_bathroom || "Attached Bathroom",
      rules: form.rules || "Rules",
      available_from: form.available_from || "Available From",
      commercial_type: form.commercial_type || "Commercial Type",
      power_backup: form.power_backup || "Power Backup",
      lift: form.lift || "Lift",
      vehicle_type: form.vehicle_type || "Vehicle Type",
      brand: form.brand || "Brand",
      model: form.model || "Model",
      year: form.year || "Year",
      fuel_type: form.fuel_type || "Fuel Type",
      transmission: form.transmission || "Transmission",
      km_driven: form.km_driven || "KM Driven",
      owner_number: form.owner_number || "Owner Number",
      registration_state: form.registration_state || "Registration State",
      insurance_valid: form.insurance_valid || "Insurance Valid",
      condition: form.condition || "Condition",
      commodity_type: form.commodity_type || "Commodity Type",
      warranty: form.warranty || "Warranty",
      age_months: form.age_months || "Age (Months)",
      amenities: form.amenities || "Amenities",
      meal_types: form.meal_types || "Meal Types",
    };

    for (const [key, label] of Object.entries(detailFieldMap)) {
      if (details[key] !== undefined && details[key] !== null && details[key] !== "") {
        let val = details[key];
        if (typeof val === "boolean") val = val ? "Yes" : "No";
        if (typeof val === "number") val = val.toLocaleString("en-IN");
        if (Array.isArray(val)) val = val.join(", ");
        detailRows.push([label, String(val)]);
      }
    }
  }

  // Create hidden container
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  document.body.appendChild(container);

  const pageStyle = `
    width: 794px;
    min-height: 1123px;
    padding: 0;
    margin: 0;
    background: #ffffff;
    font-family: ${fontFamily};
    color: #1e1e1e;
    box-sizing: border-box;
  `;

  // ── PAGE 1: Cover / Confirmation ──
  const page1 = document.createElement("div");
  page1.style.cssText = pageStyle;
  page1.innerHTML = `
    <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 30px 40px; color: white;">
      <div style="font-size: 28px; font-weight: 700; font-family: 'Noto Sans', sans-serif;">BhoomiTayi</div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
        <div style="font-size: 13px; opacity: 0.9; font-family: 'Noto Sans', sans-serif;">bhoomitayi.com</div>
        <div style="font-size: 13px; font-weight: 600; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 4px; font-family: 'Noto Sans', sans-serif;">${refId}</div>
      </div>
    </div>
    <div style="padding: 40px;">
      <h1 style="text-align: center; font-size: 22px; font-weight: 700; margin-bottom: 8px; color: #1e1e1e; font-family: ${fontFamily};">${pdf.title || "LISTING SUBMISSION CONFIRMATION"}</h1>
      <div style="height: 3px; background: linear-gradient(90deg, #2563eb, #4f46e5); border-radius: 2px; margin-bottom: 35px;"></div>

      <table style="width: 100%; border-collapse: collapse; font-family: ${fontFamily};">
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 0; font-weight: 600; color: #6b7280; width: 200px; font-size: 14px;">${pdf.ref_number || "Reference Number"}:</td>
          <td style="padding: 12px 0; font-size: 14px; font-family: 'Noto Sans', sans-serif;">${refId}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 0; font-weight: 600; color: #6b7280; font-size: 14px;">${pdf.applicant_name || "Applicant Name"}:</td>
          <td style="padding: 12px 0; font-size: 14px;">${listingAny.owner_name || "N/A"}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 0; font-weight: 600; color: #6b7280; font-size: 14px;">${pdf.business_service || "Business / Service"}:</td>
          <td style="padding: 12px 0; font-size: 14px;">${listing.title}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 0; font-weight: 600; color: #6b7280; font-size: 14px;">${pdf.category || "Category"}:</td>
          <td style="padding: 12px 0; font-size: 14px;">${listing.category.charAt(0).toUpperCase() + listing.category.slice(1)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 0; font-weight: 600; color: #6b7280; font-size: 14px;">${pdf.submission_date || "Submission Date"}:</td>
          <td style="padding: 12px 0; font-size: 14px;">${formatDateForLocale(listing.created_at, lang)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 0; font-weight: 600; color: #6b7280; font-size: 14px;">${pdf.status || "Status"}:</td>
          <td style="padding: 12px 0; font-size: 14px; font-family: 'Noto Sans', sans-serif;">${listing.status.toUpperCase()}</td>
        </tr>
      </table>

      ${listing.status === "active" ? `
      <div style="margin-top: 30px; background: #dcfce7; border: 1px solid #86efac; border-radius: 8px; padding: 14px; text-align: center;">
        <span style="color: #166534; font-weight: 700; font-size: 15px; font-family: 'Noto Sans', sans-serif;">✓ APPROVED</span>
      </div>` : ""}

      <p style="margin-top: 35px; text-align: center; color: #6b7280; font-size: 13px; font-style: italic; line-height: 1.6; font-family: ${fontFamily};">
        ${pdf.confirmation_text || "This document confirms that the above listing has been duly submitted on the portal."}
      </p>
    </div>
    <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 15px 40px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 10px; color: #9ca3af; font-family: 'Noto Sans', sans-serif;">
      <span>${pdf.page || "Page"} 1 | ${refId}</span>
      <span>BhoomiTayi | bhoomitayi.com</span>
      <span>${pdf.generated_on || "Generated on"}: ${new Date().toLocaleDateString()}</span>
    </div>
  `;
  page1.style.position = "relative";
  container.appendChild(page1);

  // ── PAGE 2: Application Details ──
  const tableRows = detailRows.map(([label, value], i) => `
    <tr style="background: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 10px 14px; font-weight: 600; font-size: 12px; color: #374151; width: 200px; font-family: ${fontFamily};">${label}</td>
      <td style="padding: 10px 14px; font-size: 12px; color: #1e1e1e; font-family: ${fontFamily};">${value}</td>
    </tr>
  `).join("");

  const page2 = document.createElement("div");
  page2.style.cssText = pageStyle;
  page2.innerHTML = `
    <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 16px 40px; color: white; text-align: center;">
      <div style="font-size: 16px; font-weight: 700; font-family: ${fontFamily};">${pdf.application_details || "APPLICATION DETAILS"}</div>
    </div>
    <div style="padding: 25px 40px;">
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background: #2563eb; color: white;">
            <th style="padding: 12px 14px; text-align: left; font-size: 13px; font-weight: 600; font-family: ${fontFamily};">${pdf.field || "Field"}</th>
            <th style="padding: 12px 14px; text-align: left; font-size: 13px; font-weight: 600; font-family: ${fontFamily};">${pdf.value || "Value"}</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
    <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 15px 40px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 10px; color: #9ca3af; font-family: 'Noto Sans', sans-serif;">
      <span>${pdf.page || "Page"} 2 | ${refId}</span>
      <span>BhoomiTayi | bhoomitayi.com</span>
      <span>${pdf.generated_on || "Generated on"}: ${new Date().toLocaleDateString()}</span>
    </div>
  `;
  page2.style.position = "relative";
  container.appendChild(page2);

  // ── PAGE 3: Images (only if images exist) ──
  let page3: HTMLElement | null = null;
  if (listing.images && listing.images.length > 0) {
    // Pre-fetch all images as data URLs to avoid CORS issues
    const dataUrls = await Promise.all(
      listing.images.map((url) => fetchImageAsDataUrl(url))
    );

    page3 = document.createElement("div");
    page3.style.cssText = pageStyle;

    const imageGridHtml = dataUrls.map((dataUrl) => `
      <div style="width: 48%; aspect-ratio: 16/10; overflow: hidden; border-radius: 8px; border: 1px solid #e5e7eb;">
        <img src="${dataUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
      </div>
    `).join("");

    page3.innerHTML = `
      <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 16px 40px; color: white; text-align: center;">
        <div style="font-size: 16px; font-weight: 700; font-family: ${fontFamily};">${form.images || "Images"}</div>
      </div>
      <div style="padding: 25px 40px;">
        <div style="display: flex; flex-wrap: wrap; gap: 14px; justify-content: center;">
          ${imageGridHtml}
        </div>
      </div>
      <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 15px 40px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 10px; color: #9ca3af; font-family: 'Noto Sans', sans-serif;">
        <span>${pdf.page || "Page"} 3 | ${refId}</span>
        <span>BhoomiTayi | bhoomitayi.com</span>
        <span>${pdf.generated_on || "Generated on"}: ${new Date().toLocaleDateString()}</span>
      </div>
    `;
    page3.style.position = "relative";
    container.appendChild(page3);
  }

  // Render pages to canvases
  const doc = new jsPDF("p", "mm", "a4");
  const a4Width = 210;
  const a4Height = 297;

  const canvas1 = await renderPageToCanvas(page1);
  doc.addImage(canvas1.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, a4Width, a4Height);

  doc.addPage();
  const canvas2 = await renderPageToCanvas(page2);
  doc.addImage(canvas2.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, a4Width, a4Height);

  if (page3) {
    doc.addPage();
    const canvas3 = await renderPageToCanvas(page3);
    doc.addImage(canvas3.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, a4Width, a4Height);
  }

  // Cleanup
  document.body.removeChild(container);

  // Download
  const filename = `${refId}_submission_${lang}.pdf`;
  doc.save(filename);
}
