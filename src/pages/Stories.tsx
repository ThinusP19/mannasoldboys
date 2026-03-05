import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowLeft } from "lucide-react";
import SEO, { pageSEO } from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import { storiesApi, alumniApi } from "@/lib/api";
import { StoryDetailDialog } from "@/components/StoryDetailDialog";
import { MembershipGate } from "@/components/MembershipGate";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

interface Story {
  id: string;
  title: string;
  content: string;
  author: string;
  image?: string;
  createdAt?: string;
}

const Stories = () => {
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

  // Fetch stories from real API
  const { data: stories = [], isLoading, error } = useQuery({
    queryKey: ["stories"],
    queryFn: () => storiesApi.getAll(),
  });

  // Selected story for detail view
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const handleReadMore = (story: Story) => {
    setSelectedStory(story);
    setIsDetailOpen(true);
  };

  // Handle URL parameter for navigation from search
  useEffect(() => {
    const storyParam = searchParams.get("story");
    if (storyParam && stories.length > 0) {
      const story = stories.find((s: Story) => s.id === storyParam);
      if (story && !isDetailOpen) {
        setSelectedStory(story);
        setIsDetailOpen(true);
        // Clear URL params after opening
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("story");
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [searchParams, stories, isDetailOpen, setSearchParams]);

  return (
    <>
      <SEO {...pageSEO.stories} />
      <AppLayout title={t('stories.title')}>
      <MembershipGate
        isMember={isMember}
        pageTitle={t('stories.title')}
        pageDescription={t('stories.member_gate_desc')}
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
            <h2 className="text-3xl font-bold text-foreground mb-1">{t('stories.title')}</h2>
            <p className="text-muted-foreground">{t('stories.description')}</p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t('stories.loading')}</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{t('stories.error')}</p>
            </div>
          ) : stories.length === 0 ? (
            <div className="text-center py-12">
              <Card className="border-0 shadow-sm bg-white p-8">
                <p className="text-muted-foreground text-lg">{t('stories.no_stories')}</p>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {stories.map((story: Story) => (
              <Card key={story.id} className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{story.title}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{story.author}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(story.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 line-clamp-3">{story.content}</p>
                  {story.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {story.images.map((img, idx) => (
                        <div key={idx} className="aspect-square bg-muted rounded-lg overflow-hidden">
                          <img src={img} alt={`Story image ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                  <Button variant="link" className="px-0" onClick={() => handleReadMore(story)}>
                    {t('stories.read_more')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          )}
        </div>

        {/* Mobile View - Clean Card Style */}
        <div className="md:hidden space-y-4">
          {/* Header */}
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-[#1a1f2c]">{t('stories.title')}</h1>
            <p className="text-sm text-[#6b7280] mt-1">{t('stories.description_short')}</p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="bg-white rounded-2xl shadow-md p-8">
                <p className="text-[#6b7280]">{t('stories.loading')}</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-white rounded-2xl shadow-md p-8">
                <p className="text-red-600">{t('stories.error')}</p>
              </div>
            </div>
          ) : stories.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white rounded-2xl shadow-md p-8">
                <p className="text-[#6b7280]">{t('stories.no_stories')}</p>
              </div>
            </div>
          ) : (
            stories.map((story: Story) => (
              <div key={story.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                {/* Story Image */}
                {story.images && story.images.length > 0 && (
                  <div className="aspect-[16/10] bg-gray-100 overflow-hidden">
                    <img
                      src={story.images[0]}
                      alt={story.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Story Content */}
                <div className="p-4">
                  {/* Author Row */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-sm overflow-hidden flex-shrink-0">
                      <img
                        src="/Logo.jpeg"
                        alt="Monnas Witbul"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1a1f2c] truncate">Monnas Witbul</p>
                      <p className="text-xs text-[#6b7280]">
                        {new Date(story.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-lg text-[#1a1f2c] mb-2">{story.title}</h3>

                  {/* Content Preview */}
                  <p className="text-sm text-[#374151] line-clamp-3 mb-3">{story.content}</p>

                  {/* Read More Button */}
                  <button
                    onClick={() => handleReadMore(story)}
                    className="w-full py-3 bg-[#1a1f2c] text-white rounded-xl font-medium text-sm hover:bg-[#2d3748] transition-colors"
                  >
                    {t('stories.read_more_short')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      </MembershipGate>
      </AppLayout>

    {/* Story Detail Dialog */}
    <StoryDetailDialog
      story={selectedStory}
      open={isDetailOpen}
      onOpenChange={setIsDetailOpen}
    />
    </>
  );
};

export default Stories;
