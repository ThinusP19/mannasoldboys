import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Heart, MapPin, Phone, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface Memorial {
  id: string;
  name: string;
  year: number;
  photo?: string;
  image?: string;
  imageLink?: string;
  tribute: string;
  dateOfPassing: string;
  funeralDate?: string;
  funeralLocation?: string;
  contactNumber?: string;
}

interface MemorialDetailDialogProps {
  memorial: Memorial | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MemorialDetailDialog = ({ memorial, open, onOpenChange }: MemorialDetailDialogProps) => {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!memorial) return null;

  // Check all possible image fields
  const photoUrl = memorial.photo || memorial.image || memorial.imageLink;

  // Get Google Maps link for funeral location
  const getGoogleMapsLink = (location: string) => {
    if (location.startsWith('http://') || location.startsWith('https://')) {
      return location;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
  };

  const content = (
    <>
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-start justify-between bg-[#f5f0e8]">
        <div className="flex-1 pr-4">
          {isMobile ? (
            <SheetTitle className="text-xl font-bold text-[#1a1f2c] leading-tight">
              {t('memorial.title')}
            </SheetTitle>
          ) : (
            <DialogTitle className="text-xl font-bold text-[#1a1f2c] leading-tight">
              {t('memorial.title')}
            </DialogTitle>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          className="h-10 w-10 rounded-full bg-white shadow-md hover:bg-gray-50 flex-shrink-0"
        >
          <X className="w-5 h-5 text-[#1a1f2c]" />
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="space-y-4">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-md p-5">
            <div className="flex flex-col items-center text-center">
              {/* Photo */}
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 mb-4 border-4 border-white shadow-lg">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={memorial.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <Heart className="w-10 h-10 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Name & Year */}
              <h2 className="text-xl font-bold text-[#1a1f2c] mb-1">{memorial.name}</h2>
              <p className="text-sm text-[#6b7280]">{t('profile.class_of', { year: memorial.year })}</p>

              {/* Date of Passing */}
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm text-[#6b7280]">
                <Calendar className="w-4 h-4" />
                <span>{new Date(memorial.dateOfPassing).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
            </div>
          </div>

          {/* Tribute Card */}
          <div className="bg-white rounded-2xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <Heart className="w-4 h-4 text-red-500" />
              </div>
              <h3 className="text-base font-semibold text-[#1a1f2c]">{t('memorial.tribute')}</h3>
            </div>
            <p className="text-[#374151] text-base leading-relaxed whitespace-pre-wrap">
              {memorial.tribute}
            </p>
          </div>

          {/* Funeral Details Card - Only show if there's funeral info */}
          {(memorial.funeralDate || memorial.funeralLocation || memorial.contactNumber) && (
            <div className="bg-white rounded-2xl shadow-md p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#8b5cf6]/10 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-[#8b5cf6]" />
                </div>
                <h3 className="text-base font-semibold text-[#1a1f2c]">Funeral Details</h3>
              </div>

              <div className="space-y-4">
                {memorial.funeralDate && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#3b82f6]/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-[#3b82f6]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#6b7280] font-medium">{t('memorial.funeral_date')}</p>
                      <p className="text-[#1a1f2c] font-semibold">
                        {new Date(memorial.funeralDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {memorial.funeralLocation && (
                  <div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#10b981]/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-[#10b981]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-[#6b7280] font-medium">{t('memorial.funeral_loc')}</p>
                        <p className="text-[#1a1f2c] font-semibold">{memorial.funeralLocation}</p>
                      </div>
                    </div>
                    {/* View on Google Maps Button */}
                    <a
                      href={getGoogleMapsLink(memorial.funeralLocation)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 w-full flex items-center justify-center gap-2 py-3 bg-[#10b981] text-white rounded-xl font-medium hover:bg-[#059669] transition-colors"
                    >
                      <MapPin className="w-4 h-4" />
                      {t('reunion.view_map')}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}

                {memorial.contactNumber && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#f59e0b]/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-[#f59e0b]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-[#6b7280] font-medium">{t('memorial.contact_num')}</p>
                      <a href={`tel:${memorial.contactNumber}`} className="text-[#1a1f2c] font-semibold hover:underline">
                        {memorial.contactNumber}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Message */}
          <div className="bg-black rounded-2xl shadow-md p-6">
            <div className="flex flex-col items-center text-center">
              <Heart className="w-8 h-8 text-red-500 mb-3" />
              <p className="text-white font-semibold text-lg">Forever in our hearts</p>
              <p className="text-gray-400 text-sm mt-1">Rest in peace</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Desktop: centered Dialog
  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full max-w-2xl max-h-[80vh] rounded-2xl overflow-hidden flex flex-col p-0 bg-[#f5f0e8] [&>button]:hidden !h-auto">
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile: bottom Sheet
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="w-full h-[92vh] rounded-t-3xl overflow-hidden flex flex-col p-0 bg-[#f5f0e8] [&>button]:hidden">
        {content}
      </SheetContent>
    </Sheet>
  );
};
