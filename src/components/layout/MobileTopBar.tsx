import { Filter, Search } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useTranslation } from 'react-i18next';

interface MobileTopBarProps {
  title: string;
  showFilter?: boolean;
  onFilterClick?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export const MobileTopBar = ({ title, showFilter, onFilterClick, searchValue, onSearchChange }: MobileTopBarProps) => {
  const { t } = useTranslation();

  return (
    <header className="md:hidden sticky top-0 bg-transparent z-40">
      <div className="px-4 py-4">
        {title === "Directory" && (
          <>
            <h1 className="text-3xl font-bold mb-4">{t('directory.title')}</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('directory.search_placeholder')}
                className="pl-9 h-10 bg-white border"
                value={searchValue || ""}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
            </div>
          </>
        )}
        {title !== "Directory" && (
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">{title}</h1>
            {showFilter && (
              <Button variant="ghost" size="icon" onClick={onFilterClick}>
                <Filter className="w-5 h-5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
