import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SEO, { pageSEO } from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import { reunionsApi, alumniApi } from "@/lib/api";
import { ReunionDetailDialog } from "@/components/ReunionDetailDialog";
import { MembershipGate } from "@/components/MembershipGate";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const Reunions = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Fetch user data to check membership status
  const { data: userData } = useQuery({
    queryKey: ["alumni", "me"],
    queryFn: async () => {
      try {
        return await alumniApi.getMe();
      } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }
    },
    enabled: !!user,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  const isMember = userData?.isMember === true;
  const currentUserYear = userData?.profile?.year;

  // Fetch reunions from real API
  const { data: reunions = [], isLoading, error } = useQuery({
    queryKey: ["reunions"],
    queryFn: async () => {
      try {
        const data = await reunionsApi.getAll();
        console.log("✅ Reunions fetched:", data);
        return data;
      } catch (err) {
        console.error("❌ Error fetching reunions:", err);
        throw err;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Filter reunions by user's year group
  // Only show reunions where targetYearGroups is empty (for all) OR includes user's year
  const filteredReunions = reunions.filter((reunion: any) => {
    // Parse targetYearGroups - it might be a string or array
    let targetYears: number[] = [];
    if (reunion.targetYearGroups) {
      if (Array.isArray(reunion.targetYearGroups)) {
        targetYears = reunion.targetYearGroups;
      } else if (typeof reunion.targetYearGroups === 'string') {
        try {
          targetYears = JSON.parse(reunion.targetYearGroups);
        } catch {
          targetYears = [];
        }
      }
    }

    // If no target years specified, show to everyone
    if (!targetYears || targetYears.length === 0) return true;
    // If user has no year set, don't show year-specific reunions
    if (!currentUserYear) return false;
    // Show if user's year is in the target years (convert to numbers for comparison)
    return targetYears.map(Number).includes(Number(currentUserYear));
  });

  // Filter upcoming and past reunions
  const upcomingReunions = filteredReunions.filter((r: any) => new Date(r.date) >= new Date());
  const pastReunions = filteredReunions.filter((r: any) => new Date(r.date) < new Date());

  // Selected reunion for detail view
  const [selectedReunion, setSelectedReunion] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const handleViewDetails = (reunion: any) => {
    setSelectedReunion(reunion);
    setIsDetailOpen(true);
  };

  // Handle URL parameter for navigation from search
  useEffect(() => {
    const reunionParam = searchParams.get("reunion");
    if (reunionParam && reunions.length > 0) {
      const reunion = reunions.find((r: any) => r.id === reunionParam);
      if (reunion && !isDetailOpen) {
        setSelectedReunion(reunion);
        setIsDetailOpen(true);
        // Clear URL params after opening
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("reunion");
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [searchParams, reunions, isDetailOpen, setSearchParams]);

  return (
    <>
      <SEO {...pageSEO.reunions} />
      <AppLayout title={t('reunion.title')}>
      <MembershipGate
        isMember={isMember}
        pageTitle={t('reunion.title')}
        pageDescription={t('reunion.member_gate_desc')}
      >
      <div className="p-4 md:p-6 bg-[#f5f0e8] min-h-full">
        {/* Desktop View */}
        <div className="hidden md:block space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-1">{t('reunion.upcoming')}</h2>
            <p className="text-muted-foreground">{t('reunion.upcoming_desc')}</p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t('reunion.loading')}</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{t('reunion.error')}</p>
            </div>
          ) : upcomingReunions.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {upcomingReunions.map((reunion: any) => (
                <Card key={reunion.id} className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-xl mb-2">{reunion.title}</CardTitle>
                      <Badge className="bg-green-100 text-green-800">{t('reunion.upcoming_badge')}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Calendar className="w-5 h-5" />
                      <span>{new Date(reunion.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <MapPin className="w-5 h-5" />
                      <span>{reunion.location}</span>
                    </div>
                    <p className="text-foreground line-clamp-2">{reunion.description}</p>
                    <Button
                      className="w-full bg-accent text-white hover:bg-accent/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(reunion);
                      }}
                    >
                      {t('reunion.view_rsvp')}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">{t('reunion.no_upcoming')}</p>
              </CardContent>
            </Card>
          )}

          {/* Past Reunions Section */}
          {!isLoading && !error && pastReunions.length > 0 && (
            <>
              <div className="pt-8">
                <h2 className="text-2xl font-bold text-foreground mb-1">{t('reunion.past')}</h2>
                <p className="text-muted-foreground">{t('reunion.past_desc')}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {pastReunions.map((reunion: any) => (
                  <Card key={reunion.id} className="border-0 shadow-sm bg-white opacity-75">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-xl mb-2">{reunion.title}</CardTitle>
                        <Badge variant="secondary">{t('reunion.past_badge')}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3 text-muted-foreground text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(reunion.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground text-sm">
                        <MapPin className="w-4 h-4" />
                        <span>{reunion.location}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-6">
          <div>
            <h2 className="text-2xl font-bold">{t('reunion.title')}</h2>
            <p className="text-sm text-muted-foreground">{t('reunion.join_events')}</p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t('reunion.loading')}</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{t('reunion.error')}</p>
            </div>
          ) : upcomingReunions.length > 0 ? (
            <>
              <div>
                <h3 className="font-semibold mb-3">{t('reunion.upcoming_badge')}</h3>
                <div className="space-y-4">
                  {upcomingReunions.map((reunion: any) => (
                    <Card key={reunion.id} className="border-0 shadow-sm bg-white">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{reunion.title}</CardTitle>
                          <Badge className="bg-green-100 text-green-800 text-xs">{t('reunion.upcoming_badge')}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(reunion.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <MapPin className="w-4 h-4" />
                          <span>{reunion.location}</span>
                        </div>
                        <p className="text-sm text-foreground line-clamp-2">{reunion.description}</p>
                        <Button
                          className="w-full bg-accent text-white hover:bg-accent/90"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(reunion);
                          }}
                        >
                          {t('reunion.view_rsvp')}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {pastReunions.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">{t('reunion.past_badge')}</h3>
                  <div className="space-y-4">
                    {pastReunions.map((reunion: any) => (
                      <Card key={reunion.id} className="border-0 shadow-sm bg-white opacity-75">
                        <CardContent className="p-4">
                          <p className="font-medium mb-2">{reunion.title}</p>
                          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(reunion.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground text-xs">
                            <MapPin className="w-3 h-3" />
                            <span>{reunion.location}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">{t('reunion.no_upcoming')}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </MembershipGate>
    </AppLayout>

    {/* Reunion Detail Dialog */}
    <ReunionDetailDialog
      reunion={selectedReunion}
      open={isDetailOpen}
      onOpenChange={setIsDetailOpen}
    />
    </>
  );
};

export default Reunions;
