import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield } from "lucide-react";

const DISCLAIMER_KEY = "p2p_disclaimer_accepted";

const DisclaimerModal = () => {
  const [open, setOpen] = useState(false);
  const [ageChecked, setAgeChecked] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(DISCLAIMER_KEY);
    if (!accepted) setOpen(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem(DISCLAIMER_KEY, "true");
    setOpen(false);
  };

  const canAccept = ageChecked && termsChecked;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md rounded-xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5 text-primary" />
            <AlertDialogTitle className="text-base">Important Disclaimer</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Crypto P2P is a <strong>peer-to-peer marketplace tool</strong> that connects users for
                direct crypto transfers using smart contract escrow on BNB Smart Chain.
              </p>
              <p>
                This app <strong>does not</strong> provide financial, investment, or legal advice.
                It does not custody or control user funds — all assets are managed by the on-chain
                escrow contract. Users are solely responsible for compliance with applicable laws in
                their jurisdiction.
              </p>
              <p>
                Cryptocurrency involves significant risk. You may lose some or all of your funds.
                Always do your own research before making any decisions.
              </p>

              <div className="space-y-3 pt-2 border-t border-border">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <Checkbox
                    checked={ageChecked}
                    onCheckedChange={(v) => setAgeChecked(v === true)}
                    className="mt-0.5"
                  />
                  <span className="text-xs leading-relaxed">
                    I confirm that I am <strong>18 years or older</strong> and legally eligible to use
                    this platform in my jurisdiction.
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <Checkbox
                    checked={termsChecked}
                    onCheckedChange={(v) => setTermsChecked(v === true)}
                    className="mt-0.5"
                  />
                  <span className="text-xs leading-relaxed">
                    I have read and agree to the{" "}
                    <a href="/terms" className="text-primary underline" target="_blank">
                      Terms & Conditions
                    </a>{" "}
                    and{" "}
                    <a href="/privacy" className="text-primary underline" target="_blank">
                      Privacy Policy
                    </a>
                    .
                  </span>
                </label>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            disabled={!canAccept}
            onClick={handleAccept}
            className="w-full disabled:opacity-40"
          >
            I Understand & Accept
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DisclaimerModal;
