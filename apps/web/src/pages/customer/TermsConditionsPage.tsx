import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bezon/ui";
import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeftIcon, FileTextIcon, ScalesIcon } from "@phosphor-icons/react";
export const TermsConditionsPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      {/* Header back navigation link */}
      <div className="flex items-center">
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-teal-600 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Profile
        </Link>
      </div>

      <Card className="border border-zinc-200 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardHeader className="bg-zinc-50 border-b border-zinc-100 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
              <FileTextIcon className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-extrabold text-zinc-800">
                Terms & Conditions
              </CardTitle>
              <CardDescription className="text-zinc-500 font-medium mt-1">
                Last updated: June 1, 2026
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 flex flex-col gap-8 text-zinc-600 text-sm sm:text-base leading-relaxed">
          {/* Introduction block */}
          <div className="bg-teal-50/50 rounded-2xl border border-teal-100 p-5 flex gap-4">
            <ScalesIcon className="h-6 w-6 text-teal-600 shrink-0 mt-0.5" />
            <div className="text-zinc-700 text-xs sm:text-sm font-medium">
              Welcome to <strong>Bezon E-Commerce</strong>! By creating an
              account or visiting our online marketplace, you explicitly agree
              to follow our service rules. Please read these terms carefully.
            </div>
          </div>

          {/* Section 1 */}
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-zinc-800 flex items-center gap-2">
              <span className="flex items-center justify-center h-6.5 w-6.5 rounded-full bg-zinc-100 text-zinc-700 text-xs font-black">
                1
              </span>
              User Accounts & Security
            </h2>
            <p className="pl-8 text-zinc-500 text-sm font-semibold">
              When creating an account, you must provide accurate, complete
              information. You are solely responsible for safeguarding the
              password of your secure account and for all activities that happen
              under it. Bezon reserves the right to deactivate accounts
              violating safety policies.
            </p>
          </div>

          {/* Section 2 */}
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-zinc-800 flex items-center gap-2">
              <span className="flex items-center justify-center h-6.5 w-6.5 rounded-full bg-zinc-100 text-zinc-700 text-xs font-black">
                2
              </span>
              Purchases, Pricing & Payments
            </h2>
            <p className="pl-8 text-zinc-500 text-sm font-semibold">
              All product prices on our marketplace are displayed clearly and
              are subject to change. By submitting an order, you authorization
              us to charge the selected payment method. We use secure, certified
              third-party payment gateways (like Razorpay) to complete all
              payment processes safely.
            </p>
          </div>

          {/* Section 3 */}
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-zinc-800 flex items-center gap-2">
              <span className="flex items-center justify-center h-6.5 w-6.5 rounded-full bg-zinc-100 text-zinc-700 text-xs font-black">
                3
              </span>
              Sellers & Content
            </h2>
            <p className="pl-8 text-zinc-500 text-sm font-semibold">
              Sellers on Bezon are third-party merchants who register their
              stores. They are fully responsible for the legality, accuracy of
              specifications, images, and inventory parameters of their
              products. Bezon strives to audit store listings but does not
              guarantee merchant descriptions.
            </p>
          </div>

          {/* Section 4 */}
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-zinc-800 flex items-center gap-2">
              <span className="flex items-center justify-center h-6.5 w-6.5 rounded-full bg-zinc-100 text-zinc-700 text-xs font-black">
                4
              </span>
              Intellectual Property Rights
            </h2>
            <p className="pl-8 text-zinc-500 text-sm font-semibold">
              The Bezon brand, design style, application logo, codebase, icons,
              layouts, and graphical elements are protected under trademark and
              copywrite laws. You are strictly forbidden from scraping, copying,
              or modifying our application without our explicit written
              permission.
            </p>
          </div>

          {/* Section 5 */}
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-zinc-800 flex items-center gap-2">
              <span className="flex items-center justify-center h-6.5 w-6.5 rounded-full bg-zinc-100 text-zinc-700 text-xs font-black">
                5
              </span>
              Limitation of Liability
            </h2>
            <p className="pl-8 text-zinc-500 text-sm font-semibold">
              Bezon is provided on an "as is" and "as available" basis without
              warranties of any kind. Under no circumstances shall Bezon be
              liable for any direct, indirect, incidental, or special damages
              arising out of your use or inability to use our e-commerce
              platform.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
