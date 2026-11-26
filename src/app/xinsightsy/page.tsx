"use client";

import { AdminNav } from "../AdminNav";
import { AdminLoginCard } from "../AdminLoginCard";
import { useAdminSession } from "../useAdminSession";
import { CampaignsSection } from "./sections/CampaignsSection";
import { AudienceSection } from "./sections/AudienceSection";
import { DataHealthSection } from "./sections/DataHealthSection";
import { DestinationsSection } from "./sections/DestinationsSection";
import { FunnelSection } from "./sections/FunnelSection";
import { LocationsSection } from "./sections/LocationsSection";
import { OverviewSection } from "./sections/OverviewSection";
import { PeakTimesSection } from "./sections/PeakTimesSection";
import { ScreensSection } from "./sections/ScreensSection";
import { SearchesSection } from "./sections/SearchesSection";
import { AcquisitionSection } from "./sections/AcquisitionSection";
import { CustomersSection } from "./sections/CustomersSection";
import { MarketingToolsSection } from "./sections/MarketingToolsSection";
import { OpportunitiesSection } from "./sections/OpportunitiesSection";
import { PromotionsSection } from "./sections/PromotionsSection";
import { SeasonsSection } from "./sections/SeasonsSection";
import { TrendSection } from "./sections/TrendSection";
import { InsightsFilterBar, useInsightsFilters } from "./ui/filters";

export default function AdminInsightsPage() {
  const session = useAdminSession();
  const [filters, setFilters] = useInsightsFilters();
  const { token, logout } = session;

  if (!token) {
    return (
      <AdminLoginCard
        email={session.email}
        error={session.error}
        isLoggingIn={session.isLoggingIn}
        onSubmit={async (event) => {
          await session.login(event);
        }}
        password={session.password}
        setEmail={session.setEmail}
        setPassword={session.setPassword}
      />
    );
  }

  return (
    <>
      <AdminNav session={session} />
      <main className="min-h-screen bg-cloud px-6 py-7 md:px-9">
        <h1 className="font-display text-[26px] font-black tracking-tight text-midnight md:text-[30px]">Growth insights</h1>
        <InsightsFilterBar filters={filters} onChange={setFilters} />
        <div className="mt-6 grid gap-8">
          <OpportunitiesSection token={token} filters={filters} onUnauthorized={logout} />
          <OverviewSection token={token} filters={filters} onUnauthorized={logout} />
          <TrendSection token={token} filters={filters} onUnauthorized={logout} />
          <LocationsSection token={token} filters={filters} onUnauthorized={logout} />
          <AudienceSection token={token} filters={filters} onUnauthorized={logout} />
          <ScreensSection token={token} filters={filters} onUnauthorized={logout} />
          <DestinationsSection token={token} filters={filters} onUnauthorized={logout} />
          <SearchesSection token={token} filters={filters} onUnauthorized={logout} />
          <PeakTimesSection token={token} filters={filters} onUnauthorized={logout} />
          <FunnelSection token={token} filters={filters} onUnauthorized={logout} />
          <CampaignsSection token={token} filters={filters} onUnauthorized={logout} />
          <PromotionsSection token={token} filters={filters} onUnauthorized={logout} />
          <CustomersSection token={token} filters={filters} onUnauthorized={logout} />
          <SeasonsSection token={token} filters={filters} onUnauthorized={logout} />
          <AcquisitionSection token={token} filters={filters} onUnauthorized={logout} />
          <DataHealthSection token={token} filters={filters} onUnauthorized={logout} />
          <MarketingToolsSection token={token} filters={filters} onUnauthorized={logout} />
        </div>
      </main>
    </>
  );
}
