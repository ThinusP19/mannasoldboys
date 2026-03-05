import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { servicesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Mail, Phone, MessageCircle, Trash2, Eye, Search } from "lucide-react";

export const ServicesTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["admin-services"],
    queryFn: () => servicesApi.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => servicesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      toast({ title: "Service deleted" });
    },
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Legal: "bg-blue-100 text-blue-800",
      Finance: "bg-green-100 text-green-800",
      Medical: "bg-red-100 text-red-800",
      Tech: "bg-purple-100 text-purple-800",
      Construction: "bg-orange-100 text-orange-800",
      Agriculture: "bg-lime-100 text-lime-800",
      Education: "bg-yellow-100 text-yellow-800",
      Consulting: "bg-indigo-100 text-indigo-800",
      Other: "bg-gray-100 text-gray-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const handleView = (service: any) => {
    setSelectedService(service);
    setViewDialogOpen(true);
  };

  const filteredServices = services.filter((service: any) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      service.title?.toLowerCase().includes(searchLower) ||
      service.ownerName?.toLowerCase().includes(searchLower) ||
      service.category?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">Marketplace Services</h2>
          <p className="text-muted-foreground">Manage services listed by alumni</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Listed Services
              </CardTitle>
              <CardDescription>
                {services.length} service{services.length === 1 ? "" : "s"} listed
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search services..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading services...</div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search ? "No services match your search" : "No services listed yet"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service: any) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.title}</TableCell>
                      <TableCell>{service.ownerName}</TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(service.category)}>
                          {service.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{service.price}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(service)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(service.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Service Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Service Details</DialogTitle>
            <DialogDescription>
              Listed by {selectedService?.ownerName}
            </DialogDescription>
          </DialogHeader>
          {selectedService && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedService.title}</h3>
                <Badge className={getCategoryColor(selectedService.category)}>
                  {selectedService.category}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">{selectedService.description}</p>

              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="font-medium">Price:</span> {selectedService.price}
              </div>

              <div className="space-y-2">
                <span className="font-medium text-sm">Contact Information:</span>
                {selectedService.contact?.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${selectedService.contact.email}`} className="text-blue-600 hover:underline">
                      {selectedService.contact.email}
                    </a>
                  </div>
                )}
                {selectedService.contact?.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${selectedService.contact.phone}`} className="text-blue-600 hover:underline">
                      {selectedService.contact.phone}
                    </a>
                  </div>
                )}
                {selectedService.contact?.whatsapp && (
                  <div className="flex items-center gap-2 text-sm">
                    <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    <a
                      href={`https://wa.me/${selectedService.contact.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {selectedService.contact.whatsapp}
                    </a>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setViewDialogOpen(false)}
                >
                  Close
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    deleteMutation.mutate(selectedService.id);
                    setViewDialogOpen(false);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
