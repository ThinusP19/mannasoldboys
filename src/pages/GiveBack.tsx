import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { TrendingUp, Heart, FileText, Users, Gift, Building2, CreditCard, Copy, Check, ArrowLeft, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { MembershipRequestDialog } from "@/components/MembershipRequestDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { alumniApi, projectsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';

const GiveBack = () => {
  const { t } = useTranslation();
  const [membershipDialogOpen, setMembershipDialogOpen] = useState(false);
  const [contributionDialogOpen, setContributionDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [contributionAmount, setContributionAmount] = useState("");
  const [activeImageIndices, setActiveImageIndices] = useState<Record<string, number>>({});
  const carouselRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Track if we're on mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleImageScroll = (projectId: string) => {
    const carousel = carouselRefs.current[projectId];
    if (carousel) {
      const scrollLeft = carousel.scrollLeft;
      const width = carousel.offsetWidth;
      const newIndex = Math.round(scrollLeft / width);
      setActiveImageIndices(prev => ({ ...prev, [projectId]: newIndex }));
    }
  };

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

  // Fetch projects from API
  const { data: projects = [], isLoading: isLoadingProjects, refetch: refetchProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      try {
        return await projectsApi.getAll();
      } catch (error) {
        console.error("Error fetching projects:", error);
        return [];
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  // Donation mutation
  const donationMutation = useMutation({
    mutationFn: async ({ projectId, amount }: { projectId: string; amount: number }) => {
      return await projectsApi.donate(projectId, amount);
    },
    onSuccess: () => {
      toast({
        title: t('giving.thanks'),
        description: t('giving.success_msg'),
        duration: 3000,
      });
      setContributionDialogOpen(false);
      setContributionAmount("");
      setSelectedProject(null);
      // Refetch projects to update the raised amount
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      refetchProjects();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.error || error?.details || "Failed to record contribution. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    },
  });

  const handleContributeClick = (project: any) => {
    setSelectedProject(project);
    setContributionAmount("");
    setContributionDialogOpen(true);
  };

  const handleContributionSubmit = () => {
    if (!selectedProject) return;

    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: t('giving.invalid_amount'),
        description: "Please enter a valid contribution amount.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    donationMutation.mutate({
      projectId: selectedProject.id,
      amount: amount,
    });
  };

  const isMember = userData?.isMember === true;
  // If not a member, show membership form
  if (!isMember) {
    return (
      <AppLayout title={t('giving.title_short')}>
        <div className="p-4 md:p-6 bg-[#f5f0e8] min-h-full">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-foreground mb-1">{t('giving.title')}</h2>
              <p className="text-muted-foreground">{t('giving.member_only')}</p>
            </div>
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-2xl">{t('giving.join_member')}</CardTitle>
                <CardDescription>{t('giving.min_amount')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('giving.what_you_get')}</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Users className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium">{t('giving.perk_photos')}</p>
                        <p className="text-sm text-muted-foreground">{t('giving.perk_photos_desc')}</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Users className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium">{t('giving.perk_contacts')}</p>
                        <p className="text-sm text-muted-foreground">{t('giving.perk_contacts_desc')}</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Users className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium">{t('giving.perk_chats')}</p>
                        <p className="text-sm text-muted-foreground">{t('giving.perk_chats_desc')}</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Gift className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium">{t('giving.perk_events')}</p>
                        <p className="text-sm text-muted-foreground">{t('giving.perk_events_desc')}</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FileText className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium">{t('giving.perk_stories')}</p>
                        <p className="text-sm text-muted-foreground">{t('giving.perk_stories_desc')}</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Gift className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium">{t('giving.perk_cap')}</p>
                        <p className="text-sm text-muted-foreground">{t('giving.perk_cap_desc')}</p>
                      </div>
                    </li>
                  </ul>
                </div>
                <Button
                  className="w-full bg-accent text-white hover:bg-accent/90"
                  size="lg"
                  onClick={() => setMembershipDialogOpen(true)}
                >
                  {t('giving.become_member')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <MembershipRequestDialog
          open={membershipDialogOpen}
          onOpenChange={setMembershipDialogOpen}
        />
      </AppLayout>
    );
  }

  // Member view - show full Give Back content
  return (
    <AppLayout title={t('giving.title_short')}>
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
        <div className="hidden md:block space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-1">{t('giving.title')}</h2>
            <p className="text-muted-foreground">{t('giving.make_difference')}</p>
          </div>

          {/* Projects section - full content for members */}
          {isLoadingProjects ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{t('giving.loading_projects')}</p>
            </div>
          ) : projects.length === 0 ? (
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t('giving.no_projects')}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project: any) => (
                <Card key={project.id} className="border-0 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle>{project.title}</CardTitle>
                    <CardDescription>{project.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Project Images */}
                      {project.images && project.images.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {project.images.slice(0, 3).map((image: string, idx: number) => (
                            <div key={idx} className="aspect-square rounded-lg overflow-hidden">
                              <img
                                src={image}
                                alt={`${project.title} - Image ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Progress */}
                      {project.goal && (
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>{t('giving.progress')}</span>
                            <span>ZAR {project.raised || 0} / ZAR {project.goal}</span>
                          </div>
                          <Progress value={((project.raised || 0) / project.goal) * 100} />
                        </div>
                      )}

                      {/* Banking Details */}
                      {project.bankName && project.accountNumber && (
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            {t('giving.banking_details')}
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">{t('giving.bank')}</span>{" "}
                              <span className="font-medium">{project.bankName}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">{t('giving.account')}</span>{" "}
                              <span className="font-medium">{project.accountNumber}</span>
                            </div>
                            {project.accountHolder && (
                              <div>
                                <span className="text-muted-foreground">{t('giving.holder')}</span>{" "}
                                <span className="font-medium">{project.accountHolder}</span>
                              </div>
                            )}
                            {project.branchCode && (
                              <div>
                                <span className="text-muted-foreground">{t('giving.branch')}</span>{" "}
                                <span className="font-medium">{project.branchCode}</span>
                              </div>
                            )}
                            {project.reference && (
                              <div>
                                <span className="text-muted-foreground">{t('giving.reference')}</span>{" "}
                                <span className="font-medium font-mono">{project.reference}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="ml-2 h-6 px-2"
                                  onClick={() => {
                                    navigator.clipboard.writeText(project.reference);
                                    toast({
                                      title: t('giving.copied'),
                                      description: "Reference number copied to clipboard",
                                    });
                                  }}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <Button
                        className="w-full bg-accent text-white hover:bg-accent/90"
                        onClick={() => handleContributeClick(project)}
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        {t('giving.contribute')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-6">
          {/* Header */}
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-[#1a1f2c]">{t('giving.title')}</h1>
            <p className="text-sm text-[#6b7280] mt-1">{t('giving.make_difference')}</p>
          </div>

          {isLoadingProjects ? (
            <div className="text-center py-12">
              <div className="bg-white rounded-2xl shadow-md p-8">
                <p className="text-[#6b7280]">{t('giving.loading_projects')}</p>
              </div>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white rounded-2xl shadow-md p-8">
                <Heart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-[#6b7280]">{t('giving.no_projects')}</p>
              </div>
            </div>
          ) : (
            projects.map((project: any) => (
              <div key={project.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                {/* Image Carousel */}
                {project.images && project.images.length > 0 && (
                  <div className="relative">
                    <div
                      ref={(el) => { carouselRefs.current[project.id] = el; }}
                      onScroll={() => handleImageScroll(project.id)}
                      className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {project.images.map((image: string, idx: number) => (
                        <div key={idx} className="flex-shrink-0 w-full snap-center">
                          <div className="aspect-[4/3] bg-gray-100">
                            <img
                              src={image}
                              alt={`${project.title} - Image ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Dot indicators */}
                    {project.images.length > 1 && (
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                        {project.images.map((_: string, idx: number) => (
                          <div
                            key={idx}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              idx === (activeImageIndices[project.id] || 0) ? 'bg-white' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="p-4">
                  {/* Title and Description */}
                  <h3 className="font-bold text-lg text-[#1a1f2c] mb-1">{project.title}</h3>
                  <p className="text-sm text-[#6b7280] mb-4">{project.description}</p>

                  {/* Progress */}
                  {project.goal && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-[#6b7280]">{t('giving.progress')}</span>
                        <span className="font-semibold text-[#1a1f2c]">
                          R{project.raised || 0} / R{project.goal}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all"
                          style={{ width: `${Math.min(((project.raised || 0) / project.goal) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Banking Details */}
                  {project.bankName && project.accountNumber && (
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-[#3b82f6]/10 flex items-center justify-center">
                          <CreditCard className="w-4 h-4 text-[#3b82f6]" />
                        </div>
                        <h4 className="font-semibold text-sm text-[#1a1f2c]">{t('giving.banking_details')}</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[#6b7280]">{t('giving.bank')}</span>
                          <span className="font-medium text-[#1a1f2c]">{project.bankName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6b7280]">{t('giving.account')}</span>
                          <span className="font-medium text-[#1a1f2c]">{project.accountNumber}</span>
                        </div>
                        {project.accountHolder && (
                          <div className="flex justify-between">
                            <span className="text-[#6b7280]">{t('giving.holder')}</span>
                            <span className="font-medium text-[#1a1f2c]">{project.accountHolder}</span>
                          </div>
                        )}
                        {project.branchCode && (
                          <div className="flex justify-between">
                            <span className="text-[#6b7280]">{t('giving.branch')}</span>
                            <span className="font-medium text-[#1a1f2c]">{project.branchCode}</span>
                          </div>
                        )}
                        {project.reference && (
                          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                            <span className="text-[#6b7280]">{t('giving.reference')}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-medium text-[#1a1f2c]">{project.reference}</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(project.reference);
                                  toast({
                                    title: t('giving.copied'),
                                    description: "Reference copied",
                                  });
                                }}
                                className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5 text-[#1a1f2c]" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contribute Button */}
                  <button
                    onClick={() => handleContributeClick(project)}
                    className="w-full py-3 bg-[#1a1f2c] text-white rounded-xl font-medium text-sm hover:bg-[#2d3748] transition-colors flex items-center justify-center gap-2"
                  >
                    <Heart className="w-4 h-4" />
                    {t('giving.contribute')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Contribution Dialog - Desktop */}
      {!isMobile && (
        <Dialog open={contributionDialogOpen} onOpenChange={setContributionDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('giving.record_contribution')}</DialogTitle>
              <DialogDescription>
                {selectedProject && (
                  <>
                    {t('giving.how_much')} <strong>{selectedProject.title}</strong>?
                    <br />
                    <span className="text-xs text-muted-foreground mt-2 block">
                      {t('giving.eft_hint')}
                    </span>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">{t('giving.contribution_amount')}</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">ZAR</span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setContributionDialogOpen(false);
                    setContributionAmount("");
                    setSelectedProject(null);
                  }}
                  disabled={donationMutation.isPending}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleContributionSubmit}
                  disabled={donationMutation.isPending || !contributionAmount || parseFloat(contributionAmount) <= 0}
                  className="bg-accent text-white hover:bg-accent/90"
                >
                  {donationMutation.isPending ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      {t('giving.recording')}
                    </>
                  ) : (
                    <>
                      <Heart className="w-4 h-4 mr-2" />
                      {t('giving.record_btn')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Contribution Sheet - Mobile */}
      {isMobile && (
        <Sheet open={contributionDialogOpen} onOpenChange={setContributionDialogOpen}>
          <SheetContent side="bottom" className="w-full h-auto rounded-t-3xl p-0 bg-[#f5f0e8] [&>button]:hidden">
            {/* Header */}
            <div className="px-4 pt-4 pb-2 flex items-start justify-between bg-[#f5f0e8]">
              <div className="flex-1 pr-4">
                <SheetTitle className="text-xl font-bold text-[#1a1f2c] leading-tight">
                  {t('giving.record_contribution')}
                </SheetTitle>
                {selectedProject && (
                  <p className="text-sm text-[#6b7280] mt-1">
                    {t('giving.how_much')} <strong>{selectedProject.title}</strong>?
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setContributionDialogOpen(false)}
                className="h-10 w-10 rounded-full bg-white shadow-md hover:bg-gray-50 flex-shrink-0"
              >
                <X className="w-5 h-5 text-[#1a1f2c]" />
              </Button>
            </div>

            {/* Content */}
            <div className="px-4 pb-6 pt-2">
              <div className="bg-white rounded-2xl shadow-md p-4 space-y-4">
                {/* Amount Input */}
                <div className="space-y-2">
                  <Label htmlFor="mobile-amount" className="text-sm font-semibold text-[#1a1f2c]">
                    {t('giving.contribution_amount')}
                  </Label>
                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-200">
                    <span className="text-lg font-bold text-[#6b7280]">R</span>
                    <Input
                      id="mobile-amount"
                      type="number"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      value={contributionAmount}
                      onChange={(e) => setContributionAmount(e.target.value)}
                      className="flex-1 border-0 bg-transparent text-xl font-semibold focus-visible:ring-0 p-0"
                    />
                  </div>
                </div>

                {/* Hint */}
                <p className="text-xs text-[#6b7280] text-center">
                  {t('giving.eft_hint')}
                </p>

                {/* Buttons */}
                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleContributionSubmit}
                    disabled={donationMutation.isPending || !contributionAmount || parseFloat(contributionAmount) <= 0}
                    className="w-full py-3 bg-[#1a1f2c] text-white rounded-xl font-medium text-sm hover:bg-[#2d3748] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {donationMutation.isPending ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        {t('giving.recording')}
                      </>
                    ) : (
                      <>
                        <Heart className="w-4 h-4" />
                        {t('giving.record_btn')}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setContributionDialogOpen(false);
                      setContributionAmount("");
                      setSelectedProject(null);
                    }}
                    disabled={donationMutation.isPending}
                    className="w-full py-3 bg-gray-100 text-[#1a1f2c] rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </AppLayout>
  );
};

export default GiveBack;
