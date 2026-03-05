import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { sponsorsApi, sponsorEnquiriesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Award, Star, Medal, Handshake, ArrowLeft } from "lucide-react";

const Sponsors = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    tier: "Gold",
    message: "",
  });

  const { data: sponsors = [], isLoading } = useQuery({
    queryKey: ["sponsors"],
    queryFn: sponsorsApi.getAll,
  });

  const goldSponsors = sponsors.filter((s: any) => s.tier === "Gold");
  const silverSponsors = sponsors.filter((s: any) => s.tier === "Silver");
  const bronzeSponsors = sponsors.filter((s: any) => s.tier === "Bronze");

  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await sponsorEnquiriesApi.submit(formData);
      toast({
        title: "Enquiry Submitted",
        description: "Thank you! We'll be in touch soon.",
      });
      setEnquiryOpen(false);
      setFormData({
        companyName: "",
        contactName: "",
        email: "",
        phone: "",
        tier: "Gold",
        message: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit enquiry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Sponsors">
        <div className="p-4 md:p-6 bg-[#f5f0e8] min-h-full pb-24 md:pb-6 flex items-center justify-center">
          <p className="text-muted-foreground">Loading sponsors...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Sponsors">
      <div className="p-4 md:p-6 bg-[#f5f0e8] min-h-full pb-24 md:pb-6">
        {/* Mobile Back Button */}
        <div className="md:hidden mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/profile")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
        </div>

        {/* Desktop View */}
        <div className="hidden md:block space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-1">Our Partners</h2>
            <p className="text-muted-foreground">
              Proudly supported by these businesses and organizations.
            </p>
          </div>

          {/* Gold Sponsors */}
          {goldSponsors.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-semibold">Gold Partners</h2>
              </div>
              <div className="space-y-4">
                {goldSponsors.map((sponsor: any) => (
                  <Card key={sponsor.id} className="border-0 shadow-md bg-white overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        <div className="w-full md:w-48 h-32 md:h-auto bg-yellow-50 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-yellow-100">
                          {sponsor.logo ? (
                            <img src={sponsor.logo} alt={sponsor.companyName} className="max-w-full max-h-20 object-contain" />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center">
                              <Award className="w-10 h-10 text-yellow-500" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 p-6">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-xl font-bold">{sponsor.companyName}</h3>
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                              GOLD
                            </span>
                          </div>
                          <p className="text-muted-foreground mb-4">{sponsor.description}</p>
                          {sponsor.website && (
                            <a href={sponsor.website} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm" className="gap-2">
                                Visit Website <ExternalLink className="w-4 h-4" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Silver Sponsors */}
          {silverSponsors.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold">Silver Partners</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {silverSponsors.map((sponsor: any) => (
                  <Card key={sponsor.id} className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                          {sponsor.logo ? (
                            <img src={sponsor.logo} alt={sponsor.companyName} className="max-w-full max-h-12 object-contain" />
                          ) : (
                            <Star className="w-8 h-8 text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{sponsor.companyName}</h3>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full flex-shrink-0">
                              SILVER
                            </span>
                          </div>
                          <p className="text-muted-foreground text-sm line-clamp-2 mb-2">{sponsor.description}</p>
                          {sponsor.website && (
                            <a href={sponsor.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1">
                              Website <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Bronze Sponsors */}
          {bronzeSponsors.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Medal className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-semibold">Bronze Partners</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {bronzeSponsors.map((sponsor: any) => (
                  <a key={sponsor.id} href={sponsor.website || "#"} target={sponsor.website ? "_blank" : undefined} rel="noopener noreferrer" className="block">
                    <Card className="border-0 shadow-sm hover:shadow-md transition-all bg-white hover:scale-[1.02]">
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-2">
                          {sponsor.logo ? (
                            <img src={sponsor.logo} alt={sponsor.companyName} className="max-w-full max-h-8 object-contain" />
                          ) : (
                            <Medal className="w-6 h-6 text-amber-600" />
                          )}
                        </div>
                        <h3 className="font-medium text-sm truncate">{sponsor.companyName}</h3>
                      </CardContent>
                    </Card>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Become a Sponsor CTA */}
          <Card className="border-0 shadow-sm bg-black text-white overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-bold mb-2">Become a Partner</h3>
                  <p className="text-gray-400 text-sm">
                    Support the Old Boys network and connect with our growing community of alumni.
                  </p>
                </div>
                <Button onClick={() => setEnquiryOpen(true)} className="bg-amber-500 hover:bg-amber-400 text-black font-semibold gap-2">
                  <Handshake className="w-4 h-4" />
                  Get in Touch
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-4">
          {/* Header */}
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-[#1a1f2c]">Our Partners</h1>
            <p className="text-sm text-[#6b7280] mt-1">Proudly supported by these businesses</p>
          </div>

          {/* Gold Sponsors */}
          {goldSponsors.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-500" />
                <h2 className="text-sm font-semibold text-[#1a1f2c]">Gold Partners</h2>
              </div>
              {goldSponsors.map((sponsor: any) => (
                <div key={sponsor.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                  {/* Logo Banner */}
                  <div className="h-24 bg-yellow-50 flex items-center justify-center p-4">
                    {sponsor.logo ? (
                      <img src={sponsor.logo} alt={sponsor.companyName} className="max-h-16 object-contain" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Award className="w-8 h-8 text-yellow-500" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-[#1a1f2c]">{sponsor.companyName}</h3>
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                        GOLD
                      </span>
                    </div>
                    <p className="text-sm text-[#6b7280] line-clamp-2 mb-3">{sponsor.description}</p>
                    {sponsor.website && (
                      <a href={sponsor.website} target="_blank" rel="noopener noreferrer">
                        <button className="text-sm text-blue-600 font-medium flex items-center gap-1">
                          Visit Website <ExternalLink className="w-3 h-3" />
                        </button>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Silver Sponsors */}
          {silverSponsors.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-[#1a1f2c]">Silver Partners</h2>
              </div>
              {silverSponsors.map((sponsor: any) => (
                <div key={sponsor.id} className="bg-white rounded-2xl shadow-md overflow-hidden p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      {sponsor.logo ? (
                        <img src={sponsor.logo} alt={sponsor.companyName} className="max-w-full max-h-8 object-contain" />
                      ) : (
                        <Star className="w-6 h-6 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-[#1a1f2c] truncate text-sm">{sponsor.companyName}</h3>
                      </div>
                      <p className="text-xs text-[#6b7280] line-clamp-2 mb-2">{sponsor.description}</p>
                      {sponsor.website && (
                        <a href={sponsor.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1">
                          Website <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bronze Sponsors */}
          {bronzeSponsors.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Medal className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-semibold text-[#1a1f2c]">Bronze Partners</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {bronzeSponsors.map((sponsor: any) => (
                  <a key={sponsor.id} href={sponsor.website || "#"} target={sponsor.website ? "_blank" : undefined} rel="noopener noreferrer">
                    <div className="bg-white rounded-2xl shadow-md p-4 text-center">
                      <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-2">
                        {sponsor.logo ? (
                          <img src={sponsor.logo} alt={sponsor.companyName} className="max-w-full max-h-6 object-contain" />
                        ) : (
                          <Medal className="w-5 h-5 text-amber-600" />
                        )}
                      </div>
                      <h3 className="font-medium text-xs text-[#1a1f2c] truncate">{sponsor.companyName}</h3>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Become a Partner CTA */}
          <div className="bg-black rounded-2xl shadow-md p-5 text-center">
            <h3 className="text-lg font-bold text-white mb-1">Become a Partner</h3>
            <p className="text-gray-400 text-xs mb-4">
              Support the Old Boys network and connect with our community.
            </p>
            <Button onClick={() => setEnquiryOpen(true)} className="bg-amber-500 hover:bg-amber-400 text-black font-semibold gap-2 w-full">
              <Handshake className="w-4 h-4" />
              Get in Touch
            </Button>
          </div>
        </div>
      </div>

      {/* Enquiry Dialog */}
      <Dialog open={enquiryOpen} onOpenChange={setEnquiryOpen}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Partner Enquiry</DialogTitle>
            <DialogDescription>
              Fill in your details and we'll get back to you about sponsorship opportunities.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEnquiry} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name *</Label>
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tier">Interested Tier</Label>
              <select
                id="tier"
                className="w-full h-10 px-3 border rounded-md bg-white"
                value={formData.tier}
                onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
              >
                <option value="Gold">Gold Partner</option>
                <option value="Silver">Silver Partner</option>
                <option value="Bronze">Bronze Partner</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Tell us about your business and why you'd like to partner with us..."
                rows={3}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setEnquiryOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1 bg-black hover:bg-gray-800">
                {submitting ? "Submitting..." : "Submit Enquiry"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Sponsors;
