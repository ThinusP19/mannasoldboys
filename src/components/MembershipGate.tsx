import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Gift, FileText } from "lucide-react";
import { MembershipRequestDialog } from "./MembershipRequestDialog";
import { useState } from "react";
import { useTranslation } from 'react-i18next';

interface MembershipGateProps {
  children: ReactNode;
  isMember: boolean | undefined;
  pageTitle: string;
  pageDescription?: string;
}

export const MembershipGate = ({ children, isMember, pageTitle, pageDescription }: MembershipGateProps) => {
  const [membershipDialogOpen, setMembershipDialogOpen] = useState(false);
  const { t } = useTranslation();

  // If membership status is still loading, show loading state
  if (isMember === undefined) {
    return (
      <div className="p-4 md:p-6 bg-[#f5f0e8] min-h-full">
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('status.loading')}</p>
        </div>
      </div>
    );
  }

  // If not a member, show membership form
  if (!isMember) {
    return (
      <div className="p-4 md:p-6 bg-[#f5f0e8] min-h-full">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-foreground mb-1">{pageTitle}</h2>
            <p className="text-muted-foreground">{pageDescription || t('giving.member_only')}</p>
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
        <MembershipRequestDialog
          open={membershipDialogOpen}
          onOpenChange={setMembershipDialogOpen}
        />
      </div>
    );
  }

  // If member, show the actual content
  return <>{children}</>;
};

