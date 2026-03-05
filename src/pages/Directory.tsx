import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import { AppLayout } from "@/components/layout/AppLayout";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users, X, Calendar, ArrowLeft } from "lucide-react";
import { MembershipGate } from "@/components/MembershipGate";
import { MemberProfileDialog } from "@/components/MemberProfileDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { alumniApi, yearGroupsApi, yearGroupPostsApi } from "@/lib/api";

const Directory = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [yearFilter, setYearFilter] = useState<string>("");
  const { user } = useAuth();
  const [selectedYearGroup, setSelectedYearGroup] = useState<any | null>(null);
  const [isYearGroupDialogOpen, setIsYearGroupDialogOpen] = useState(false);
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [isMemberProfileOpen, setIsMemberProfileOpen] = useState(false);
  const [activeImageIndices, setActiveImageIndices] = useState<Record<string, number>>({});
  const carouselRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCarouselScroll = useCallback((postId: string, e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollLeft = container.scrollLeft;
    const width = container.clientWidth;
    const index = Math.round(scrollLeft / width);
    setActiveImageIndices(prev => ({ ...prev, [postId]: index }));
  }, []);

  // Fetch user data to check membership status
  const { data: userData } = useQuery({
    queryKey: ["alumni", "me"],
    queryFn: async () => {
      try {
        return await alumniApi.getMe();
      } catch (error) {
        if (import.meta.env.DEV) console.error("Error fetching user profile:", error);
        return null;
      }
    },
    enabled: !!user,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  const isMember = userData?.isMember === true;
  const currentUserYear = userData?.profile?.year;

  // Fetch all year groups
  const { data: allYearGroups = [], isLoading, error: yearGroupsError } = useQuery({
    queryKey: ["all-year-groups"],
    queryFn: async () => {
      try {
        return await yearGroupsApi.getAll();
      } catch (error: any) {
        // Only log non-timeout errors in development
        if (import.meta.env.DEV) {
          const isTimeout = error?.error?.includes("timeout") || error?.details?.includes("timeout");
          if (!isTimeout) {
            console.error("Error fetching year groups:", error);
          }
        }
        return [];
      }
    },
    enabled: isMember,
    refetchOnWindowFocus: false,
    staleTime: 1 * 60 * 1000, // Consider data fresh for 1 minute
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
    retry: false, // Don't retry on error
  });

  // Fetch members for selected year group
  const { data: rawYearGroupMembers, isLoading: isLoadingMembers, error: membersError } = useQuery({
    queryKey: ["year-group-members", selectedYearGroup?.year],
    queryFn: async () => {
      if (!selectedYearGroup?.year) return null;
      try {
        return await yearGroupsApi.getMembersByYear(selectedYearGroup.year);
      } catch (error: any) {
        // Only log non-timeout errors in development
        if (import.meta.env.DEV) {
          const isTimeout = error?.error?.includes("timeout") || error?.details?.includes("timeout");
          if (!isTimeout) {
            console.error("Error fetching year group members:", error);
          }
        }
        return null;
      }
    },
    enabled: !!selectedYearGroup?.year,
    staleTime: 1 * 60 * 1000, // Consider data fresh for 1 minute
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
    retry: false,
  });

  // Filter members based on contactPermission
  const yearGroupMembers = rawYearGroupMembers ? {
    ...rawYearGroupMembers,
    members: rawYearGroupMembers.members.filter((member: any) => {
      // If permission is 'none', hide from everyone
      if (member.contactPermission === 'none') {
        return false;
      }
      // If permission is 'year-group', only show to same year
      if (member.contactPermission === 'year-group') {
        return member.year === currentUserYear;
      }
      // If permission is 'all', show to everyone
      return true;
    }),
    totalMembers: rawYearGroupMembers.members.filter((member: any) => {
      if (member.contactPermission === 'none') {
        return false;
      }
      if (member.contactPermission === 'year-group') {
        return member.year === currentUserYear;
      }
      return true;
    }).length
  } : null;

  // Fetch full year group data when one is selected (includes ALL photos)
  const { data: fullYearGroupData } = useQuery({
    queryKey: ["year-group-full", selectedYearGroup?.year],
    queryFn: async () => {
      if (!selectedYearGroup?.year) return null;
      try {
        return await yearGroupsApi.getByYear(selectedYearGroup.year);
      } catch (error) {
        if (import.meta.env.DEV) console.error("Error fetching full year group:", error);
        return null;
      }
    },
    enabled: !!selectedYearGroup?.year && isYearGroupDialogOpen,
    staleTime: 1 * 60 * 1000,
  });

  // Fetch posts for selected year group
  const { data: yearGroupPosts = [] } = useQuery({
    queryKey: ["year-group-posts", selectedYearGroup?.id],
    queryFn: async () => {
      if (!selectedYearGroup?.id) return [];
      try {
        return await yearGroupPostsApi.getByYearGroup(selectedYearGroup.id);
      } catch (error) {
        if (import.meta.env.DEV) console.error("Error fetching year group posts:", error);
        return [];
      }
    },
    enabled: !!selectedYearGroup?.id,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every 1 minute (posts change more frequently)
  });

  const filteredGroups = yearFilter === ""
    ? allYearGroups
    : allYearGroups.filter((g: any) => g.year.toString().includes(yearFilter));

  const handleYearGroupClick = (yearGroup: any) => {
    setSelectedYearGroup(yearGroup);
    setIsYearGroupDialogOpen(true);
  };

  // Handle URL parameters for navigation from search
  useEffect(() => {
    const yearParam = searchParams.get("year");
    const memberParam = searchParams.get("member");

    if (yearParam && allYearGroups.length > 0) {
      const yearGroup = allYearGroups.find((g: any) => g.year.toString() === yearParam);
      if (yearGroup && !isYearGroupDialogOpen) {
        setSelectedYearGroup(yearGroup);
        setIsYearGroupDialogOpen(true);
        // Clear URL params after opening
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("year");
        setSearchParams(newParams, { replace: true });
      }
    }

    if (memberParam && yearGroupMembers?.members) {
      const member = yearGroupMembers.members.find((m: any) => m.id === memberParam);
      if (member && !isMemberProfileOpen) {
        setSelectedMember(member);
        setIsMemberProfileOpen(true);
        // Clear URL params after opening
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("member");
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [searchParams, allYearGroups, yearGroupMembers, isYearGroupDialogOpen, isMemberProfileOpen, setSearchParams]);

  // Listen for custom event from search
  useEffect(() => {
    const handleOpenYearGroup = (event: CustomEvent) => {
      const { year, yearGroup } = event.detail;
      if (yearGroup) {
        setSelectedYearGroup(yearGroup);
        setIsYearGroupDialogOpen(true);
      } else if (year && allYearGroups.length > 0) {
        const foundGroup = allYearGroups.find((g: any) => g.year.toString() === year.toString());
        if (foundGroup) {
          setSelectedYearGroup(foundGroup);
          setIsYearGroupDialogOpen(true);
        }
      }
    };

    window.addEventListener('openYearGroup', handleOpenYearGroup as EventListener);
    return () => window.removeEventListener('openYearGroup', handleOpenYearGroup as EventListener);
  }, [allYearGroups]);

  // Get all photos from the selected year group (use fullYearGroupData for complete list)
  const yearGroupPhotos = fullYearGroupData?.photos && fullYearGroupData.photos.length > 0
    ? fullYearGroupData.photos
    : fullYearGroupData?.groupPhoto
    ? [fullYearGroupData.groupPhoto]
    : selectedYearGroup?.photos && selectedYearGroup.photos.length > 0
    ? selectedYearGroup.photos
    : selectedYearGroup?.groupPhoto
    ? [selectedYearGroup.groupPhoto]
    : [];

  // Check if this is the user's own year group
  const isOwnYearGroup = selectedYearGroup?.year === currentUserYear;

  return (
    <AppLayout
      title={t('directory.title')}
      searchValue={yearFilter}
      onSearchChange={setYearFilter}
    >
      <MembershipGate
        isMember={isMember}
        pageTitle={t('directory.title')}
        pageDescription={t('directory.member_gate_desc')}
      >
        <div className="p-0 md:p-8 bg-[#f5f0e8] min-h-full">
          {/* Desktop Title */}
          <div className="hidden md:flex items-center justify-between mb-6 px-0">
            <h2 className="text-3xl font-bold">{t('directory.title')}</h2>
          </div>

          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t('directory.loading')}</p>
            </div>
          )}

          {yearGroupsError && !isLoading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-2">{t('directory.error')}</p>
              <p className="text-xs text-muted-foreground">{t('directory.try_again')}</p>
            </div>
          )}

          {!isLoading && !yearGroupsError && filteredGroups.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t('directory.no_groups')}</p>
            </div>
          )}

          {/* Mobile: Year Groups */}
          <div className="md:hidden px-4 pb-20">
            {/* Header with Back Button */}
            <div className="pt-4 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => navigate("/profile")}
                  className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"
                >
                  <ArrowLeft className="w-5 h-5 text-[#1a1f2c]" />
                </button>
                <h1 className="text-2xl font-bold text-[#1a1f2c]">{t('directory.title')}</h1>
              </div>
              <p className="text-sm text-[#6b7280] mt-1">{t('directory.browse_years')}</p>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
              <Input
                type="text"
                placeholder={t('directory.search_placeholder')}
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full h-12 bg-white border-0 shadow-sm rounded-xl px-4 text-base"
              />
            </div>

            {/* Year Groups Grid - 2 columns */}
            <div className="grid grid-cols-2 gap-3">
              {filteredGroups.map((group: any) => {
                const thumbnail = group.photos && group.photos.length > 0
                  ? group.photos[0]
                  : group.groupPhoto;

                return (
                  <div
                    key={group.year}
                    className="bg-white rounded-2xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow active:scale-[0.98]"
                    onClick={() => handleYearGroupClick(group)}
                  >
                    {/* Photo */}
                    <div className="aspect-square w-full overflow-hidden">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={t('profile.class_of', { year: group.year })}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#1e3a5f] to-[#3b82f6] flex items-center justify-center">
                          <Users className="w-12 h-12 text-white/50" />
                        </div>
                      )}
                    </div>
                    {/* Label */}
                    <div className="p-3 bg-black">
                      <p className="text-sm font-semibold text-white text-center">
                        {t('profile.class_of', { year: group.year })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty State */}
            {!isLoading && filteredGroups.length === 0 && yearFilter && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-[#9ca3af] mb-3" />
                <p className="text-[#6b7280]">{t('directory.no_groups')}</p>
              </div>
            )}
          </div>

          {/* Desktop: Year Groups Grid - 5 in a row */}
          <div className="hidden md:grid md:grid-cols-5 gap-3 w-full">
            {filteredGroups.map((group: any) => {
              const thumbnail = group.photos && group.photos.length > 0
                ? group.photos[0]
                : group.groupPhoto;

              return (
                <Card
                  key={group.year}
                  className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow w-full cursor-pointer"
                  onClick={() => handleYearGroupClick(group)}
                >
                  <CardHeader className="pb-2 px-3 pt-3">
                    <CardTitle className="text-sm font-semibold truncate">{t('profile.class_of', { year: group.year })}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 px-3 pb-3">
                    {thumbnail ? (
                      <div className="w-full aspect-square rounded-lg overflow-hidden border">
                        <img
                          src={thumbnail}
                          alt={t('profile.class_of', { year: group.year })}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-square rounded-lg border-2 border-dashed border-muted flex items-center justify-center bg-muted/20">
                        <p className="text-xs text-muted-foreground text-center px-1">{t('directory.no_photo')}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </MembershipGate>

      {/* Year Group Detail - Desktop Dialog / Mobile Sheet */}
      {!isMobile ? (
        <Dialog open={isYearGroupDialogOpen} onOpenChange={setIsYearGroupDialogOpen}>
          <DialogContent className="w-full max-w-2xl max-h-[80vh] rounded-2xl overflow-hidden flex flex-col p-0 bg-[#f5f0e8] [&>button]:hidden !h-auto">
            {/* Header with close button */}
            <div className="px-4 pt-4 pb-2 flex items-center justify-between bg-[#f5f0e8]">
              <DialogTitle className="text-xl font-bold text-[#1a1f2c]">
                {t('profile.class_of', { year: selectedYearGroup?.year })}
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsYearGroupDialogOpen(false)}
                className="h-10 w-10 rounded-full bg-white shadow-md hover:bg-gray-50"
              >
                <X className="w-5 h-5 text-[#1a1f2c]" />
              </Button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8" style={{ WebkitOverflowScrolling: 'touch' }}>
              {selectedYearGroup && (
                <div className="space-y-4">
                  {/* Members Button */}
                  {yearGroupMembers && (
                    <div
                      className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-md cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setIsMembersDialogOpen(true)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#1a1f2c]">{t('directory.all_members')}</p>
                          <p className="text-xs text-[#6b7280]">
                            {yearGroupMembers.totalMembers} {yearGroupMembers.totalMembers === 1 ? 'member' : 'members'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[#6b7280] text-lg">›</span>
                    </div>
                  )}

                  {/* About Section */}
                  {(fullYearGroupData?.yearInfo || selectedYearGroup.yearInfo) && (
                    <div className="bg-black rounded-2xl shadow-md p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-base font-semibold text-white">{t('directory.about')}</h3>
                      </div>
                      <p className="text-sm text-gray-300">{fullYearGroupData?.yearInfo || selectedYearGroup.yearInfo}</p>
                    </div>
                  )}

                  {/* Year Group Photos - Grid */}
                  {yearGroupPhotos.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-md p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-[#3b82f6]/10 flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-[#3b82f6]" />
                        </div>
                        <h3 className="text-base font-semibold text-[#1a1f2c]">{t('directory.photos')}</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {yearGroupPhotos.map((photo: string, idx: number) => (
                          <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-[#f3f4f6]">
                            <img
                              src={photo}
                              alt={`${t('profile.class_of', { year: selectedYearGroup.year })} - Photo ${idx + 1}`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Year Group Posts */}
                  {yearGroupPosts.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-base font-semibold text-[#1a1f2c] px-1">{t('admin.posts')}</h3>
                      {yearGroupPosts.map((post: any) => {
                        const authorName = post.author?.name || '';
                        const isAdmin = !post.author ||
                          post.author?.role === 'admin' ||
                          authorName.toLowerCase().includes('admin') ||
                          authorName === '';
                        const displayName = isAdmin ? 'Monnas Old Boys' : authorName;

                        return (
                          <div key={post.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                            {/* Post Header */}
                            <div className="p-4 pb-3">
                              <div className="flex items-center gap-3">
                                {isAdmin ? (
                                  <div className="w-10 h-10 rounded-sm overflow-hidden flex items-center justify-center">
                                    <img
                                      src="/cropped-skool-wapen.png"
                                      alt="Monnas Old Boys Alumni"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                                    {displayName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <p className="font-semibold text-sm text-[#1a1f2c]">{displayName}</p>
                                  <p className="text-xs text-[#6b7280]">
                                    {new Date(post.createdAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Post Images */}
                            {post.images && post.images.length > 0 && (
                              <div className="w-full aspect-square bg-gray-100 relative overflow-hidden">
                                {post.images.length > 1 ? (
                                  <div
                                    className="flex overflow-x-auto snap-x snap-mandatory h-full scrollbar-hide scroll-smooth touch-pan-x"
                                    onScroll={(e) => handleCarouselScroll(post.id, e)}
                                    ref={(el) => { carouselRefs.current[post.id] = el; }}
                                  >
                                    {post.images.map((image: string, idx: number) => (
                                      <div key={idx} className="w-full h-full flex-shrink-0 snap-center">
                                        <img
                                          src={image}
                                          alt={`${post.title} - Image ${idx + 1}`}
                                          className="w-full h-full object-cover"
                                          loading="lazy"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <img
                                    src={post.images[0]}
                                    alt={post.title}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                )}
                                {/* Image indicator dots */}
                                {post.images.length > 1 && (
                                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1.5">
                                    {post.images.map((_: string, idx: number) => (
                                      <div
                                        key={idx}
                                        className={`w-2 h-2 rounded-full transition-all ${
                                          (activeImageIndices[post.id] || 0) === idx
                                            ? 'bg-white scale-110'
                                            : 'bg-white/50'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Post Content */}
                            <div className="p-4 pt-3">
                              <h3 className="font-semibold text-base text-[#1a1f2c] mb-1">{post.title}</h3>
                              <p className="text-sm text-[#6b7280]">{post.content}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <Sheet open={isYearGroupDialogOpen} onOpenChange={setIsYearGroupDialogOpen}>
          <SheetContent side="bottom" className="w-full h-[92vh] rounded-t-3xl overflow-hidden flex flex-col p-0 bg-[#f5f0e8] [&>button]:hidden">
            {/* Header with close button */}
            <div className="px-4 pt-4 pb-2 flex items-center justify-between bg-[#f5f0e8]">
              <SheetTitle className="text-xl font-bold text-[#1a1f2c]">
                {t('profile.class_of', { year: selectedYearGroup?.year })}
              </SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsYearGroupDialogOpen(false)}
                className="h-10 w-10 rounded-full bg-white shadow-md hover:bg-gray-50"
              >
                <X className="w-5 h-5 text-[#1a1f2c]" />
              </Button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8" style={{ WebkitOverflowScrolling: 'touch' }}>
              {selectedYearGroup && (
                <div className="space-y-4">
                  {/* Members Button */}
                  {yearGroupMembers && (
                    <div
                      className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-md cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setIsMembersDialogOpen(true)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#1a1f2c]">{t('directory.all_members')}</p>
                          <p className="text-xs text-[#6b7280]">
                            {yearGroupMembers.totalMembers} {yearGroupMembers.totalMembers === 1 ? 'member' : 'members'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[#6b7280] text-lg">›</span>
                    </div>
                  )}

                  {/* About Section */}
                  {(fullYearGroupData?.yearInfo || selectedYearGroup.yearInfo) && (
                    <div className="bg-black rounded-2xl shadow-md p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-base font-semibold text-white">{t('directory.about')}</h3>
                      </div>
                      <p className="text-sm text-gray-300">{fullYearGroupData?.yearInfo || selectedYearGroup.yearInfo}</p>
                    </div>
                  )}

                  {/* Year Group Photos - Grid */}
                  {yearGroupPhotos.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-md p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-[#3b82f6]/10 flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-[#3b82f6]" />
                        </div>
                        <h3 className="text-base font-semibold text-[#1a1f2c]">{t('directory.photos')}</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {yearGroupPhotos.map((photo: string, idx: number) => (
                          <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-[#f3f4f6]">
                            <img
                              src={photo}
                              alt={`${t('profile.class_of', { year: selectedYearGroup.year })} - Photo ${idx + 1}`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Year Group Posts */}
                  {yearGroupPosts.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-base font-semibold text-[#1a1f2c] px-1">{t('admin.posts')}</h3>
                      {yearGroupPosts.map((post: any) => {
                        const authorName = post.author?.name || '';
                        const isAdmin = !post.author ||
                          post.author?.role === 'admin' ||
                          authorName.toLowerCase().includes('admin') ||
                          authorName === '';
                        const displayName = isAdmin ? 'Monnas Old Boys' : authorName;

                        return (
                          <div key={post.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                            {/* Post Header */}
                            <div className="p-4 pb-3">
                              <div className="flex items-center gap-3">
                                {isAdmin ? (
                                  <div className="w-10 h-10 rounded-sm overflow-hidden flex items-center justify-center">
                                    <img
                                      src="/cropped-skool-wapen.png"
                                      alt="Monnas Old Boys Alumni"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                                    {displayName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <p className="font-semibold text-sm text-[#1a1f2c]">{displayName}</p>
                                  <p className="text-xs text-[#6b7280]">
                                    {new Date(post.createdAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Post Images */}
                            {post.images && post.images.length > 0 && (
                              <div className="w-full aspect-square bg-gray-100 relative overflow-hidden">
                                {post.images.length > 1 ? (
                                  <div
                                    className="flex overflow-x-auto snap-x snap-mandatory h-full scrollbar-hide scroll-smooth touch-pan-x"
                                    onScroll={(e) => handleCarouselScroll(post.id, e)}
                                    ref={(el) => { carouselRefs.current[post.id] = el; }}
                                  >
                                    {post.images.map((image: string, idx: number) => (
                                      <div key={idx} className="w-full h-full flex-shrink-0 snap-center">
                                        <img
                                          src={image}
                                          alt={`${post.title} - Image ${idx + 1}`}
                                          className="w-full h-full object-cover"
                                          loading="lazy"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <img
                                    src={post.images[0]}
                                    alt={post.title}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                )}
                                {/* Image indicator dots */}
                                {post.images.length > 1 && (
                                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1.5">
                                    {post.images.map((_: string, idx: number) => (
                                      <div
                                        key={idx}
                                        className={`w-2 h-2 rounded-full transition-all ${
                                          (activeImageIndices[post.id] || 0) === idx
                                            ? 'bg-white scale-110'
                                            : 'bg-white/50'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Post Content */}
                            <div className="p-4 pt-3">
                              <h3 className="font-semibold text-base text-[#1a1f2c] mb-1">{post.title}</h3>
                              <p className="text-sm text-[#6b7280]">{post.content}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Members - Desktop Dialog / Mobile Sheet */}
      {!isMobile ? (
        <Dialog open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen}>
          <DialogContent className="w-full max-w-2xl max-h-[70vh] rounded-2xl overflow-hidden flex flex-col p-0 bg-white [&>button]:hidden !h-auto">
            {/* Header */}
            <div className="px-6 pt-4">
              <div className="flex items-center justify-between py-4 border-b">
                <div>
                  <DialogTitle className="text-xl font-bold">{t('profile.class_of', { year: selectedYearGroup?.year })} - {t('directory.all_members')}</DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    {yearGroupMembers?.totalMembers || 0} {yearGroupMembers?.totalMembers === 1 ? 'member' : 'members'} in this year group
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMembersDialogOpen(false)}
                  className="rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Members List */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="space-y-3">
                {yearGroupMembers && yearGroupMembers.members.length > 0 ? (
                  yearGroupMembers.members.map((member: any) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-all cursor-pointer"
                      onClick={() => {
                        setSelectedMember(member);
                        setIsMemberProfileOpen(true);
                      }}
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={member.nowPhoto || member.thenPhoto} alt={member.name} />
                        <AvatarFallback className="bg-blue-500 text-white">
                          {member.name?.charAt(0)?.toUpperCase() || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold">{member.name}</p>
                        {member.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{member.bio}</p>
                        )}
                      </div>
                      {member.isMember && (
                        <div className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                          {t('directory.member_badge')}
                        </div>
                      )}
                    </div>
                  ))
                ) : isLoadingMembers ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
                    <p className="text-muted-foreground">{t('directory.members_loading')}</p>
                  </div>
                ) : membersError ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">{t('directory.members_error')}</p>
                    <p className="text-xs text-muted-foreground">{t('directory.members_error_desc')}</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">{t('directory.no_members')}</p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <Sheet open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen}>
          <SheetContent side="bottom" className="w-full h-[70vh] rounded-t-3xl overflow-hidden flex flex-col p-0 bg-white [&>button]:hidden">
            {/* Header */}
            <div className="px-6 pt-4">
              <div className="flex items-center justify-between py-4 border-b">
                <div>
                  <SheetTitle className="text-xl font-bold">{t('profile.class_of', { year: selectedYearGroup?.year })} - {t('directory.all_members')}</SheetTitle>
                  <p className="text-sm text-muted-foreground">
                    {yearGroupMembers?.totalMembers || 0} {yearGroupMembers?.totalMembers === 1 ? 'member' : 'members'} in this year group
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMembersDialogOpen(false)}
                  className="rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Members List */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="space-y-3">
                {yearGroupMembers && yearGroupMembers.members.length > 0 ? (
                  yearGroupMembers.members.map((member: any) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-all cursor-pointer"
                      onClick={() => {
                        setSelectedMember(member);
                        setIsMemberProfileOpen(true);
                      }}
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={member.nowPhoto || member.thenPhoto} alt={member.name} />
                        <AvatarFallback className="bg-blue-500 text-white">
                          {member.name?.charAt(0)?.toUpperCase() || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold">{member.name}</p>
                        {member.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{member.bio}</p>
                        )}
                      </div>
                      {member.isMember && (
                        <div className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                          {t('directory.member_badge')}
                        </div>
                      )}
                    </div>
                  ))
                ) : isLoadingMembers ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
                    <p className="text-muted-foreground">{t('directory.members_loading')}</p>
                  </div>
                ) : membersError ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">{t('directory.members_error')}</p>
                    <p className="text-xs text-muted-foreground">{t('directory.members_error_desc')}</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">{t('directory.no_members')}</p>
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Member Profile Dialog */}
      <MemberProfileDialog
        member={selectedMember}
        open={isMemberProfileOpen}
        onOpenChange={setIsMemberProfileOpen}
      />
    </AppLayout>
  );
};

export default Directory;
