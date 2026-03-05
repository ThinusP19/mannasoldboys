import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  Linkedin,
  Instagram,
  Facebook,
  Calendar,
  User,
  MessageCircle,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface MemberProfileDialogProps {
  member: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MemberProfileDialog = ({ member, open, onOpenChange }: MemberProfileDialogProps) => {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!member) return null;

  const hasContactInfo = member.email || member.phone;
  const hasSocialMedia = member.linkedin || member.instagram || member.facebook;
  const hasPhotos = member.thenPhoto || member.nowPhoto;

  const content = (
    <>
      {/* Header with close button */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between bg-[#f5f0e8]">
        {isMobile ? (
          <SheetTitle className="sr-only">{t('profile.member_profile')}</SheetTitle>
        ) : (
          <DialogTitle className="sr-only">{t('profile.member_profile')}</DialogTitle>
        )}
        <div></div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          className="h-10 w-10 rounded-full bg-white shadow-md hover:bg-gray-50"
        >
          <X className="w-5 h-5 text-[#1a1f2c]" />
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="space-y-4">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-md p-5">
            {/* Profile Header Row */}
            <div className="flex items-start gap-4 mb-4">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-lg">
                <Avatar className="w-full h-full">
                  <AvatarImage src={member.nowPhoto || member.thenPhoto} alt={member.name || "Profile"} />
                  <AvatarFallback className="bg-[#1e3a5f] text-white text-2xl font-bold">
                    {(member.name || "A").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-[#1a1f2c] truncate">{member.name || t('profile.no_name')}</h2>
                {member.year && (
                  <div className="inline-flex items-center gap-1.5 bg-sky-100 text-[#3b82f6] px-3 py-1 rounded-full text-xs font-medium mt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{t('profile.class_of', { year: member.year })}</span>
                  </div>
                )}
                {member.isMember && (
                  <Badge variant="default" className="text-xs px-2 py-0.5 h-5 mt-1 ml-1 bg-green-100 text-green-700 border-green-300">
                    {t('membership.member')}
                  </Badge>
                )}
              </div>
            </div>

            {/* Bio */}
            {member.bio && (
              <p className="text-sm text-[#6b7280] mb-4 leading-relaxed">{member.bio}</p>
            )}

            {/* Social Links Row */}
            {hasSocialMedia && (
              <div className="flex items-center gap-4 pt-4 border-t border-[#e5e7eb]">
                {member.linkedin && (
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-[#6b7280] hover:text-[#4b5563] transition-colors"
                  >
                    <Linkedin className="w-5 h-5 text-[#0A66C2]" />
                    <span>LinkedIn</span>
                  </a>
                )}
                {member.instagram && (
                  <a
                    href={member.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-[#6b7280] hover:text-[#4b5563] transition-colors"
                  >
                    <Instagram className="w-5 h-5 text-[#E1306C]" />
                    <span>Instagram</span>
                  </a>
                )}
                {member.facebook && (
                  <a
                    href={member.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-[#6b7280] hover:text-[#4b5563] transition-colors"
                  >
                    <Facebook className="w-5 h-5 text-[#1877F2]" />
                    <span>Facebook</span>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Then & Now Photos */}
          {hasPhotos && (
            <div className="bg-white rounded-2xl shadow-md p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#3b82f6]/10 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-[#3b82f6]" />
                </div>
                <h3 className="text-base font-semibold text-[#1a1f2c]">{t('profile.then_now')}</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* Then Photo */}
                {member.thenPhoto && (
                  <div className="aspect-square rounded-xl overflow-hidden bg-[#f3f4f6] relative">
                    <img
                      src={member.thenPhoto}
                      alt="Then"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-white text-sm font-medium text-center">{t('profile.then')}</p>
                    </div>
                  </div>
                )}
                {/* Now Photo */}
                {member.nowPhoto && (
                  <div className="aspect-square rounded-xl overflow-hidden bg-[#f3f4f6] relative">
                    <img
                      src={member.nowPhoto}
                      alt="Now"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-white text-sm font-medium text-center">{t('profile.now')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact Information */}
          {hasContactInfo && (
            <div className="bg-white rounded-2xl shadow-md p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#10b981]/10 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-[#10b981]" />
                </div>
                <h3 className="text-base font-semibold text-[#1a1f2c]">{t('profile.contact_info')}</h3>
              </div>
              <div className="space-y-3">
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="flex items-center gap-3 p-3 bg-[#f5f0e8] rounded-xl hover:bg-[#ebe5dc] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#6b7280]">{t('profile.email')}</p>
                      <p className="text-sm font-medium text-[#1a1f2c] truncate">{member.email}</p>
                    </div>
                  </a>
                )}
                {member.phone && (
                  <div className="flex items-center gap-3 p-3 bg-[#f5f0e8] rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#6b7280]">{t('profile.phone')}</p>
                      <a href={`tel:${member.phone}`} className="text-sm font-medium text-[#1a1f2c]">
                        {member.phone}
                      </a>
                    </div>
                    <a
                      href="#"
                      className="inline-flex items-center bg-green-500 hover:bg-green-600 text-white rounded-full px-4 py-1.5 text-sm font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        // Remove all non-digits, handle +27 format (South Africa)
                        let phoneNumber = member.phone.replace(/\D/g, '');
                        // If starts with 0, replace with 27 (South Africa country code)
                        if (phoneNumber.startsWith('0')) {
                          phoneNumber = '27' + phoneNumber.substring(1);
                        }
                        const whatsappUrl = `https://wa.me/${phoneNumber}`;
                        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
                      }}
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      WhatsApp
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!member.bio && !hasContactInfo && !hasSocialMedia && !hasPhotos && (
            <div className="bg-white rounded-2xl shadow-md p-8 text-center">
              <User className="w-12 h-12 mx-auto text-[#9ca3af] mb-3" />
              <p className="text-[#6b7280]">
                {t('profile.no_info_yet')}
              </p>
            </div>
          )}
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
