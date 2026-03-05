import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, Check } from "lucide-react";
import { membershipApi } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';

interface MembershipRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MembershipRequestDialog = ({ open, onOpenChange }: MembershipRequestDialogProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [step, setStep] = useState<'form' | 'success'>('form');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    whatsapp: '',
    monthlyAmount: '',
  });

  const submitMutation = useMutation({
    mutationFn: membershipApi.submitRequest,
    onSuccess: () => {
      setStep('success');
      toast({
        title: t('membership.request_success'),
        description: t('membership.request_success_desc'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('membership.request_error'),
        description: error.error || t('errors.try_again'),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.fullName || !formData.email || !formData.phone || !formData.whatsapp || !formData.monthlyAmount) {
      toast({
        title: t('validation.missing_info'),
        description: t('validation.fill_required'),
        variant: "destructive",
      });
      return;
    }

    // Budget validation - minimum R75
    const budgetAmount = parseFloat(formData.monthlyAmount);
    if (isNaN(budgetAmount) || budgetAmount < 75) {
      toast({
        title: t('validation.invalid_budget'),
        description: t('validation.min_budget'),
        variant: "destructive",
      });
      return;
    }

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        title: t('validation.invalid_email'),
        description: t('validation.enter_valid_email'),
        variant: "destructive",
      });
      return;
    }

    // Phone validation (at least 10 digits)
    if (formData.phone.replace(/\D/g, '').length < 10) {
      toast({
        title: t('validation.invalid_phone'),
        description: t('validation.phone_10_digits'),
        variant: "destructive",
      });
      return;
    }

    if (formData.whatsapp.replace(/\D/g, '').length < 10) {
      toast({
        title: t('validation.invalid_whatsapp'),
        description: t('validation.whatsapp_10_digits'),
        variant: "destructive",
      });
      return;
    }

    // Convert monthlyAmount to number and send to API
    submitMutation.mutate({
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      whatsapp: formData.whatsapp,
      monthlyAmount: parseFloat(formData.monthlyAmount),
    });
  };

  const handleClose = () => {
    if (step === 'success') {
      setStep('form');
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        whatsapp: '',
        monthlyAmount: '',
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {step === 'form' ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{t('membership.become_member')}</DialogTitle>
              <DialogDescription>
                {t('membership.join_family')}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold">{t('membership.your_info')}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{t('membership.full_name')} *</Label>
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t('membership.email_address')} *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        className="pl-9"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('membership.phone_number')} *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="012 345 6789"
                        className="pl-9"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">{t('membership.whatsapp_number')} *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="whatsapp"
                        type="tel"
                        placeholder="012 345 6789"
                        className="pl-9"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Budget Amount */}
              <div className="space-y-2">
                <Label htmlFor="monthlyAmount">{t('membership.budget_question')} *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-medium whitespace-nowrap">ZAR</span>
                  <Input
                    id="monthlyAmount"
                    type="number"
                    min="75"
                    step="1"
                    placeholder="75"
                    className="flex-1"
                    value={formData.monthlyAmount}
                    onChange={(e) => setFormData({ ...formData, monthlyAmount: e.target.value })}
                    required
                  />
                </div>
                <p className="text-sm text-muted-foreground">{t('membership.min_budget')}</p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={submitMutation.isPending}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-accent hover:bg-accent/90"
                  disabled={submitMutation.isPending}
                >
                  {submitMutation.isPending ? t('membership.submitting') : t('membership.submit_request')}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <DialogTitle className="text-2xl font-bold text-center">{t('membership.request_submitted')}</DialogTitle>
              <DialogDescription className="text-center text-base">
                {t('membership.thank_you')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    {t('membership.admin_will_contact')}
                  </p>
                  <p className="font-semibold text-foreground">{formData.email}</p>
                  <p className="font-semibold text-foreground">{formData.phone}</p>
                </CardContent>
              </Card>

              <p className="text-sm text-center text-muted-foreground">
                {t('membership.contact_timeline')}
              </p>

              <Button
                onClick={handleClose}
                className="w-full bg-accent hover:bg-accent/90"
              >
                {t('common.done')}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
