import React from "react";
import HeroSection from "./_components/HeroSection";
import TabNavigation from "./_components/TabNavigation";
import Navbar from "@/components/Navbar";

const CompanyLinksLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <Navbar/>
      <div className="flex flex-col gap-4 md:gap-6 xl:gap-9 bg-[#F8F8FF]">
      <HeroSection />
      <div className="flex flex-col-reverse md:flex-row gap-6 md:gap-8 lg:gap-12 wrapper">
        <TabNavigation />
        <main className="w-full">{children}</main>
      </div>
    </div>
    </div>
  );
};
export default CompanyLinksLayout;
