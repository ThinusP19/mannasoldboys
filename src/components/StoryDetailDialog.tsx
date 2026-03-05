import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Calendar, User, X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect } from "react";

interface Story {
  id: string;
  title: string;
  content: string;
  author: string;
  images?: string[];
  date: string;
}

interface StoryDetailDialogProps {
  story: Story | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StoryDetailDialog = ({ story, open, onOpenChange }: StoryDetailDialogProps) => {
  const { t } = useTranslation();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!story) return null;

  const hasImages = story.images && story.images.length > 0;

  const handleScroll = () => {
    if (carouselRef.current && hasImages) {
      const scrollLeft = carouselRef.current.scrollLeft;
      const width = carouselRef.current.offsetWidth;
      const newIndex = Math.round(scrollLeft / width);
      setActiveImageIndex(newIndex);
    }
  };

  const content = (
    <>
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-start justify-between bg-[#f5f0e8]">
        <div className="flex-1 pr-4">
          {isMobile ? (
            <SheetTitle className="text-xl font-bold text-[#1a1f2c] leading-tight">
              {story.title}
            </SheetTitle>
          ) : (
            <DialogTitle className="text-xl font-bold text-[#1a1f2c] leading-tight">
              {story.title}
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
          {/* Author Card */}
          <div className="bg-white rounded-2xl shadow-md p-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-sm overflow-hidden flex-shrink-0">
                <img
                  src="/cropped-skool-wapen.png"
                  alt="Monnas Old Boys"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1">
                <p className="text-[#1a1f2c] font-semibold text-lg">Monnas Old Boys</p>
                <div className="flex items-center gap-2 mt-1 text-sm text-[#6b7280]">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(story.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Images Carousel */}
          {hasImages && (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div
                ref={carouselRef}
                onScroll={handleScroll}
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {story.images!.map((img, idx) => (
                  <div key={idx} className="flex-shrink-0 w-full snap-center">
                    <div className="aspect-[4/3] bg-gray-100">
                      <img
                        src={img}
                        alt={`${story.title} - Image ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Dot indicators */}
              {story.images!.length > 1 && (
                <div className="flex justify-center gap-1.5 py-3 bg-white">
                  {story.images!.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        idx === activeImageIndex ? 'bg-[#1a1f2c]' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Story Content */}
          <div className="bg-white rounded-2xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#8b5cf6]/10 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-[#8b5cf6]" />
              </div>
              <h3 className="text-base font-semibold text-[#1a1f2c]">Story</h3>
            </div>
            <p className="text-[#374151] text-base leading-relaxed whitespace-pre-wrap">
              {story.content}
            </p>
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
