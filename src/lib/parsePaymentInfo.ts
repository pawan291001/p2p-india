/** Parse the pipe-separated payment info string into structured parts */
export interface ParsedPayment {
  name: string;
  method: string;
  /** The copyable payment detail (UPI ID, phone, email, or bank details) */
  copyableDetail: string;
  /** All detail fields as key-value pairs */
  fields: { label: string; value: string }[];
  /** UPI deep link for QR code, if applicable */
  upiLink: string | null;
}

export function parsePaymentInfo(raw: string): ParsedPayment {
  const parts = raw.split("|").map((s) => s.trim());
  let name = "";
  let method = "";
  const fields: { label: string; value: string }[] = [];
  const detailParts: string[] = [];

  for (const part of parts) {
    const [key, ...rest] = part.split(":");
    const k = key.trim();
    const v = rest.join(":").trim();
    if (k === "Name") {
      name = v;
    } else if (k === "Method") {
      method = v;
    } else {
      fields.push({ label: k, value: v });
      detailParts.push(v);
    }
  }

  // For bank transfer, format copyable as multi-line
  let copyableDetail: string;
  if (fields.length > 1) {
    copyableDetail = fields.map((f) => `${f.label}: ${f.value}`).join("\n");
  } else {
    copyableDetail = detailParts[0] || raw;
  }

  // Build UPI deep link if method is UPI, GPay, PhonePe, or Digital Rupee
  let upiLink: string | null = null;
  const isUpiMethod = ["UPI", "Google Pay", "PhonePe", "Digital Rupee"].includes(method);
  if (isUpiMethod) {
    const upiField = fields.find((f) => f.label === "UPI" || f.label === "Phone/UPI" || f.label === "Wallet/ID");
    if (upiField) {
      upiLink = `upi://pay?pa=${encodeURIComponent(upiField.value)}&pn=${encodeURIComponent(name)}`;
    }
  }

  return { name, method, copyableDetail, fields, upiLink };
}
