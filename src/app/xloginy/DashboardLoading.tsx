"use client";
import Lottie from "lottie-react";
import animationData from "../../../public/lottie/search-package.json";

export default function DashboardLoading() {
  return (
    <div
      role="status"
      className="rounded-2xl border border-outline bg-white px-6 py-10 text-center"
    >
      <div
        aria-hidden="true"
        className="mx-auto h-24 w-24 motion-reduce:hidden"
      >
        <Lottie animationData={animationData} loop />
      </div>
      <p className="text-sm font-semibold text-brandInk">
        Loading your dashboard…
      </p>
    </div>
  );
}
