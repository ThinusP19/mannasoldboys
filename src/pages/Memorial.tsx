import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Calendar, ArrowLeft } from "lucide-react";
import SEO, { pageSEO } from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import { memorialsApi, alumniApi } from "@/lib/api";
import { MemorialDetailDialog } from "@/components/MemorialDetailDialog";
import { MembershipGate } from "@/components/MembershipGate";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const Memorial = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

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

  // Fetch memorials from real API
  const { data: memorials = [], isLoading, error } = useQuery({
    queryKey: ["memorials"],
    queryFn: () => memorialsApi.getAll(),
  });

  // Filter memorials by user's year group
  // Only show memorials that match the user's year OR have no year specified (visible to all)
  const filteredMemorials = memorials.filter((memorial: any) => {
    // If memorial has no year, show to everyone
    if (!memorial.year) return true;
    // If user has no year set, don't show year-specific memorials
    if (!currentUserYear) return false;
    // Show if memorial year matches user's year (convert to numbers for comparison)
    return Number(memorial.year) === Number(currentUserYear);
  });

  // Selected memorial for detail view
  const [selectedMemorial, setSelectedMemorial] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const handleViewDetails = (memorial: any) => {
    setSelectedMemorial(memorial);
    setIsDetailOpen(true);
  };

  // Handle URL parameter for navigation from search
  useEffect(() => {
    const memorialParam = searchParams.get("memorial");
    if (memorialParam && memorials.length > 0) {
      const memorial = memorials.find((m: any) => m.id === memorialParam);
      if (memorial && !isDetailOpen) {
        setSelectedMemorial(memorial);
        setIsDetailOpen(true);
        // Clear URL params after opening
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("memorial");
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [searchParams, memorials, isDetailOpen, setSearchParams]);

  return (
    <>
      <SEO {...pageSEO.memorials} />
      <AppLayout title={t('memorial.title')}>
      <MembershipGate
        isMember={isMember}
        pageTitle={t('memorial.title')}
        pageDescription={t('memorial.member_gate_desc')}
      >
      <div className="p-4 md:p-6 bg-[#f5f0e8] min-h-full">
        {/* Mobile Back Button */}
        <div className="md:hidden mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/profile")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('nav.back_to_profile')}
          </Button>
        </div>
        {/* Desktop View */}
        <div className="hidden md:block space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-1">{t('memorial.title')}</h2>
            <p className="text-muted-foreground">{t('memorial.description')}</p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t('memorial.loading')}</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{t('memorial.error')}</p>
            </div>
          ) : filteredMemorials.length === 0 ? (
            <div className="text-center py-12">
              <Card className="border-0 shadow-sm bg-white p-8">
                <p className="text-muted-foreground text-lg">{t('memorial.no_memorials')}</p>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMemorials.map((memorial: any) => (
              <Card
                key={memorial.id}
                className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white cursor-pointer"
                onClick={() => handleViewDetails(memorial)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      {memorial.photo ? (
                        <img src={memorial.photo} alt={memorial.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <Heart className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{memorial.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{t('profile.class_of', { year: memorial.year })}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-3">{memorial.tribute}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{t('memorial.passed_away', { date: new Date(memorial.dateOfPassing).toLocaleDateString() })}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          )}
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-4">
          {/* Header */}
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-[#1a1f2c]">{t('memorial.title')}</h1>
            <p className="text-sm text-[#6b7280] mt-1">{t('memorial.description_short')}</p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="bg-white rounded-2xl shadow-md p-8">
                <p className="text-[#6b7280]">{t('memorial.loading')}</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-white rounded-2xl shadow-md p-8">
                <p className="text-red-600">{t('memorial.error')}</p>
              </div>
            </div>
          ) : filteredMemorials.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white rounded-2xl shadow-md p-8">
                <Heart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-[#6b7280]">{t('memorial.no_memorials')}</p>
              </div>
            </div>
          ) : (
            memorials.map((memorial: any) => (
              <div
                key={memorial.id}
                className="bg-white rounded-2xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleViewDetails(memorial)}
              >
                {/* Memorial Card Content */}
                <div className="p-4">
                  {/* Profile Row */}
                  <div className="flex items-center gap-4 mb-4">
                    {/* Photo */}
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border-2 border-gray-200">
                      {memorial.photo ? (
                        <img
                          src={memorial.photo}
                          alt={memorial.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <Heart className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Name & Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-[#1a1f2c] truncate">{memorial.name}</h3>
                      <p className="text-sm text-[#6b7280]">{t('profile.class_of', { year: memorial.year })}</p>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-[#9ca3af]">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(memorial.dateOfPassing).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tribute Preview */}
                  <p className="text-sm text-[#374151] line-clamp-2 mb-4">{memorial.tribute}</p>

                  {/* View Tribute Button */}
                  <button className="w-full py-3 bg-[#1a1f2c] text-white rounded-xl font-medium text-sm hover:bg-[#2d3748] transition-colors flex items-center justify-center gap-2">
                    <Heart className="w-4 h-4" />
                    {t('memorial.view_tribute')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      </MembershipGate>
      </AppLayout>

    {/* Memorial Detail Dialog */}
    <MemorialDetailDialog
      memorial={selectedMemorial}
      open={isDetailOpen}
      onOpenChange={setIsDetailOpen}
    />
    </>
  );
};

export default Memorial;
