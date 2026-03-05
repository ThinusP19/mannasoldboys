import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, Image as ImageIcon, Coins } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminProjectsApi } from "@/lib/api";

interface ProjectFormData {
  title: string;
  description: string;
  goal: string;
  images: string[];
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branchCode: string;
  reference: string;
}

export const ProjectsTab = () => {
  const queryClient = useQueryClient();
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [formData, setFormData] = useState<ProjectFormData>({
    title: "",
    description: "",
    goal: "",
    images: [],
    bankName: "",
    accountNumber: "",
    accountHolder: "",
    branchCode: "",
    reference: "",
  });

  // Fetch projects
  const { data: projects = [], isLoading, refetch: refetchProjects } = useQuery({
    queryKey: ["projects", "admin"],
    queryFn: async () => {
      try {
        return await adminProjectsApi.getAll();
      } catch (error) {
        console.error("Error fetching projects:", error);
        return [];
      }
    },
    refetchOnWindowFocus: false,
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: (data: any) => adminProjectsApi.create(data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Project created successfully",
      });
      refetchProjects();
      setProjectDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.error || "Failed to create project",
        variant: "destructive",
      });
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminProjectsApi.update(id, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Project updated successfully",
      });
      refetchProjects();
      setProjectDialogOpen(false);
      setEditingProject(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.error || "Failed to update project",
        variant: "destructive",
      });
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => adminProjectsApi.delete(id),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
      refetchProjects();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.error || "Failed to delete project",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      goal: "",
      images: [],
      bankName: "",
      accountNumber: "",
      accountHolder: "",
      branchCode: "",
      reference: "",
    });
    setEditingProject(null);
  };

  const handleOpenDialog = (project?: any) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        title: project.title || "",
        description: project.description || "",
        goal: project.goal?.toString() || "",
        images: project.images || [],
        bankName: project.bankName || "",
        accountNumber: project.accountNumber || "",
        accountHolder: project.accountHolder || "",
        branchCode: project.branchCode || "",
        reference: project.reference || "",
      });
    } else {
      resetForm();
    }
    setProjectDialogOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const newImages = [...formData.images];
        newImages[index] = base64;
        setFormData({ ...formData, images: newImages });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
  };

  const handleSaveProject = () => {
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Project title is required",
        variant: "destructive",
      });
      return;
    }

    const projectData = {
      title: formData.title,
      description: formData.description || undefined,
      goal: formData.goal ? parseFloat(formData.goal) : undefined,
      images: formData.images.filter(img => img),
      bankName: formData.bankName || undefined,
      accountNumber: formData.accountNumber || undefined,
      accountHolder: formData.accountHolder || undefined,
      branchCode: formData.branchCode || undefined,
      reference: formData.reference || undefined,
    };

    if (editingProject) {
      updateProjectMutation.mutate({
        id: editingProject.id,
        data: projectData,
      });
    } else {
      createProjectMutation.mutate(projectData);
    }
  };

  const handleDeleteProject = (id: string) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      deleteProjectMutation.mutate(id);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Projects Management</h2>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Create Project
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No projects yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <Card key={project.id} className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg pr-2">{project.title}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleOpenDialog(project)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteProject(project.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                    {project.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Project Image */}
                {project.images && project.images.length > 0 && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={project.images[0]}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                    {project.images.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        +{project.images.length - 1} more
                      </div>
                    )}
                  </div>
                )}

                {/* Fundraising Progress */}
                {(project.goal || project.raised) && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(project.raised || 0)}
                      </span>
                    </div>
                    {project.goal && (
                      <>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min((project.raised || 0) / project.goal * 100, 100)}%`
                            }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>Goal: {formatCurrency(project.goal)}</span>
                          <span>{Math.round(((project.raised || 0) / project.goal) * 100)}%</span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Banking Info */}
                {project.accountNumber && (
                  <div className="pt-2 border-t space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <Coins className="w-3 h-3 text-muted-foreground" />
                      <span className="font-medium text-muted-foreground">Banking Details</span>
                    </div>
                    <div className="text-xs space-y-0.5 pl-5">
                      {project.bankName && (
                        <div className="font-medium">{project.bankName}</div>
                      )}
                      <div className="text-muted-foreground">
                        Acc: {project.accountNumber}
                      </div>
                      {project.reference && (
                        <div className="text-muted-foreground">
                          Ref: {project.reference}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Images Count */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                  <ImageIcon className="w-3 h-3" />
                  <span>{project.images?.length || 0} / 3 images</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Project Dialog */}
      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? "Edit Project" : "Create New Project"}
            </DialogTitle>
            <DialogDescription>
              Add project details, banking information, and up to 3 images
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Library Renovation Project"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this project is about..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="goal">Fundraising Goal (ZAR)</Label>
                <Input
                  id="goal"
                  type="number"
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  placeholder="50000"
                />
              </div>
            </div>

            {/* Images */}
            <div className="space-y-2">
              <Label>Project Images (Max 3)</Label>
              <div className="grid grid-cols-3 gap-4">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="space-y-2">
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      {formData.images[index] ? (
                        <div className="relative">
                          <img
                            src={formData.images[index]}
                            alt={`Project ${index + 1}`}
                            className="w-full h-32 object-cover rounded"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2"
                            onClick={() => handleRemoveImage(index)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-xs text-muted-foreground">
                            Click to upload
                          </p>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, index)}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Banking Details */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Coins className="w-4 h-4" />
                Banking Details
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="e.g., Standard Bank"
                  />
                </div>

                <div>
                  <Label htmlFor="accountHolder">Account Holder</Label>
                  <Input
                    id="accountHolder"
                    value={formData.accountHolder}
                    onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                    placeholder="Monnas Old Boys"
                  />
                </div>

                <div>
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    placeholder="1234567890"
                  />
                </div>

                <div>
                  <Label htmlFor="branchCode">Branch Code</Label>
                  <Input
                    id="branchCode"
                    value={formData.branchCode}
                    onChange={(e) => setFormData({ ...formData, branchCode: e.target.value })}
                    placeholder="051001"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="reference">Payment Reference</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="e.g., Library Donation - Your Name"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setProjectDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveProject}
                disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
              >
                {(createProjectMutation.isPending || updateProjectMutation.isPending) ? "Saving..." : "Save Project"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
