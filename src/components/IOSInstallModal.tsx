import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface IOSInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Safari Share icon SVG
const SafariShareIcon = () => (
  <svg viewBox="0 0 50 50" className="w-full h-full" fill="none">
    <rect width="50" height="50" rx="10" fill="#007AFF"/>
    <path d="M25 10L25 32" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    <path d="M17 18L25 10L33 18" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 25V38C14 39.1 14.9 40 16 40H34C35.1 40 36 39.1 36 38V25" stroke="white" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

// Add to Home Screen icon SVG
const AddToHomeIcon = () => (
  <svg viewBox="0 0 50 50" className="w-full h-full" fill="none">
    <rect width="50" height="50" rx="10" fill="#1C1C1E"/>
    <rect x="10" y="10" width="30" height="30" rx="6" stroke="white" strokeWidth="3"/>
    <path d="M25 18V32" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    <path d="M18 25H32" stroke="white" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

// Add button icon SVG
const AddButtonIcon = () => (
  <svg viewBox="0 0 50 50" className="w-full h-full" fill="none">
    <rect width="50" height="50" rx="10" fill="#34C759"/>
    <path d="M15 26L22 33L37 18" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export function IOSInstallModal({ isOpen, onClose }: IOSInstallModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-none text-gray-900 !max-w-[340px] !w-[90%] rounded-2xl shadow-2xl p-0 !h-auto !inset-auto !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-[#007AFF] to-[#5856D6] p-5 text-center">
          <div className="w-16 h-16 mx-auto mb-3 bg-white rounded-2xl shadow-lg flex items-center justify-center">
            <img
              src="/cropped-skool-wapen.png"
              alt="Monnas Old Boys"
              className="w-12 h-12 object-contain"
            />
          </div>
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-bold">
              {t('pwa.ios_install_title', 'Install Monnas Old Boys App')}
            </DialogTitle>
          </DialogHeader>
          <p className="text-white/80 text-sm mt-1">
            {t('pwa.ios_install_subtitle', 'Add to your home screen for the best experience')}
          </p>
        </div>

        {/* Steps */}
        <div className="p-5 space-y-4">
          {/* Step 1 */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 flex-shrink-0">
              <SafariShareIcon />
            </div>
            <div className="flex-1 pt-1">
              <p className="font-semibold text-gray-900 text-sm">
                {t('pwa.ios_step1_title', 'Step 1: Tap Share')}
              </p>
              <p className="text-gray-500 text-xs mt-0.5">
                {t('pwa.ios_step1_desc', 'Tap the share button at the bottom of Safari')}
              </p>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="none">
              <path d="M12 5L12 19M12 19L6 13M12 19L18 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 flex-shrink-0">
              <AddToHomeIcon />
            </div>
            <div className="flex-1 pt-1">
              <p className="font-semibold text-gray-900 text-sm">
                {t('pwa.ios_step2_title', 'Step 2: Add to Home Screen')}
              </p>
              <p className="text-gray-500 text-xs mt-0.5">
                {t('pwa.ios_step2_desc', 'Scroll down and tap "Add to Home Screen"')}
              </p>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="none">
              <path d="M12 5L12 19M12 19L6 13M12 19L18 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 flex-shrink-0">
              <AddButtonIcon />
            </div>
            <div className="flex-1 pt-1">
              <p className="font-semibold text-gray-900 text-sm">
                {t('pwa.ios_step3_title', 'Step 3: Tap Add')}
              </p>
              <p className="text-gray-500 text-xs mt-0.5">
                {t('pwa.ios_step3_desc', 'Confirm by tapping Add in the top right corner')}
              </p>
            </div>
          </div>

          {/* Safari toolbar hint */}
          <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-[#007AFF]" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 7V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="16" r="1" fill="currentColor"/>
                </svg>
              </div>
              <p className="text-xs text-gray-600">
                {t('pwa.ios_hint', 'Look for the share button in your Safari toolbar')}
              </p>
            </div>
            {/* Visual representation of Safari toolbar */}
            <div className="mt-3 bg-gray-200 rounded-lg p-2 flex items-center justify-around">
              <div className="w-6 h-6 bg-gray-400 rounded opacity-40" />
              <div className="w-6 h-6 bg-gray-400 rounded opacity-40" />
              <div className="w-8 h-8 bg-[#007AFF] rounded-lg flex items-center justify-center animate-pulse">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3L12 15M12 3L8 7M12 3L16 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5 12V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="w-6 h-6 bg-gray-400 rounded opacity-40" />
              <div className="w-6 h-6 bg-gray-400 rounded opacity-40" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 pt-0">
          <Button
            onClick={onClose}
            className="w-full h-12 bg-[#007AFF] hover:bg-[#0066DD] text-white font-semibold rounded-xl shadow-lg"
          >
            {t('common.got_it', 'Got it!')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
