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
    <div className="flex h-screen overflow-hidden bg-[#f5f0e8] md:p-2" style={{ overscrollBehavior: 'none' }}>
      <DesktopSidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden bg-[#f5f0e8] md:ml-2" style={{ overscrollBehavior: 'none' }}>
        <DesktopHeader title={title} />
        {title === "Directory" && (
          <MobileTopBar title={title} showFilter={showFilter} onFilterClick={onFilterClick} searchValue={searchValue} onSearchChange={onSearchChange} />
        )}
        
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0" style={{ overscrollBehavior: 'none', overscrollBehaviorY: 'none' }}>
          {children}
        </div>
      </main>
      
      <MobileBottomNav />
    </div>
  );
};
