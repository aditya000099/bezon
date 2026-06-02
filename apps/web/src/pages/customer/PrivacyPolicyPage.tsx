import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Eye, Lock, RefreshCw, Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      {/* Header back navigation link */}
      <div className="flex items-center">
        <Link
          to="/shop/profile"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Link>
      </div>

      <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardHeader className="bg-slate-50 border-b border-slate-100 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-extrabold text-slate-800">
                Privacy Policy
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium mt-1">
                Last updated: June 1, 2026
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 flex flex-col gap-8 text-slate-600 text-sm sm:text-base leading-relaxed">
          
          {/* Policy commitment box */}
          <div className="bg-emerald-50/50 rounded-2xl border border-emerald-100 p-5 flex gap-4">
            <Lock className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-slate-700 text-xs sm:text-sm font-medium">
              Your privacy is extremely important to us! At Bezon, we are fully committed to protecting your personal
              information and being transparent about how we process and store it.
            </div>
          </div>

          {/* Section 1 */}
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="flex items-center justify-center h-6.5 w-6.5 rounded-full bg-slate-100 text-slate-700 text-xs font-black">
                1
              </span>
              Information We Collect
            </h2>
            <p className="pl-8 text-slate-500 text-sm font-semibold">
              We collect details you voluntarily share when using Bezon:
            </p>
            <ul className="list-disc pl-14 text-slate-500 text-xs sm:text-sm font-semibold flex flex-col gap-1.5">
              <li><strong>Profile Information</strong>: Name, email address, phone number, and avatar image.</li>
              <li><strong>Delivery Information</strong>: Addresses you register for shipping purposes.</li>
              <li><strong>Transaction Data</strong>: Order logs, purchases, and total pricing configurations.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="flex items-center justify-center h-6.5 w-6.5 rounded-full bg-slate-100 text-slate-700 text-xs font-black">
                2
              </span>
              How We Use Your Data
            </h2>
            <p className="pl-8 text-slate-500 text-sm font-semibold">
              We process your details exclusively to serve you better:
            </p>
            <ul className="list-disc pl-14 text-slate-500 text-xs sm:text-sm font-semibold flex flex-col gap-1.5">
              <li>Creating and securing your personal marketplace account.</li>
              <li>Fulfilling orders, calculating shipping coordinates, and tracking deliveries.</li>
              <li>Improving our web application experience and preventing fraudulent activity.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="flex items-center justify-center h-6.5 w-6.5 rounded-full bg-slate-100 text-slate-700 text-xs font-black">
                3
              </span>
              Sharing of Information
            </h2>
            <p className="pl-8 text-slate-500 text-sm font-semibold">
              Bezon does not sell your information. We only share details with trusted partners:
            </p>
            <ul className="list-disc pl-14 text-slate-500 text-xs sm:text-sm font-semibold flex flex-col gap-1.5">
              <li><strong>Delivery Partners</strong>: Your name, phone, and address are shared with delivery staff to ship products.</li>
              <li><strong>Sellers</strong>: Store managers receive your product options to pack and ship items.</li>
              <li><strong>Compliance</strong>: Under legal audit requirements, if officially mandated by regulatory laws.</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="flex items-center justify-center h-6.5 w-6.5 rounded-full bg-slate-100 text-slate-700 text-xs font-black">
                4
              </span>
              Cookies & Browsing Tokens
            </h2>
            <p className="pl-8 text-slate-500 text-sm font-semibold">
              We use secure cookies to keep you signed in between sessions and protect your shopping cart parameters.
              By navigating our website, you approve these standard security cookies. You can manage cookies inside
              your browser settings at any time.
            </p>
          </div>

          {/* Section 5 */}
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="flex items-center justify-center h-6.5 w-6.5 rounded-full bg-slate-100 text-slate-700 text-xs font-black">
                5
              </span>
              Contact Us & Support
            </h2>
            <p className="pl-8 text-slate-500 text-sm font-semibold">
              If you have any questions about this Privacy Policy or wish to request data erasure or profile exports,
              please reach out to our privacy officer at <strong>privacy@bezon.app</strong>.
            </p>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};
