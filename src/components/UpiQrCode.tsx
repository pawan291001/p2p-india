import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode } from "lucide-react";

interface UpiQrCodeProps {
  upiLink: string;
  amount?: string;
}

const UpiQrCode = ({ upiLink, amount }: UpiQrCodeProps) => {
  const [show, setShow] = useState(false);
  const fullLink = amount ? `${upiLink}&am=${amount}` : upiLink;

  return (
    <div>
      <button
        onClick={() => setShow((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
      >
        <QrCode className="h-3.5 w-3.5" />
        {show ? "Hide QR" : "Show UPI QR"}
      </button>
      {show && (
        <div className="mt-2 flex flex-col items-center gap-2 rounded-lg bg-white p-3 border border-border w-fit">
          <QRCodeSVG value={fullLink} size={160} level="M" />
          <p className="text-[10px] text-muted-foreground text-center max-w-[160px] break-all">
            Scan with any UPI app
          </p>
        </div>
      )}
    </div>
  );
};

export default UpiQrCode;
