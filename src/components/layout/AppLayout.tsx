import { ReactNode } from "react";
import { DesktopSidebar } from "./DesktopSidebar";
import { DesktopHeader } from "./DesktopHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileTopBar } from "./MobileTopBar";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showFilter?: boolean;
  onFilterClick?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export const AppLayout = ({ children, title = "Monnas Old Boys", showFilter, onFilterClick, searchValue, onSearchChange }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-[#f5f0e8] md:flex md:h-screen md:overflow-hidden md:p-2">
      <DesktopSidebar />

      <main className="flex-1 flex flex-col bg-[#f5f0e8] md:overflow-hidden md:ml-2">
        <DesktopHeader title={title} />
        {title === "Directory" && (
          <MobileTopBar title={title} showFilter={showFilter} onFilterClick={onFilterClick} searchValue={searchValue} onSearchChange={onSearchChange} />
        )}

        <div className="flex-1 pb-24 md:pb-0 md:overflow-y-auto">
          {children}
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
};
