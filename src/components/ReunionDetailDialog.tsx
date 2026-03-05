import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Calendar, MapPin, Clock, Users, Check, X, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { reunionsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

interface Reunion {
  id: string;
  title: string;
  date: string;
  location: string;
  description?: string;
}

interface ReunionDetailDialogProps {
  reunion: Reunion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReunionDetailDialog = ({ reunion, open, onOpenChange }: ReunionDetailDialogProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStatus, setCurrentStatus] = useState<'coming' | 'maybe' | 'not_coming' | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check if user is registered and get their status
  const { data: registrationData } = useQuery({
    queryKey: ["reunion-registration", reunion?.id],
    queryFn: () => reunionsApi.checkRegistration(reunion!.id),
    enabled: !!reunion && !!user && open,
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (registrationData?.isRegistered && registrationData?.registration) {
      setCurrentStatus(registrationData.registration.status || 'coming');
    } else {
      setCurrentStatus(null);
    }
  }, [registrationData]);

  // RSVP mutation
  const rsvpMutation = useMutation({
    mutationFn: (status: 'coming' | 'maybe' | 'not_coming') => reunionsApi.register(reunion!.id, status),
    onSuccess: (data, status) => {
      setCurrentStatus(status);
      queryClient.invalidateQueries({ queryKey: ["reunion-registration", reunion?.id] });
      queryClient.invalidateQueries({ queryKey: ["reunions"] });
      toast({
        title: t('reunion.rsvp_updated'),
        description: status === 'coming'
          ? t('reunion.rsvp_coming')
          : status === 'maybe'
          ? t('reunion.rsvp_maybe')
          : t('reunion.rsvp_not_coming'),
        duration: 3000,
      });
    },
    onError: (error: any) => {
      toast({
        title: t('reunion.rsvp_failed'),
        description: error?.error || t('errors.try_again'),
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const handleRSVP = (status: 'coming' | 'maybe' | 'not_coming') => {
    if (!user) {
      toast({
        title: t('auth.login_required'),
        description: t('reunion.login_to_rsvp'),
        variant: "destructive",
        duration: 4000,
      });
      return;
    }
    rsvpMutation.mutate(status);
  };

  // Check if location is a URL
  const isUrl = (location: string) => {
    return location.startsWith('http://') || location.startsWith('https://');
  };

  // Extract search query from Google Maps URL or use location directly
  const getSearchQuery = (location: string): string => {
    if (!isUrl(location)) return location;

    // Try to extract coordinates @lat,lng
    const coordMatch = location.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (coordMatch) return `${coordMatch[1]},${coordMatch[2]}`;

    // Try to extract from /place/Name
    const placeMatch = location.match(/\/place\/([^/@]+)/);
    if (placeMatch) return decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));

    // Try query param ?q=
    const qMatch = location.match(/[?&]q=([^&]+)/);
    if (qMatch) return decodeURIComponent(qMatch[1].replace(/\+/g, ' '));

    return location;
  };

  // Get Google Maps embed URL
  const getGoogleMapsEmbedUrl = (location: string) => {
    const query = getSearchQuery(location);
    return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
  };

  // Get Google Maps link for the button
  const getGoogleMapsLink = (location: string) => {
    if (isUrl(location)) return location;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
  };

  // Get display text for location (don't show raw URLs)
  const getLocationDisplay = (location: string): string => {
    if (!isUrl(location)) return location;
    const query = getSearchQuery(location);
    // If we extracted something meaningful, show it; otherwise just say "View on map"
    if (query !== location && !query.match(/^-?\d+\.?\d*,-?\d+\.?\d*$/)) {
      return query;
    }
    return "Event Location";
  };

  if (!reunion) return null;

  const isUpcoming = new Date(reunion.date) >= new Date();
  const reunionDate = new Date(reunion.date);

  // Get status text for badge
  const getStatusText = (status: string) => {
    switch (status) {
      case 'coming': return t('reunion.going');
      case 'maybe': return t('reunion.maybe_badge');
      case 'not_coming': return t('reunion.cant_come');
      default: return '';
    }
  };

  const content = (
    <>
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-start justify-between bg-[#f5f0e8]">
        <div className="flex-1 pr-4">
          {isMobile ? (
            <SheetTitle className="text-xl font-bold text-[#1a1f2c] leading-tight">
              {reunion.title}
            </SheetTitle>
          ) : (
            <DialogTitle className="text-xl font-bold text-[#1a1f2c] leading-tight">
              {reunion.title}
            </DialogTitle>
          )}
          <Badge className={`mt-2 ${isUpcoming ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
            {isUpcoming ? t('reunion.upcoming_badge') : t('reunion.past_badge')}
          </Badge>
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
          {/* Date Card */}
          <div className="bg-white rounded-2xl shadow-md p-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#3b82f6]/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-[#3b82f6]" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-[#6b7280] font-medium mb-1">{t('reunion.date_time')}</p>
                <p className="text-[#1a1f2c] font-bold text-lg">
                  {reunionDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <div className="flex items-center gap-2 mt-2 text-sm text-[#6b7280]">
                  <Clock className="w-4 h-4" />
                  <span>{reunionDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Location Card with Map */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            {/* Google Maps Embed */}
            <div className="w-full h-48 bg-gray-200">
              <iframe
                src={getGoogleMapsEmbedUrl(reunion.location)}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Event Location"
              />
            </div>

            {/* Location Info */}
            <div className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#10b981]/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-[#10b981]" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-[#6b7280] font-medium mb-1">{t('reunion.location')}</p>
                  <p className="text-[#1a1f2c] font-semibold text-sm">{getLocationDisplay(reunion.location)}</p>
                </div>
              </div>

              {/* View on Google Maps Button */}
              <a
                href={getGoogleMapsLink(reunion.location)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-[#10b981] text-white rounded-xl font-medium hover:bg-[#059669] transition-colors"
              >
                <MapPin className="w-4 h-4" />
                {t('reunion.view_map')}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Description Card */}
          {reunion.description && (
            <div className="bg-white rounded-2xl shadow-md p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#8b5cf6]/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-[#8b5cf6]" />
                </div>
                <h3 className="text-base font-semibold text-[#1a1f2c]">{t('reunion.event_details')}</h3>
              </div>
              <p className="text-[#6b7280] text-sm leading-relaxed whitespace-pre-wrap">
                {reunion.description}
              </p>
            </div>
          )}

          {/* RSVP Section */}
          {isUpcoming && user && (
            <div className="bg-black rounded-2xl shadow-md p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-white">{t('reunion.interested')}</p>
                  <p className="text-sm text-gray-400">{t('reunion.let_us_know')}</p>
                </div>
                {currentStatus && (
                  <Badge className="bg-green-500 text-white">
                    <Check className="w-3 h-3 mr-1" />
                    {getStatusText(currentStatus)}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  className={`w-full h-12 text-sm font-medium rounded-xl ${
                    currentStatus === 'coming'
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  }`}
                  onClick={() => handleRSVP('coming')}
                  disabled={rsvpMutation.isPending}
                >
                  {currentStatus === 'coming' ? '✓ ' : ''}{t('reunion.going')}
                </Button>
                <Button
                  className={`w-full h-12 text-sm font-medium rounded-xl ${
                    currentStatus === 'maybe'
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  }`}
                  onClick={() => handleRSVP('maybe')}
                  disabled={rsvpMutation.isPending}
                >
                  {currentStatus === 'maybe' ? '✓ ' : ''}{t('reunion.maybe_badge')}
                </Button>
                <Button
                  className={`w-full h-12 text-sm font-medium rounded-xl ${
                    currentStatus === 'not_coming'
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  }`}
                  onClick={() => handleRSVP('not_coming')}
                  disabled={rsvpMutation.isPending}
                >
                  {currentStatus === 'not_coming' ? '✓ ' : ''}{t('reunion.cant_come')}
                </Button>
              </div>
              <p className="text-xs text-gray-400 text-center mt-3">
                <Users className="w-3 h-3 inline mr-1" />
                {t('reunion.join_alumni')}
              </p>
            </div>
          )}

          {/* Not logged in message */}
          {isUpcoming && !user && (
            <div className="bg-white rounded-2xl shadow-md p-4">
              <div className="text-center py-4">
                <p className="text-sm text-[#6b7280]">
                  {t('reunion.login_to_rsvp')}
                </p>
              </div>
            </div>
          )}

          {/* Past Event Message */}
          {!isUpcoming && (
            <div className="bg-white rounded-2xl shadow-md p-4">
              <div className="text-center py-4">
                <p className="text-sm text-[#6b7280]">
                  {t('reunion.past_event_message')}
                </p>
              </div>
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
      <SheetContent side="bottom" className="w-full h-[90vh] rounded-t-3xl overflow-hidden flex flex-col p-0 bg-[#f5f0e8] [&>button]:hidden">
        {content}
      </SheetContent>
    </Sheet>
  );
};
