import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { sponsorEnquiriesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Handshake, Mail, Phone, CheckCircle, XCircle, Trash2, Eye } from "lucide-react";

export const SponsorEnquiriesTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEnquiry, setSelectedEnquiry] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const { data: enquiries = [], isLoading } = useQuery({
    queryKey: ["sponsor-enquiries"],
    queryFn: sponsorEnquiriesApi.getAll,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      sponsorEnquiriesApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsor-enquiries"] });
      toast({ title: "Status updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sponsorEnquiriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsor-enquiries"] });
      toast({ title: "Enquiry deleted" });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "contacted":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Contacted</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "Gold":
        return <Badge className="bg-yellow-100 text-yellow-700">Gold</Badge>;
      case "Silver":
        return <Badge className="bg-gray-100 text-gray-700">Silver</Badge>;
      case "Bronze":
        return <Badge className="bg-amber-100 text-amber-700">Bronze</Badge>;
      default:
        return <Badge variant="outline">{tier}</Badge>;
    }
  };

  const handleView = (enquiry: any) => {
    setSelectedEnquiry(enquiry);
    setViewDialogOpen(true);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">Sponsor Enquiries</h2>
          <p className="text-muted-foreground">Manage partnership requests from businesses</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Handshake className="w-5 h-5" />
            Partner Enquiries
          </CardTitle>
          <CardDescription>
            {enquiries.length} enquir{enquiries.length === 1 ? "y" : "ies"} received
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading enquiries...</div>
          ) : enquiries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No enquiries yet</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enquiries.map((enquiry: any) => (
                    <TableRow key={enquiry.id}>
                      <TableCell className="font-medium">{enquiry.companyName}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{enquiry.contactName}</div>
                          <div className="text-muted-foreground">{enquiry.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getTierBadge(enquiry.tier)}</TableCell>
                      <TableCell>{getStatusBadge(enquiry.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(enquiry.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(enquiry)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({ id: enquiry.id, status: "contacted" })}
                            title="Mark as Contacted"
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({ id: enquiry.id, status: "approved" })}
                            title="Approve"
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({ id: enquiry.id, status: "rejected" })}
                            title="Reject"
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(enquiry.id)}
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

      {/* View Enquiry Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enquiry Details</DialogTitle>
            <DialogDescription>
              Submitted on {selectedEnquiry && new Date(selectedEnquiry.createdAt).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          {selectedEnquiry && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedEnquiry.companyName}</h3>
                {getTierBadge(selectedEnquiry.tier)}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Contact:</span>
                  <span>{selectedEnquiry.contactName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a href={`mailto:${selectedEnquiry.email}`} className="text-blue-600 hover:underline">
                    {selectedEnquiry.email}
                  </a>
                </div>
                {selectedEnquiry.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${selectedEnquiry.phone}`} className="text-blue-600 hover:underline">
                      {selectedEnquiry.phone}
                    </a>
                  </div>
                )}
              </div>

              {selectedEnquiry.message && (
                <div className="space-y-1">
                  <span className="font-medium text-sm">Message:</span>
                  <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
                    {selectedEnquiry.message}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">Status:</span>
                {getStatusBadge(selectedEnquiry.status)}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    updateStatusMutation.mutate({ id: selectedEnquiry.id, status: "contacted" });
                    setViewDialogOpen(false);
                  }}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Mark Contacted
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    updateStatusMutation.mutate({ id: selectedEnquiry.id, status: "approved" });
                    setViewDialogOpen(false);
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
