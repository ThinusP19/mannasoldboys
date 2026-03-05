import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Image as ImageIcon, ExternalLink, Crown, Users, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { alumniApi, yearGroupsApi, yearGroupPostsApi } from "@/lib/api";
import SEO, { pageSEO } from "@/components/SEO";
import { MembershipRequestDialog } from "@/components/MembershipRequestDialog";
import { MemberProfileDialog } from "@/components/MemberProfileDialog";
import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from 'react-i18next';

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

interface Member {
  id: string;
  name: string;
  year?: number;
  bio?: string;
  nowPhoto?: string;
  thenPhoto?: string;
  contactPermission?: 'all' | 'year-group' | 'none';
  phone?: string;
  email?: string;
  linkedin?: string;
  instagram?: string;
  facebook?: string;
  isMember?: boolean;
}

interface YearGroupPost {
  id: string;
  title: string;
  content: string;
  images?: string[];
  author?: {
    name?: string;
    role?: string;
  };
  createdAt?: string;
}

const Index = () => {
  const { user } = useAuth();

  return (
    <>
      <SEO {...pageSEO.home} />
      <IndexContent user={user} />
    </>
  );
};

const IndexContent = ({ user }: { user: User | null }) => {
  const { t } = useTranslation();
  const [isMembershipDialogOpen, setIsMembershipDialogOpen] = useState(false);
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
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

  // Fetch user profile to get their year
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

  const currentUserYear = userData?.profile?.year;

  // Fetch the user's year group
  const { data: userYearGroup, isLoading: isLoadingYearGroup, error: yearGroupError } = useQuery({
    queryKey: ["year-group", currentUserYear],
    queryFn: async () => {
      if (!currentUserYear) {
        // No year found in user profile
        return null;
      }
      try {
        const result = await yearGroupsApi.getByYear(currentUserYear);
        return result;
      } catch (error) {
        console.error("Error fetching year group:", error);
        return null;
      }
    },
    enabled: !!currentUserYear,
    refetchOnWindowFocus: false,
    staleTime: 1 * 60 * 1000, // Consider data fresh for 1 minute
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  });

  // Removed debug logging for production

  const userWhatsAppLink = userYearGroup?.whatsappLink;

  // Fetch posts for the user's year group
  const { data: yearGroupPosts = [] } = useQuery({
    queryKey: ["year-group-posts", userYearGroup?.id],
    queryFn: async () => {
      if (!userYearGroup?.id) return [];
      try {
        return await yearGroupPostsApi.getByYearGroup(userYearGroup.id);
      } catch (error) {
        console.error("Error fetching year group posts:", error);
        return [];
      }
    },
    enabled: !!userYearGroup?.id,
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every 1 minute (posts change more frequently)
  });

  // Get all photos from the year group (photos array or fallback to groupPhoto)
  const yearGroupPhotos = userYearGroup?.photos && userYearGroup.photos.length > 0
    ? userYearGroup.photos
    : userYearGroup?.groupPhoto
    ? [userYearGroup.groupPhoto]
    : [];

  // Fetch members for the year group
  const { data: rawYearGroupMembers } = useQuery({
    queryKey: ["year-group-members", currentUserYear],
    queryFn: async () => {
      if (!currentUserYear) return null;
      try {
        return await yearGroupsApi.getMembersByYear(currentUserYear);
      } catch (error) {
        console.error("Error fetching year group members:", error);
        return null;
      }
    },
    enabled: !!currentUserYear,
    refetchOnWindowFocus: false,
    staleTime: 1 * 60 * 1000, // Consider data fresh for 1 minute
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  });

  // Filter members based on contactPermission
  // For "My Year" tab, show members with 'all' or 'year-group' permission (since we're in the same year)
  const yearGroupMembers = rawYearGroupMembers ? {
    ...rawYearGroupMembers,
    members: rawYearGroupMembers.members.filter((member: Member) => {
      // Hide members with 'none' permission (ghost mode)
      return member.contactPermission !== 'none';
    }),
    totalMembers: rawYearGroupMembers.members.filter((member: Member) => {
      return member.contactPermission !== 'none';
    }).length
  } : null;

  return (
    <AppLayout title={t('home.title')}>
      <div className="p-4 md:p-6 bg-[#f5f0e8] min-h-full">
        {/* Desktop Dashboard */}
        <div className="hidden md:block space-y-6">
          {/* Welcome Message */}
          <div>
            <h2 className="text-3xl font-bold mb-1">{t('home.welcome')}</h2>
            <p className="text-muted-foreground">{t('home.description')}</p>
          </div>

          {/* Membership CTA - Show to non-members only */}
          {user && !userData?.isMember && (
            <Card className="border-0 shadow-md bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <Crown className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{t('home.become_member')}</CardTitle>
                    <p className="text-sm text-muted-foreground">{t('home.unlock_benefits')}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  className="bg-accent hover:bg-accent/90 text-white"
                  onClick={() => setIsMembershipDialogOpen(true)}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  {t('home.become_member')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {currentUserYear && isLoadingYearGroup && (
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">{t('home.loading_year_group')}</p>
              </CardContent>
            </Card>
          )}

          {/* User's Year Group Section */}
          {currentUserYear && userYearGroup && (
            <>
              {/* Join Chat Section */}
              <Card className="border-0 shadow-sm bg-white border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-2xl">{t('home.join_chat')}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {userWhatsAppLink
                      ? t('home.connect_whatsapp')
                      : t('home.connect_year')}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    {userWhatsAppLink ? (
                      <Button
                        className="w-full md:w-auto bg-green-600 text-white hover:bg-green-700"
                        onClick={() => window.open(userWhatsAppLink, "_blank")}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        {t('home.join_whatsapp')}
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t('home.whatsapp_soon')}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Year Group Photos */}
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {yearGroupPhotos.length > 0 ? (
                      yearGroupPhotos.map((photo: string, idx: number) => (
                        <div key={idx} className="aspect-square rounded-lg overflow-hidden">
                          <img
                            src={photo}
                            alt={`${t('profile.class_of', { year: currentUserYear })} - Photo ${idx + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      ))
                    ) : (
                      // Placeholder images when no photos
                      [1, 2, 3, 4].map((idx) => (
                        <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-300" />
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Year Group Posts - Instagram Style */}
              {yearGroupPosts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {yearGroupPosts.map((post: YearGroupPost) => {
                    const authorName = post.author?.name || '';
                    // Treat as admin post if: role is admin, name contains 'admin', or no author
                    const isAdmin = !post.author ||
                      post.author?.role === 'admin' ||
                      authorName.toLowerCase().includes('admin') ||
                      authorName === '';
                    const displayName = isAdmin ? 'Monnas Old Boys' : authorName;
                    return (
                      <Card key={post.id} className="border-0 shadow-sm bg-white">
                        {/* Post Header */}
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
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
                                <p className="font-semibold text-sm">{displayName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(post.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardHeader>

                        {/* Post Images - Square with horizontal scroll for multiple images */}
                        {post.images && post.images.length > 0 && (
                          <div className="w-full aspect-square bg-gray-100 relative overflow-hidden">
                            {post.images.length > 1 ? (
                              <div
                                className="flex overflow-x-auto snap-x snap-mandatory h-full scrollbar-hide scroll-smooth touch-pan-x"
                                onScroll={(e) => handleCarouselScroll(post.id, e)}
                                ref={(el) => { carouselRefs.current[post.id] = el; }}
                              >
                                {post.images.map((image: string, idx: number) => (
                                  <div
                                    key={idx}
                                    className="w-full h-full flex-shrink-0 snap-center snap-always"
                                  >
                                    <img
                                      src={image}
                                      alt={`${post.title} - Image ${idx + 1}`}
                                      className="w-full h-full object-cover pointer-events-none"
                                      draggable="false"
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <img
                                src={post.images[0]}
                                alt={post.title}
                                className="w-full h-full object-cover"
                              />
                            )}
                            {/* Image indicator dots for multiple images */}
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
                        <CardContent className="pt-4 pb-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-4 text-sm">
                              <span className="font-semibold">{displayName}</span>
                              <span className="text-gray-700">{post.title}</span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {post.content}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}


          {/* No Year Group Message - Only show for members */}
          {currentUserYear && !isLoadingYearGroup && !userYearGroup && userData?.isMember && (
            <Card className="border-0 shadow-sm bg-white border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-2xl">{t('home.year_not_found')}</CardTitle>
                <p className="text-sm text-muted-foreground">{t('home.year_not_created')}</p>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {t('home.year_not_created_desc', { year: currentUserYear })}
                </p>
                {yearGroupError && (
                  <p className="text-sm text-red-600 mt-2">
                    Error: {yearGroupError?.message || 'Failed to load year group'}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* No Year in Profile Message */}
          {!currentUserYear && userData && (
            <Card className="border-0 shadow-sm bg-white border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-2xl">{t('home.year_not_set')}</CardTitle>
                <p className="text-sm text-muted-foreground">{t('home.year_not_set_desc')}</p>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {t('home.year_not_set_full')}
                </p>
              </CardContent>
            </Card>
          )}

        </div>

        {/* Mobile - Instagram Feed Style */}
        <div className="md:hidden space-y-4">
          <div className="mb-4">
            <h2 className="text-2xl font-bold mb-1">{t('home.title')}</h2>
            <p className="text-sm text-muted-foreground">{t('home.description_short')}</p>
          </div>

          {/* Membership CTA - Mobile - Show to non-members only */}
          {user && !userData?.isMember && (
            <Card className="border-0 shadow-md bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <Crown className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                <CardTitle className="text-lg">{t('home.become_member')}</CardTitle>
                    <p className="text-xs text-muted-foreground">{t('home.unlock_benefits_short')}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full bg-accent hover:bg-accent/90 text-white"
                  onClick={() => setIsMembershipDialogOpen(true)}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  {t('giving.view_plans')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Loading State - Mobile */}
          {currentUserYear && isLoadingYearGroup && (
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="pt-4">
                <p className="text-center text-sm text-muted-foreground">{t('home.loading_year_group')}</p>
              </CardContent>
            </Card>
          )}

          {/* User's Year Group Section - Mobile */}
          {currentUserYear && userYearGroup && (
            <>
              {/* Join Chat Section - Mobile */}
              <Card className="border-0 shadow-sm bg-white border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{t('home.join_chat')}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {userWhatsAppLink
                      ? t('home.connect_whatsapp')
                      : t('home.connect_year')}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    {userWhatsAppLink ? (
                      <Button
                        className="w-full bg-green-600 text-white hover:bg-green-700"
                        onClick={() => window.open(userWhatsAppLink, "_blank")}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        {t('home.join_whatsapp')}
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t('home.whatsapp_soon')}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Year Group Photos - Mobile */}
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-2">
                    {yearGroupPhotos.length > 0 ? (
                      yearGroupPhotos.map((photo: string, idx: number) => (
                        <div key={idx} className="aspect-square rounded-lg overflow-hidden">
                          <img
                            src={photo}
                            alt={`${t('profile.class_of', { year: currentUserYear })} - Photo ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))
                    ) : (
                      // Placeholder images when no photos
                      [1, 2, 3, 4].map((idx) => (
                        <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-300" />
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Year Group Posts - Mobile - Instagram Style */}
              {yearGroupPosts.length > 0 && (
                <div className="space-y-4">
                  {yearGroupPosts.map((post: YearGroupPost) => {
                    const authorName = post.author?.name || '';
                    const isAdmin = !post.author ||
                      post.author?.role === 'admin' ||
                      authorName.toLowerCase().includes('admin') ||
                      authorName === '';
                    const displayName = isAdmin ? 'Monnas Old Boys' : authorName;
                    return (
                      <Card key={post.id} className="border-0 shadow-sm bg-white">
                        {/* Post Header */}
                        <CardHeader className="pb-3">
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
                              <p className="font-semibold text-sm">{displayName}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(post.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                        </CardHeader>

                        {/* Post Images */}
                        {post.images && post.images.length > 0 && (
                          <div className="w-full aspect-square bg-gray-100 relative overflow-hidden">
                            {post.images.length > 1 ? (
                              <div
                                className="flex overflow-x-auto snap-x snap-mandatory h-full scrollbar-hide scroll-smooth touch-pan-x"
                                onScroll={(e) => handleCarouselScroll(post.id, e)}
                                ref={(el) => { carouselRefs.current[`mobile-${post.id}`] = el; }}
                              >
                                {post.images.map((image: string, idx: number) => (
                                  <div
                                    key={idx}
                                    className="w-full h-full flex-shrink-0 snap-center snap-always"
                                  >
                                    <img
                                      src={image}
                                      alt={`${post.title} - Image ${idx + 1}`}
                                      className="w-full h-full object-cover pointer-events-none"
                                      draggable="false"
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <img
                                src={post.images[0]}
                                alt={post.title}
                                className="w-full h-full object-cover"
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
                        <CardContent className="pt-4 pb-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-semibold">{displayName}</span>
                              <span className="text-gray-700">{post.title}</span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {post.content}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* No Year Group Message - Mobile - Only show for members */}
          {currentUserYear && !isLoadingYearGroup && !userYearGroup && userData?.isMember && (
            <Card className="border-0 shadow-sm bg-white border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t('home.year_not_found')}</CardTitle>
                <p className="text-xs text-muted-foreground">{t('home.year_not_created')}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('home.year_not_created_desc', { year: currentUserYear })}
                </p>
                {yearGroupError && (
                  <p className="text-xs text-red-600 mt-2">
                    Error: {yearGroupError?.message || 'Failed to load year group'}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* No Year in Profile Message - Mobile */}
          {!currentUserYear && userData && (
            <Card className="border-0 shadow-sm bg-white border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t('home.year_not_set')}</CardTitle>
                <p className="text-xs text-muted-foreground">{t('home.year_not_set_desc')}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('home.year_not_set_full')}
                </p>
              </CardContent>
            </Card>
          )}

        </div>
      </div>

      {/* Membership Request Dialog */}
      <MembershipRequestDialog
        open={isMembershipDialogOpen}
        onOpenChange={setIsMembershipDialogOpen}
      />

      {/* Members - Desktop Dialog / Mobile Sheet */}
      {!isMobile ? (
        <Dialog open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen}>
          <DialogContent className="w-full max-w-2xl max-h-[70vh] rounded-2xl overflow-hidden flex flex-col p-0 bg-white [&>button]:hidden !h-auto">
            {/* Header */}
            <div className="px-6 pt-4">
              <div className="flex items-center justify-between py-4 border-b">
                <div>
                  <DialogTitle className="text-xl font-bold">{t('profile.class_of', { year: currentUserYear })} - {t('directory.all_members')}</DialogTitle>
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
                  yearGroupMembers.members.map((member: Member) => (
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
                  <SheetTitle className="text-xl font-bold">{t('profile.class_of', { year: currentUserYear })} - {t('directory.all_members')}</SheetTitle>
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
                  yearGroupMembers.members.map((member: Member) => (
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

export default Index;
