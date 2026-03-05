import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { servicesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const CATEGORIES = [
  "Legal",
  "Finance",
  "Medical",
  "Tech",
  "Construction",
  "Agriculture",
  "Education",
  "Consulting",
  "Other",
];

const CreateService = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    phone: "",
    email: "",
    whatsapp: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await servicesApi.create({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: formData.price,
        contact: {
          phone: formData.phone,
          email: formData.email,
          whatsapp: formData.whatsapp,
        },
      });

      toast({
        title: "Service Listed!",
        description: "Your service has been added to the marketplace.",
      });
      navigate("/marketplace");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create service. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="List Service">
      <div className="p-4 md:p-6 bg-[#f5f0e8] min-h-full space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/marketplace")}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Marketplace
        </Button>

        <Card className="border-0 shadow-sm bg-white">
            <CardHeader>
              <CardTitle>List Your Service</CardTitle>
              <CardDescription>
                Offer your professional services to fellow Old Boys
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Service Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Legal Consultation"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    className="w-full h-10 px-3 border rounded-md bg-white"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your service..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price / Rate *</Label>
                  <Input
                    id="price"
                    placeholder="e.g., From R500/hr or Quote on request"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-4">Contact Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        placeholder="0821234567"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        placeholder="0821234567"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-black hover:bg-gray-800" disabled={loading}>
                  {loading ? "Creating..." : "List Service"}
                </Button>
              </form>
            </CardContent>
          </Card>
      </div>
    </AppLayout>
  );
};

export default CreateService;
