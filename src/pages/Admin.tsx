import React, { useState } from "react";
import { useTranslation } from 'react-i18next';
import { AdminLayout } from "@/components/layout/AdminLayout";
import { compressImage } from "@/utils/imageCompression";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  FileText,
  Calendar,
  Heart,
  UserCheck,
  UserX,
  Image as ImageIcon,
  Plus,
  Edit,
  Trash2,
  Save,
  BarChart3,
  Mail,
  Phone,
  Clock,
  Coins,
  TrendingUp,
  Activity,
  MoreVertical,
  Key,
  AlertCircle,
  Bell,
  X,
  RefreshCw,
  Download,
  Search,
  MessageSquare,
  Handshake,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, adminMemorialsApi, adminYearGroupsApi, adminYearGroupPostsApi, sponsorEnquiriesApi } from "@/lib/api";
import { SponsorEnquiriesTab } from "@/components/admin/SponsorEnquiriesTab";
import { ServicesTab } from "@/components/admin/ServicesTab";

// Type definitions
interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "alumni";
  isMember: boolean;
  monthlyAmount?: number;
  hasPasswordResetRequest?: boolean;
  createdAt?: string;
  profile?: {
    id?: string;
    year?: number;
    name?: string;
    phone?: string;
  };
}

interface Memorial {
  id: string;
  name: string;
  year: number;
  photo?: string;
  tribute: string;
  dateOfPassing: string;
  imageLink?: string;
  funeralDate?: string;
  funeralLocation?: string;
  contactNumber?: string;
  [key: string]: unknown;
}

// Helper function to extract error message
const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (error && typeof error === 'object') {
    if ('error' in error && typeof (error as { error?: unknown }).error === 'string') {
      return (error as { error: string }).error;
    }
    if ('details' in error && typeof (error as { details?: unknown }).details === 'string') {
      return (error as { details: string }).details;
    }
  }
  return defaultMessage;
};

interface YearGroup {
  id: string;
  year: number;
  photos?: string[];
  groupPhoto?: string;
  whatsappLink?: string;
  yearInfo?: string;
  [key: string]: unknown;
}

interface Post {
  id: string;
  title: string;
  content: string;
  images?: string[];
  [key: string]: unknown;
}

const Admin = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState<"all" | "members" | "non-members">("all");
  const [userYearFilter, setUserYearFilter] = useState<"all" | string>("all");
  const [yearGroupFilter, setYearGroupFilter] = useState<"all" | string>("all");
  const [passwordResetDialog, setPasswordResetDialog] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [newPassword, setNewPassword] = useState("");
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportOptions, setReportOptions] = useState<{
    filterType: "all" | "members" | "non-members";
    year: string;
  }>({ filterType: "all", year: "all" });

  // Fetch users from API
  const { data: users = [], isLoading: isLoadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      try {
        return await adminApi.getUsers();
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: t('status.error'),
          description: t('admin.failed_load_users'),
          variant: "destructive",
        });
        return [];
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 1 * 60 * 1000, // Consider data fresh for 1 minute
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  });

  // Fetch memorials from API
  const { data: memorials = [], isLoading: isLoadingMemorials, refetch: refetchMemorials } = useQuery({
    queryKey: ["memorials", "admin"],
    queryFn: async () => {
      try {
        return await adminMemorialsApi.getAll();
      } catch (error) {
        console.error("Error fetching memorials:", error);
        return [];
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 1 * 60 * 1000, // Consider data fresh for 1 minute
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  });

  // Fetch year groups from API
  const { data: yearGroups = [], isLoading: isLoadingYearGroups, refetch: refetchYearGroups } = useQuery({
    queryKey: ["year-groups", "admin"],
    queryFn: async () => {
      try {
        return await adminYearGroupsApi.getAll();
      } catch (error) {
        console.error("Error fetching year groups:", error);
        toast({
          title: t('status.error'),
          description: t('admin.failed_load_year_groups'),
          variant: "destructive",
        });
        return [];
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 1 * 60 * 1000, // Consider data fresh for 1 minute
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  });

  // Dialog states
  const [yearGroupDialogOpen, setYearGroupDialogOpen] = useState(false);
  const [selectedYearGroup, setSelectedYearGroup] = useState<YearGroup | null>(null);
  const [memorialDialogOpen, setMemorialDialogOpen] = useState(false);
  const [editingMemorial, setEditingMemorial] = useState<Memorial | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [postsDialogOpen, setPostsDialogOpen] = useState(false);
  const [selectedYearGroupForPosts, setSelectedYearGroupForPosts] = useState<YearGroup | null>(null);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // Form states - images stored as compressed base64 strings for performance
  const [yearGroupForm, setYearGroupForm] = useState({ year: "", yearInfo: "", whatsappLink: "", images: [] as string[], existingPhotos: [] as string[] });
  const [memorialForm, setMemorialForm] = useState({
    name: "",
    year: "",
    photo: null as string | null,
    imageLinks: "",
    tribute: "",
    dateOfPassing: "",
    funeralDate: "",
    funeralLocation: "",
    contactNumber: "",
  });

  // Image processing states
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [imageProcessingProgress, setImageProcessingProgress] = useState({ current: 0, total: 0 });
  const [emailForm, setEmailForm] = useState({
    subject: "",
    message: "",
    yearGroup: "",
  });
  const [postForm, setPostForm] = useState({
    title: "",
    content: "",
    images: [] as string[],
  });

  // Helper function to process images with progress indicator
  const processImagesWithProgress = async (files: File[]): Promise<string[]> => {
    setIsProcessingImages(true);
    setImageProcessingProgress({ current: 0, total: files.length });

    const results: string[] = [];
    for (let i = 0; i < files.length; i++) {
      setImageProcessingProgress({ current: i + 1, total: files.length });
      try {
        const compressed = await compressImage(files[i], {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.8,
          maxSizeKB: 500,
        });
        results.push(compressed);
      } catch (error) {
        console.error('Failed to compress image:', error);
        toast({
          title: "Error",
          description: `Failed to process image ${i + 1}. Skipping...`,
          variant: "destructive",
        });
      }
    }

    setIsProcessingImages(false);
    setImageProcessingProgress({ current: 0, total: 0 });
    return results;
  };

  // Calculate stats
  const totalMonthlyIncome = users
    .filter((u: User) => u.isMember && u.monthlyAmount)
    .reduce((sum: number, u: User) => sum + (u.monthlyAmount || 0), 0);
  
  const stats = {
    totalUsers: users.length,
    totalMembers: users.filter((u: User) => u.isMember).length,
    totalNonMembers: users.filter((u: User) => !u.isMember).length,
    totalAlumni: users.filter((u: User) => u.role === 'alumni').length,
    totalMemorials: memorials.length,
    totalMonthlyIncome,
  };

  // Prepare chart data from real database data
  // User registration trends (last 12 months)
  const getRegistrationTrends = () => {
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        users: 0,
      });
    }
    
    users.forEach((user: User) => {
      if (user.createdAt) {
        const userDate = new Date(user.createdAt);
        const monthKey = userDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const monthData = months.find(m => m.month === monthKey);
        if (monthData) {
          monthData.users += 1;
        }
      }
    });
    
    return months;
  };

  // Users by year group
  const getUsersByYear = () => {
    const yearMap = new Map<number, number>();
    users.forEach((user: User) => {
      if (user.profile?.year) {
        const year = user.profile.year;
        yearMap.set(year, (yearMap.get(year) || 0) + 1);
      }
    });
    
    return Array.from(yearMap.entries())
      .map(([year, count]) => ({ year: year.toString(), users: count }))
      .sort((a, b) => parseInt(a.year) - parseInt(b.year))
      .slice(-10); // Last 10 years
  };

  // Members vs Non-members pie chart data
  const membershipData = [
    { name: 'Members', value: stats.totalMembers, color: '#10b981' },
    { name: 'Non-Members', value: stats.totalNonMembers, color: '#6b7280' },
  ];

  // Content distribution
  const contentData = [
    { name: 'Memorials', value: stats.totalMemorials, color: '#ef4444' },
    { name: 'Year Groups', value: yearGroups.length, color: '#3b82f6' },
    { name: 'Users', value: stats.totalUsers, color: '#a855f7' },
  ];

  // Monthly income breakdown by member
  const getMonthlyIncomeBreakdown = () => {
    const incomeRanges = [
      { range: 'R0-R50', min: 0, max: 50, count: 0, total: 0 },
      { range: 'R51-R100', min: 51, max: 100, count: 0, total: 0 },
      { range: 'R101-R150', min: 101, max: 150, count: 0, total: 0 },
      { range: 'R151-R200', min: 151, max: 200, count: 0, total: 0 },
      { range: 'R200+', min: 201, max: Infinity, count: 0, total: 0 },
    ];

    users.forEach((user: User) => {
      if (user.isMember && user.monthlyAmount) {
        const amount = user.monthlyAmount;
        const range = incomeRanges.find(r => amount >= r.min && amount <= r.max);
        if (range) {
          range.count += 1;
          range.total += amount;
        }
      }
    });

    return incomeRanges.map(r => ({
      range: r.range,
      members: r.count,
      income: r.total,
    }));
  };

  const registrationTrends = getRegistrationTrends();
  const usersByYear = getUsersByYear();
  const incomeBreakdown = getMonthlyIncomeBreakdown();

  // Update user membership mutation
  const updateMembershipMutation = useMutation({
    mutationFn: async (data: { userId: string; isMember: boolean; monthlyAmount?: number }) => {
      return await adminApi.updateUserMembership(data.userId, {
        isMember: data.isMember,
        monthlyAmount: data.monthlyAmount,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      refetchUsers();
      toast({
        title: t('status.success'),
        description: t('admin.membership_updated'),
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error && typeof error === 'object' && 'error' in error 
        ? (error as { error?: string; details?: string }).error 
        : error && typeof error === 'object' && 'details' in error
        ? (error as { details?: string }).details
        : "Failed to update membership";
      toast({
        title: "Error",
        description: errorMessage || "Failed to update membership",
        variant: "destructive",
      });
    },
  });


  // Toggle member status (remove member)
  const handleRemoveMember = (userId: string) => {
    if (window.confirm("Are you sure you want to remove this user's membership?")) {
      updateMembershipMutation.mutate({
        userId,
        isMember: false,
        monthlyAmount: undefined,
      });
    }
  };

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await adminApi.deleteUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      refetchUsers();
      toast({
        title: t('status.success'),
        description: t('admin.user_deleted'),
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error && typeof error === 'object' && 'error' in error
        ? (error as { error?: string; details?: string }).error
        : error && typeof error === 'object' && 'details' in error
        ? (error as { details?: string }).details
        : "Failed to delete user";
      toast({
        title: "Error",
        description: errorMessage || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Delete user handler
  const handleDeleteUser = (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to permanently delete "${userName}"? This action cannot be undone.`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  // Get unique years from users for report filter
  const uniqueYears = [...new Set(users.map((u: User) => u.profile?.year).filter(Boolean))].sort((a, b) => (b || 0) - (a || 0));

  // Generate CSV report for users with options
  const handleGenerateReport = () => {
    // Filter users based on report options
    let reportUsers = users.filter((user: User) => {
      // Filter by membership status
      if (reportOptions.filterType === "members" && !user.isMember) return false;
      if (reportOptions.filterType === "non-members" && user.isMember) return false;
      // Filter by year
      if (reportOptions.year !== "all" && user.profile?.year?.toString() !== reportOptions.year) return false;
      return true;
    });

    if (reportUsers.length === 0) {
      toast({
        title: "No data",
        description: "No users match the selected filters",
        variant: "destructive",
      });
      return;
    }

    // Build CSV content
    const headers = ["Name", "Email", "Year", "Role", "Status", "Monthly Amount"];
    const rows = reportUsers.map((user: User) => [
      user.name,
      user.email,
      user.profile?.year || "N/A",
      user.role,
      user.isMember ? "Member" : "Non-Member",
      user.isMember && user.monthlyAmount ? `R${user.monthlyAmount}` : "-"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Build filename based on filters
    let filename = "users-report";
    if (reportOptions.filterType !== "all") filename += `-${reportOptions.filterType}`;
    if (reportOptions.year !== "all") filename += `-${reportOptions.year}`;
    filename += `-${new Date().toISOString().split("T")[0]}.csv`;

    // Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    setReportDialogOpen(false);
    toast({
      title: "Report Generated",
      description: `Downloaded ${reportUsers.length} users`,
    });
  };

  // Helper function to convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result); // Returns data:image/jpeg;base64,...
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // Create/Update year group mutation
  const yearGroupMutation = useMutation({
    mutationFn: async (data: {
      year: number;
      groupPhoto?: string | null;
      yearInfo?: string | null;
      whatsappLink?: string | null;
    }) => {
    if (selectedYearGroup) {
        return await adminYearGroupsApi.update(selectedYearGroup.year, data);
      } else {
        return await adminYearGroupsApi.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["year-groups"] });
      refetchYearGroups();
      toast({
        title: "Success",
        description: selectedYearGroup ? "Year group updated successfully" : "Year group created successfully",
      });
      setYearGroupDialogOpen(false);
      setSelectedYearGroup(null);
      setYearGroupForm({ year: "", yearInfo: "", whatsappLink: "", images: [], existingPhotos: [] });
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to save year group"),
        variant: "destructive",
      });
    },
  });

  const handleSaveYearGroup = async () => {
    // Validate year
    const newYear = selectedYearGroup ? selectedYearGroup.year : parseInt(yearGroupForm.year);
      if (isNaN(newYear)) {
        toast({
          title: t('validation.year_invalid'),
          description: t('admin.invalid_year_4digit'),
          variant: "destructive",
        });
        return;
      }

    // Validate WhatsApp link if provided
    if (yearGroupForm.whatsappLink && yearGroupForm.whatsappLink.trim()) {
      const link = yearGroupForm.whatsappLink.trim();
      if (!link.startsWith('https://') && !link.startsWith('http://')) {
        toast({
          title: t('validation.invalid_whatsapp'),
          description: t('admin.invalid_whatsapp_link'),
          variant: "destructive",
        });
        return;
      }
      if (!link.includes('whatsapp.com') && !link.includes('wa.me')) {
        toast({
          title: t('validation.invalid_whatsapp'),
          description: t('admin.invalid_whatsapp_domain'),
          variant: "destructive",
        });
        return;
      }
    }

    // Combine existing photos with new (already compressed) images
    const photos: string[] = [...yearGroupForm.existingPhotos, ...yearGroupForm.images];

    // Prepare data
    const data = {
        year: newYear,
      photos: photos.length > 0 ? photos : null,
      yearInfo: yearGroupForm.yearInfo || null,
      whatsappLink: yearGroupForm.whatsappLink?.trim() || null,
    };

    yearGroupMutation.mutate(data);
  };

  // Delete year group mutation
  const deleteYearGroupMutation = useMutation({
    mutationFn: async (year: number) => {
      return await adminYearGroupsApi.delete(year);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["year-groups"] });
      refetchYearGroups();
      toast({
        title: t('status.success'),
        description: t('admin.year_group_deleted'),
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to delete year group"),
        variant: "destructive",
      });
    },
  });

  const handleDeleteYearGroup = (year: number) => {
    if (window.confirm(`Are you sure you want to delete the year group for ${year}?`)) {
      deleteYearGroupMutation.mutate(year);
    }
  };

  // Fetch posts for selected year group
  const { data: yearGroupPosts = [], isLoading: isLoadingPosts, refetch: refetchPosts } = useQuery({
    queryKey: ["year-group-posts", selectedYearGroupForPosts?.id],
    queryFn: async () => {
      if (!selectedYearGroupForPosts?.id) return [];
      try {
        return await adminYearGroupPostsApi.getByYearGroup(selectedYearGroupForPosts.id);
      } catch (error) {
        console.error("Error fetching posts:", error);
        return [];
      }
    },
    enabled: !!selectedYearGroupForPosts?.id,
    refetchOnWindowFocus: false,
  });

  // Post mutations
  const postMutation = useMutation({
    mutationFn: async (data: { yearGroupId: string; title: string; content: string; images: string[] }) => {
      if (editingPost) {
        return await adminYearGroupPostsApi.update(editingPost.id, data);
      } else {
        return await adminYearGroupPostsApi.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["year-group-posts", selectedYearGroupForPosts?.id] });
      refetchPosts();
      toast({
        title: "Success",
        description: editingPost ? "Post updated successfully" : "Post created successfully",
      });
      setPostDialogOpen(false);
      setEditingPost(null);
      setPostForm({ title: "", content: "", images: [] });
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to save post"),
        variant: "destructive",
      });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (id: string) => {
      return await adminYearGroupPostsApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["year-group-posts", selectedYearGroupForPosts?.id] });
      refetchPosts();
      toast({
        title: t('status.success'),
        description: t('admin.post_deleted'),
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to delete post"),
        variant: "destructive",
      });
    },
  });

  const handleOpenPosts = (yearGroup: YearGroup) => {
    setSelectedYearGroupForPosts(yearGroup);
    setPostsDialogOpen(true);
  };

  const handleOpenPostEdit = (post?: Post) => {
    if (post) {
      setEditingPost(post);
      setPostForm({
        title: post.title || "",
        content: post.content || "",
        images: [],
      });
    } else {
      setEditingPost(null);
      setPostForm({ title: "", content: "", images: [] });
    }
    setPostDialogOpen(true);
  };

  const handleSavePost = async () => {
    if (!selectedYearGroupForPosts?.id) return;

    // Combine new images (already compressed) with existing images
    const allImages = [...postForm.images];
    if (editingPost?.images && Array.isArray(editingPost.images) && editingPost.images.length > 0) {
      allImages.push(...editingPost.images);
    }

    postMutation.mutate({
      yearGroupId: selectedYearGroupForPosts.id,
      title: postForm.title,
      content: postForm.content,
      images: allImages,
    });
  };

  const handleDeletePost = (id: string) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      deletePostMutation.mutate(id);
    }
  };

  // Memorial mutations
  const memorialMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      year: number;
      photo?: string | null;
      imageLink?: string | null;
      tribute: string;
      dateOfPassing: string;
      funeralDate?: string | null;
      funeralLocation?: string | null;
      contactNumber?: string | null;
    }) => {
    if (editingMemorial) {
        return await adminMemorialsApi.update(editingMemorial.id, data);
    } else {
        return await adminMemorialsApi.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memorials"] });
      refetchMemorials();
      toast({
        title: "Success",
        description: editingMemorial ? "Memorial updated successfully" : "Memorial created successfully",
      });
    setMemorialDialogOpen(false);
    setEditingMemorial(null);
    setMemorialForm({ 
      name: "", 
      year: "", 
      photo: null, 
      imageLinks: "",
      tribute: "", 
      dateOfPassing: "",
      funeralDate: "",
      funeralLocation: "",
      contactNumber: "",
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error && typeof error === 'object' && 'error' in error 
        ? (error as { error?: string; details?: string }).error 
        : error && typeof error === 'object' && 'details' in error
        ? (error as { details?: string }).details
        : "Failed to save memorial";
      toast({
        title: "Error",
        description: errorMessage || "Failed to save memorial",
        variant: "destructive",
      });
    },
  });

  const handleSaveMemorial = async () => {
    // Validate required fields with specific messages
    if (!memorialForm.name?.trim()) {
      toast({
        title: t('admin.name_required'),
        description: t('admin.enter_person_name'),
        variant: "destructive",
      });
      return;
    }
    if (!memorialForm.tribute?.trim()) {
      toast({
        title: t('admin.tribute_required'),
        description: t('admin.enter_tribute'),
        variant: "destructive",
      });
      return;
    }
    if (!memorialForm.dateOfPassing) {
      toast({
        title: t('admin.date_required'),
        description: t('admin.select_date_passing'),
        variant: "destructive",
      });
      return;
    }

    // Validate year
    if (!memorialForm.year || isNaN(Number(memorialForm.year))) {
      toast({
        title: t('validation.year_invalid'),
        description: t('admin.invalid_matric_year'),
        variant: "destructive",
      });
      return;
    }

    // Photo is already compressed as base64 string
    const photoBase64: string | null = memorialForm.photo || editingMemorial?.photo || null;

    // Validate and parse image links (comma-separated URLs)
    let imageLink: string | null = null;
    if (memorialForm.imageLinks?.trim()) {
      const link = memorialForm.imageLinks.trim().split(",")[0].trim();
      if (link && !link.startsWith('https://') && !link.startsWith('http://')) {
        toast({
          title: t('admin.invalid_link_more_images'),
          description: t('admin.link_must_start_https'),
          variant: "destructive",
        });
        return;
      }
      imageLink = link || null;
    }

    // Validate funeral location link if provided
    if (memorialForm.funeralLocation?.trim()) {
      const location = memorialForm.funeralLocation.trim();
      // If it looks like a URL (contains . and no spaces), validate it
      if (location.includes('.') && !location.includes(' ') && !location.startsWith('https://') && !location.startsWith('http://')) {
        toast({
          title: t('admin.invalid_funeral_location_link'),
          description: t('admin.link_must_start_https_maps'),
          variant: "destructive",
        });
        return;
      }
    }

    const memorialData = {
      name: memorialForm.name.trim(),
      year: parseInt(memorialForm.year),
      photo: photoBase64,
      imageLink: imageLink,
      tribute: memorialForm.tribute.trim(),
      dateOfPassing: memorialForm.dateOfPassing,
      funeralDate: memorialForm.funeralDate?.trim() || null,
      funeralLocation: memorialForm.funeralLocation?.trim() || null,
      contactNumber: memorialForm.contactNumber?.trim() || null,
    };

    console.log("Creating/updating memorial with data:", memorialData);
    memorialMutation.mutate(memorialData);
  };

  // Delete mutations
  const deleteMemorialMutation = useMutation({
    mutationFn: async (id: string) => await adminMemorialsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memorials"] });
      refetchMemorials();
      toast({ title: t('status.success'), description: t('admin.memorial_deleted') });
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to delete memorial"),
        variant: "destructive",
      });
    },
  });

  // Password reset mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) =>
      await adminApi.resetUserPassword(userId, newPassword),
    onSuccess: (_data, variables) => {
      const user = passwordResetDialog.user;
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      refetchUsers();
      setPasswordResetDialog({ open: false, user: null });
      setNewPassword("");
      toast({
        title: "Password Reset",
        description: "User password has been reset successfully.",
      });

      // Open WhatsApp with pre-filled message if user has phone number
      const phone = user?.profile?.phone?.replace(/\D/g, '');
      if (phone) {
        const message = encodeURIComponent(
          `Hi ${user?.name},\n\nYour Monnas Old Boys password has been reset.\n\nNew Password: ${variables.newPassword}\n\nPlease log in and change your password.`
        );
        window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
      }
    },
    onError: (error: unknown) => {
      toast({
        title: "Failed to reset password",
        description: getErrorMessage(error, "Please try again later."),
        variant: "destructive",
      });
    },
  });

  const handleResetPassword = () => {
    if (!passwordResetDialog.user || !newPassword || newPassword.length < 6) {
      toast({
        title: "Invalid password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }
    resetPasswordMutation.mutate({
      userId: passwordResetDialog.user.id,
      newPassword,
    });
  };

  const handleDelete = (type: "memorial", id: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;

    if (type === "memorial") {
      deleteMemorialMutation.mutate(id);
    }
  };

  const handleSendEmail = () => {
    const recipientCount = emailForm.yearGroup 
      ? users.filter(u => u.profile?.year === parseInt(emailForm.yearGroup) && u.isMember).length
      : users.filter(u => u.isMember).length;

    toast({
      title: "Email Sent",
      description: `Email queued for ${recipientCount} members`,
    });

    setEmailDialogOpen(false);
    setEmailForm({ subject: "", message: "", yearGroup: "" });
  };

  const openYearGroupEdit = async (yearGroup?: YearGroup) => {
    if (yearGroup) {
      // Fetch full year group data including photos
      try {
        const fullYearGroup = await adminYearGroupsApi.getByYear(yearGroup.year);
        setSelectedYearGroup(fullYearGroup);
        // Get existing photos from fullYearGroup
        const existingPhotos: string[] = fullYearGroup.photos && Array.isArray(fullYearGroup.photos)
          ? fullYearGroup.photos
          : fullYearGroup.groupPhoto
            ? [fullYearGroup.groupPhoto]
            : [];
        setYearGroupForm({
          year: fullYearGroup.year.toString(),
          yearInfo: (typeof fullYearGroup.yearInfo === 'string' ? fullYearGroup.yearInfo : "") || "",
          whatsappLink: fullYearGroup.whatsappLink || "",
          images: [],
          existingPhotos,
        });
      } catch (error) {
        console.error("Failed to fetch year group details:", error);
        // Fallback to using list data without photos
        setSelectedYearGroup(yearGroup);
        const existingPhotos: string[] = yearGroup.photos && Array.isArray(yearGroup.photos)
          ? yearGroup.photos
          : yearGroup.groupPhoto
            ? [yearGroup.groupPhoto]
            : [];
        setYearGroupForm({
          year: yearGroup.year.toString(),
          yearInfo: (typeof yearGroup.yearInfo === 'string' ? yearGroup.yearInfo : "") || "",
          whatsappLink: yearGroup.whatsappLink || "",
          images: [],
          existingPhotos,
        });
      }
    } else {
      setSelectedYearGroup(null);
      setYearGroupForm({ year: "", yearInfo: "", whatsappLink: "", images: [], existingPhotos: [] });
    }
    setYearGroupDialogOpen(true);
  };

  const openMemorialEdit = (memorial?: Memorial) => {
    if (memorial) {
      setEditingMemorial(memorial);
      setMemorialForm({
        name: memorial.name,
        year: memorial.year.toString(),
        photo: null,
        imageLinks: memorial.imageLink || "",
        tribute: memorial.tribute,
        dateOfPassing: memorial.dateOfPassing?.split("T")[0] || "",
        funeralDate: memorial.funeralDate?.split("T")[0] || "",
        funeralLocation: memorial.funeralLocation || "",
        contactNumber: memorial.contactNumber || "",
      });
    } else {
      setEditingMemorial(null);
      setMemorialForm({ 
        name: "", 
        year: "", 
        photo: null, 
        imageLinks: "",
        tribute: "", 
        dateOfPassing: "",
        funeralDate: "",
        funeralLocation: "",
        contactNumber: "",
      });
    }
    setMemorialDialogOpen(true);
  };

  // Filter data based on search query, membership filter, and year filter
  const filteredUsers = users
    .filter((user: User) => {
      // Filter by membership status
      if (userFilter === "members" && !user.isMember) return false;
      if (userFilter === "non-members" && user.isMember) return false;
      return true;
    })
    .filter((user: User) => {
      // Filter by year
      if (userYearFilter !== "all" && user.profile?.year?.toString() !== userYearFilter) return false;
      return true;
    })
    .filter((user: User) => {
      // Filter by search query
      if (!searchQuery) return true;
      return (
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.profile?.year?.toString().includes(searchQuery) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    // Sort admins first
    .sort((a: User, b: User) => {
      if (a.role === "admin" && b.role !== "admin") return -1;
      if (a.role !== "admin" && b.role === "admin") return 1;
      return 0;
    });

  const filteredYearGroups = yearGroups
    .filter((group: YearGroup) => {
      // Filter by year group filter
      if (yearGroupFilter !== "all" && group.year.toString() !== yearGroupFilter) return false;
      return true;
    })
    .filter((group: YearGroup) => {
      // Filter by search query
      if (!searchQuery) return true;
      return (
        group.year.toString().includes(searchQuery) ||
        group.yearInfo?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

  const filteredMemorials = searchQuery
    ? memorials.filter(
        (memorial) =>
          memorial.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          memorial.year.toString().includes(searchQuery) ||
          memorial.tribute.toLowerCase().includes(searchQuery.toLowerCase()) ||
          memorial.funeralLocation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          memorial.contactNumber?.includes(searchQuery)
      )
    : memorials;

  return (
    <AdminLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      title={t('admin.dashboard')}
    >
      <div className="p-4 md:p-8 space-y-6">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <>
            {searchQuery && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Showing search results for: <strong>"{searchQuery}"</strong>
                </p>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold mb-1">{t('admin.overview')}</h2>
              <p className="text-muted-foreground">{t('admin.manage_network')}</p>
            </div>

            {/* Stats Grid - Modern Design */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-lg bg-black hover:shadow-xl transition-all hover:scale-105">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    {t('admin.total_users')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <span className="text-4xl font-bold text-white">{stats.totalUsers}</span>
                    <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-black hover:shadow-xl transition-all hover:scale-105">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    {t('admin.total_members')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <span className="text-4xl font-bold text-white">{stats.totalMembers}</span>
                    <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                      <UserCheck className="w-6 h-6 text-white" />
                  </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-black hover:shadow-xl transition-all hover:scale-105">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    {t('admin.memorials')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <span className="text-4xl font-bold text-white">{stats.totalMemorials}</span>
                    <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-black hover:shadow-xl transition-all hover:scale-105">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    {t('admin.year_groups')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <span className="text-4xl font-bold text-white">{yearGroups.length}</span>
                    <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                      <ImageIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-6">
              {/* User Registration Trends - Full Width */}
              <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow">
                <CardHeader className="bg-black rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-white text-xl">
                        <TrendingUp className="w-6 h-6 text-blue-400" />
                        User Registration Trends
                      </CardTitle>
                      <CardDescription className="text-gray-400 mt-1">New registrations over the last 12 months</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={registrationTrends}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6b7280" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="users" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        fill="url(#colorUsers)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Users by Year Group */}
              <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-shadow">
                <CardHeader className="bg-black rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <BarChart3 className="w-5 h-5 text-emerald-400" />
                    Users by Year Group
                  </CardTitle>
                  <CardDescription className="text-gray-400">Distribution across graduation years (last 10 years)</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={usersByYear}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="#6b7280" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                      <Tooltip />
                      <Bar dataKey="users" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Row 2: Membership Status & Content Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Membership Status Pie Chart */}
                <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-black rounded-t-lg">
                    <CardTitle className="flex items-center gap-2 text-white">
                      <UserCheck className="w-5 h-5 text-emerald-400" />
                      Membership Status
                    </CardTitle>
                    <CardDescription className="text-gray-400">Members vs Non-Members distribution</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={membershipData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {membershipData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Content Distribution Pie Chart */}
                <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-black rounded-t-lg">
                    <CardTitle className="flex items-center gap-2 text-white">
                      <FileText className="w-5 h-5 text-blue-400" />
                      Content Distribution
                    </CardTitle>
                    <CardDescription className="text-gray-400">Memorials, Year Groups & Users breakdown</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={contentData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {contentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Income Breakdown Bar Chart */}
              <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-shadow">
                <CardHeader className="bg-black rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Coins className="w-5 h-5 text-amber-400" />
                    Monthly Contribution Breakdown
                  </CardTitle>
                  <CardDescription className="text-gray-400">Member distribution by monthly contribution amount</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={incomeBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="range" tick={{ fontSize: 12 }} stroke="#6b7280" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          name === 'members' ? `${value} members` : `R${value.toLocaleString()}`,
                          name === 'members' ? 'Members' : 'Total Income'
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="members" name="Members" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

            </div>

            {/* Quick Actions */}
            <Card className="border-0 shadow-md bg-white">
              <CardHeader className="bg-black rounded-t-lg">
                <CardTitle className="text-white">{t('admin.quick_actions')}</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-black hover:text-white hover:border-gray-600 transition-colors"
                    onClick={() => setActiveTab("users")}
                  >
                    <Users className="w-6 h-6" />
                    <span>{t('admin.manage_users')}</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-black hover:text-white hover:border-gray-600 transition-colors"
                    onClick={() => setActiveTab("year-groups")}
                  >
                    <ImageIcon className="w-6 h-6" />
                    <span>{t('admin.year_groups')}</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-black hover:text-white hover:border-gray-600 transition-colors"
                    onClick={() => setActiveTab("memorials")}
                  >
                    <Heart className="w-6 h-6" />
                    <span>{t('admin.memorials')}</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-black hover:text-white hover:border-gray-600 transition-colors"
                    onClick={() => setActiveTab("sponsor-enquiries")}
                  >
                    <Handshake className="w-6 h-6" />
                    <span>Sponsors</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <>
            {searchQuery && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Found {filteredUsers.length} user(s) matching: <strong>"{searchQuery}"</strong>
                </p>
              </div>
            )}
            <Card className="border-0 shadow-sm bg-white">
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('admin.users')}</CardTitle>
                    <CardDescription>{t('admin.manage_network')}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-green-50">
                      {stats.totalMembers} Members
                    </Badge>
                    <Badge variant="outline" className="bg-gray-50">
                      {stats.totalNonMembers} Non-Members
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <Input
                    placeholder={t('admin.search_users')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-64"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={userFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUserFilter("all")}
                    >
                      All ({stats.totalUsers})
                    </Button>
                    <Button
                      variant={userFilter === "members" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUserFilter("members")}
                    >
                      Members ({stats.totalMembers})
                    </Button>
                    <Button
                      variant={userFilter === "non-members" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUserFilter("non-members")}
                    >
                      Non-Members ({stats.totalNonMembers})
                    </Button>
                    <Button onClick={() => setReportDialogOpen(true)} variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      {t('common.download')}
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm text-muted-foreground mr-2">Year:</span>
                  <Button
                    variant={userYearFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUserYearFilter("all")}
                  >
                    All
                  </Button>
                  {uniqueYears.slice(0, 8).map((year) => (
                    <Button
                      key={year}
                      variant={userYearFilter === String(year) ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUserYearFilter(String(year))}
                    >
                      {year}
                    </Button>
                  ))}
                  {uniqueYears.length > 8 && (
                    <Select
                      value={userYearFilter !== "all" && !uniqueYears.slice(0, 8).includes(Number(userYearFilter)) ? userYearFilter : ""}
                      onValueChange={(value) => setUserYearFilter(value)}
                    >
                      <SelectTrigger className="w-24 h-8">
                        <SelectValue placeholder={t('admin.more_actions')} />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueYears.slice(8).map((year) => (
                          <SelectItem key={year} value={String(year)}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('profile.name')}</TableHead>
                      <TableHead>{t('profile.email')}</TableHead>
                      <TableHead>{t('profile.matric_year')}</TableHead>
                      <TableHead>{t('common.all')}</TableHead>
                      <TableHead>{t('status.loading')}</TableHead>
                      <TableHead>{t('admin.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.profile?.year || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "default" : "outline"}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.isMember ? (
                            <Badge className="bg-green-100 text-green-800">
                              Member
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50">
                              Non-Member
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.isMember && user.monthlyAmount ? (
                            <span className="font-medium text-green-700">R{user.monthlyAmount.toLocaleString()}/month</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.hasPasswordResetRequest && user.role !== "admin" && (
                              <AlertCircle className="w-4 h-4 text-orange-500" aria-label="Password reset requested" />
                            )}
                            {user.role !== "admin" && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setPasswordResetDialog({ open: true, user });
                                      setNewPassword("");
                                    }}
                                  >
                                    <Key className="w-4 h-4 mr-2" />
                                    {t('admin.reset_pass')}
                                  </DropdownMenuItem>
                                  {user.isMember && (
                                    <DropdownMenuItem
                                      onClick={() => handleRemoveMember(user.id)}
                                      className="text-red-600"
                                    >
                                      <UserX className="w-4 h-4 mr-2" />
                                      {t('admin.remove_member')}
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteUser(user.id, user.name)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    {t('common.delete')}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          </>
        )}

        {/* Year Groups Tab */}
        {activeTab === "year-groups" && (
          <>
            {searchQuery && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Found {filteredYearGroups.length} year group(s) matching: <strong>"{searchQuery}"</strong>
                </p>
              </div>
            )}
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{t('admin.year_groups')}</h2>
                <p className="text-muted-foreground mt-1">{t('admin.manage_network')}</p>
              </div>
              <Button onClick={() => openYearGroupEdit()} className="bg-[#1e3a5f] hover:bg-[#2d4a6f]">
                <Plus className="w-4 h-4 mr-2" />
                {t('admin.create_year_group')}
              </Button>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="relative w-full lg:w-72">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder={t('admin.search_year_groups')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={yearGroupFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setYearGroupFilter("all")}
                    className={yearGroupFilter === "all" ? "bg-[#1e3a5f]" : ""}
                  >
                    All ({yearGroups.length})
                  </Button>
                  {yearGroups.slice(0, 5).map((group: YearGroup) => (
                    <Button
                      key={group.year}
                      variant={yearGroupFilter === String(group.year) ? "default" : "outline"}
                      size="sm"
                      onClick={() => setYearGroupFilter(String(group.year))}
                      className={yearGroupFilter === String(group.year) ? "bg-[#1e3a5f]" : ""}
                    >
                      {group.year}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Year Groups Grid */}
            {isLoadingYearGroups ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e3a5f] mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading year groups...</p>
                </div>
              </div>
            ) : filteredYearGroups.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No year groups found</h3>
                <p className="text-muted-foreground mb-4">Create your first year group to get started!</p>
                <Button onClick={() => openYearGroupEdit()} className="bg-[#1e3a5f] hover:bg-[#2d4a6f]">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Year Group
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredYearGroups.map((group: YearGroup) => {
                  const photoCount = group.photos?.length || (group.groupPhoto ? 1 : 0);
                  const hasWhatsApp = !!group.whatsappLink;
                  const hasInfo = !!group.yearInfo;

                  return (
                    <div
                      key={group.year}
                      className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all duration-200"
                    >
                      {/* Image Section */}
                      <div className="relative aspect-[4/3] bg-gradient-to-br from-[#1e3a5f] to-[#3b5998] overflow-hidden">
                        {group.groupPhoto || (group.photos && group.photos.length > 0) ? (
                          <img
                            src={group.photos?.[0] || group.groupPhoto}
                            alt={`Class of ${group.year}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-white/70">
                            <ImageIcon className="w-12 h-12 mb-2" />
                            <span className="text-sm">No photo yet</span>
                          </div>
                        )}
                        {/* Year Badge */}
                        <div className="absolute top-3 left-3">
                          <span className="px-3 py-1.5 bg-black/70 backdrop-blur-sm text-white text-sm font-bold rounded-full">
                            {group.year}
                          </span>
                        </div>
                        {/* Status Badges */}
                        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                          {hasWhatsApp && (
                            <span className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              WhatsApp
                            </span>
                          )}
                          {photoCount > 1 && (
                            <span className="px-2 py-1 bg-white/90 text-gray-700 text-xs font-medium rounded-full flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              {photoCount}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-4">
                        <h3 className="font-bold text-lg text-gray-900 mb-1">Class of {group.year}</h3>
                        {hasInfo ? (
                          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{group.yearInfo}</p>
                        ) : (
                          <p className="text-sm text-gray-400 italic mb-3">No description added</p>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-2">
                          <Button
                            size="sm"
                            className="w-full bg-[#1e3a5f] hover:bg-[#2d4a6f] text-white"
                            onClick={() => handleOpenPosts(group)}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Manage Posts
                          </Button>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 border-gray-200 hover:bg-gray-50"
                              onClick={() => openYearGroupEdit(group)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => handleDeleteYearGroup(group.year)}
                              disabled={deleteYearGroupMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}


        {/* Memorials Tab */}
        {activeTab === "memorials" && (
          <>
            {searchQuery && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Found {filteredMemorials.length} memorial(s) matching: <strong>"{searchQuery}"</strong>
                </p>
              </div>
            )}
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{t('admin.memorials')}</h2>
                <p className="text-muted-foreground mt-1">{t('admin.honor_alumni')}</p>
              </div>
              <Button onClick={() => openMemorialEdit()} className="bg-[#1e3a5f] hover:bg-[#2a4a6f]">
                <Plus className="w-4 h-4 mr-2" />
                {t('memorial.create')}
              </Button>
            </div>

            {/* Memorials Grid */}
            {filteredMemorials.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('admin.no_memorials_yet')}</h3>
                <p className="text-muted-foreground mb-4">{t('admin.create_memorial_desc')}</p>
                <Button onClick={() => openMemorialEdit()} className="bg-[#1e3a5f] hover:bg-[#2a4a6f]">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Memorial
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredMemorials.map((memorial) => {
                  const hasPhoto = memorial.photo || memorial.imageLink;
                  return (
                    <div
                      key={memorial.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {/* Simple Card Content */}
                      <div className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          {/* Photo */}
                          <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                            {hasPhoto ? (
                              <img
                                src={memorial.photo || memorial.imageLink}
                                alt={memorial.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Heart className="w-6 h-6 text-gray-300" />
                              </div>
                            )}
                          </div>
                          {/* Name & Year */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{memorial.name}</h3>
                            <p className="text-sm text-gray-500">Class of {memorial.year}</p>
                          </div>
                        </div>

                        {/* Date of Passing */}
                        <p className="text-xs text-gray-400 mb-2">
                          Passed: {new Date(memorial.dateOfPassing).toLocaleDateString()}
                        </p>

                        {/* Tribute Preview */}
                        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                          {memorial.tribute || <span className="italic text-gray-400">No tribute added</span>}
                        </p>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-[#1e3a5f] hover:bg-[#2a4a6f] text-white"
                            onClick={() => openMemorialEdit(memorial)}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-200 text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete("memorial", memorial.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Sponsor Enquiries Tab */}
        {activeTab === "sponsor-enquiries" && (
          <SponsorEnquiriesTab />
        )}

        {/* Marketplace Tab */}
        {activeTab === "marketplace" && (
          <ServicesTab />
        )}

      </div>

        {/* Year Group Edit Dialog */}
        <Dialog open={yearGroupDialogOpen} onOpenChange={setYearGroupDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedYearGroup ? t('admin.edit_year_group') + ` - ${t('profile.class_of', { year: selectedYearGroup.year })}` : t('admin.create_year_group')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {!selectedYearGroup ? (
                <div className="space-y-2">
                  <Label htmlFor="year">Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    value={yearGroupForm.year}
                    onChange={(e) =>
                      setYearGroupForm({ ...yearGroupForm, year: e.target.value })
                    }
                    placeholder={t('admin.year_placeholder')}
                    min="1900"
                    max="2100"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input
                    value={selectedYearGroup.year}
                    disabled
                    className="bg-muted"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="yearGroupPhotos">Year Group Photos ({yearGroupForm.existingPhotos.length + yearGroupForm.images.length}/10)</Label>
                {/* Existing Photos */}
                {yearGroupForm.existingPhotos.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-2">Current Photos:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {yearGroupForm.existingPhotos.map((photo, idx) => (
                        <div key={`existing-${idx}`} className="relative">
                          <img
                            src={photo}
                            alt={`Current ${idx + 1}`}
                            className="w-full aspect-square object-cover rounded-lg border"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-1 right-1"
                            onClick={() => {
                              const newExistingPhotos = yearGroupForm.existingPhotos.filter((_, i) => i !== idx);
                              setYearGroupForm({ ...yearGroupForm, existingPhotos: newExistingPhotos });
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* New Photos */}
                {yearGroupForm.images.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-2">New Photos:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {yearGroupForm.images.map((image, idx) => (
                        <div key={`new-${idx}`} className="relative">
                          <img
                            src={image}
                            alt={`New ${idx + 1}`}
                            className="w-full aspect-square object-cover rounded-lg border"
                            loading="lazy"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-1 right-1"
                            onClick={() => {
                              const newImages = yearGroupForm.images.filter((_, i) => i !== idx);
                              setYearGroupForm({ ...yearGroupForm, images: newImages });
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Processing indicator */}
                {isProcessingImages && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span className="text-sm text-blue-800">
                        Processing image {imageProcessingProgress.current} of {imageProcessingProgress.total}...
                      </span>
                    </div>
                    <div className="mt-2 h-2 bg-blue-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${(imageProcessingProgress.current / imageProcessingProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                {(yearGroupForm.existingPhotos.length + yearGroupForm.images.length) < 10 && !isProcessingImages && (
                  <>
                    <Input
                      id="yearGroupPhotos"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        const totalExisting = yearGroupForm.existingPhotos.length + yearGroupForm.images.length;
                        const remaining = 10 - totalExisting;
                        const newFiles = files.slice(0, remaining);
                        if (newFiles.length > 0) {
                          const processed = await processImagesWithProgress(newFiles);
                          setYearGroupForm({ ...yearGroupForm, images: [...yearGroupForm.images, ...processed] });
                        }
                        e.target.value = '';
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      {(yearGroupForm.existingPhotos.length + yearGroupForm.images.length) === 0
                        ? "Upload up to 10 photos. The first photo will be the main group photo."
                        : `Add ${10 - yearGroupForm.existingPhotos.length - yearGroupForm.images.length} more photo(s)`}
                    </p>
                  </>
                )}
                {(yearGroupForm.existingPhotos.length + yearGroupForm.images.length) >= 10 && (
                  <p className="text-xs text-amber-600">
                    Maximum 10 photos reached
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearInfo">Year Information</Label>
                <Textarea
                  id="yearInfo"
                  value={yearGroupForm.yearInfo}
                  onChange={(e) =>
                    setYearGroupForm({ ...yearGroupForm, yearInfo: e.target.value })
                  }
                  placeholder={t('admin.year_info_placeholder')}
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsappLink">WhatsApp Group Link</Label>
                <Input
                  id="whatsappLink"
                  value={yearGroupForm.whatsappLink}
                  onChange={(e) =>
                    setYearGroupForm({ ...yearGroupForm, whatsappLink: e.target.value })
                  }
                  placeholder={t('admin.whatsapp_link_placeholder')}
                />
                <p className="text-xs text-muted-foreground">
                  Only members of this year group will see this link
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                  setYearGroupDialogOpen(false);
                  setSelectedYearGroup(null);
                  setYearGroupForm({ year: "", yearInfo: "", whatsappLink: "", images: [], existingPhotos: [] });
                  }}
                  disabled={yearGroupMutation.isPending}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleSaveYearGroup}
                  disabled={yearGroupMutation.isPending || (!selectedYearGroup && !yearGroupForm.year)}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {yearGroupMutation.isPending
                    ? t('status.saving')
                    : selectedYearGroup
                      ? t('profile.save_changes')
                      : t('admin.create_year_group')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Memorial Edit Dialog */}
        <Dialog open={memorialDialogOpen} onOpenChange={setMemorialDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingMemorial ? t('admin.edit') + " " + t('admin.memorials') : t('memorial.create')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="memorialName">Name</Label>
                <Input
                  id="memorialName"
                  value={memorialForm.name}
                  onChange={(e) => setMemorialForm({ ...memorialForm, name: e.target.value })}
                  placeholder={t('admin.memorial_name_placeholder')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="memorialYear">Year Group</Label>
                  <Select
                    value={memorialForm.year}
                    onValueChange={(value) => setMemorialForm({ ...memorialForm, year: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('admin.select_year_group')} />
                    </SelectTrigger>
                    <SelectContent>
                      {yearGroups.map((yg: YearGroup) => (
                        <SelectItem key={yg.id} value={yg.year.toString()}>
                          Class of {yg.year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {yearGroups.length === 0 && (
                    <p className="text-xs text-muted-foreground">No year groups available. Create a year group first.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfPassing">Date of Passing</Label>
                  <Input
                    id="dateOfPassing"
                    type="date"
                    value={memorialForm.dateOfPassing}
                    onChange={(e) =>
                      setMemorialForm({ ...memorialForm, dateOfPassing: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="memorialPhoto">Upload Photo</Label>
                <Input
                  id="memorialPhoto"
                  type="file"
                  accept="image/*"
                  disabled={isProcessingImages}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const processed = await processImagesWithProgress([file]);
                      if (processed.length > 0) {
                        setMemorialForm({ ...memorialForm, photo: processed[0] });
                      }
                    }
                    e.target.value = '';
                  }}
                />
                {isProcessingImages && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing image...</span>
                  </div>
                )}
                {memorialForm.photo && !isProcessingImages && (
                  <div className="flex items-center gap-2">
                    <img src={memorialForm.photo} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setMemorialForm({ ...memorialForm, photo: null })}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageLinks">Link to More Images (Google Drive, WeTransfer, etc.)</Label>
                <Input
                  id="imageLinks"
                  value={memorialForm.imageLinks}
                  onChange={(e) => setMemorialForm({ ...memorialForm, imageLinks: e.target.value })}
                  placeholder={t('admin.memorial_images_link')}
                />
                <p className="text-xs text-muted-foreground">
                  Enter a link to Google Drive, WeTransfer, or similar where people can view more images
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="memorialTribute">Tribute</Label>
                <Textarea
                  id="memorialTribute"
                  value={memorialForm.tribute}
                  onChange={(e) => setMemorialForm({ ...memorialForm, tribute: e.target.value })}
                  placeholder={t('admin.memorial_tribute_placeholder')}
                  className="min-h-[150px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="funeralDate">Funeral Date</Label>
                <Input
                  id="funeralDate"
                  type="date"
                  value={memorialForm.funeralDate}
                  onChange={(e) => setMemorialForm({ ...memorialForm, funeralDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="funeralLocation">Funeral Location (Google Maps Link)</Label>
                <Input
                  id="funeralLocation"
                  value={memorialForm.funeralLocation}
                  onChange={(e) => setMemorialForm({ ...memorialForm, funeralLocation: e.target.value })}
                  placeholder="https://maps.google.com/..."
                />
                <p className="text-xs text-muted-foreground">
                  Paste a Google Maps link for accurate location mapping
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Number</Label>
                <Input
                  id="contactNumber"
                  value={memorialForm.contactNumber}
                  onChange={(e) => setMemorialForm({ ...memorialForm, contactNumber: e.target.value })}
                  placeholder={t('admin.memorial_contact_placeholder')}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setMemorialDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleSaveMemorial}
                  disabled={
                    !memorialForm.name ||
                    !memorialForm.year ||
                    !memorialForm.tribute ||
                    !memorialForm.dateOfPassing
                  }
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingMemorial ? t('common.save') : t('memorial.create')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Email Dialog */}
        <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('admin.send_bulk')}</DialogTitle>
              <DialogDescription>
                {t('admin.all_members')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="emailYearGroup">{t('admin.year_groups')}</Label>
                <Select
                  value={emailForm.yearGroup}
                  onValueChange={(value) => setEmailForm({ ...emailForm, yearGroup: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('admin.all_members')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('admin.all_members')}</SelectItem>
                    {yearGroups.map((group) => (
                      <SelectItem key={group.year} value={group.year.toString()}>
                        {t('profile.class_of', { year: group.year })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailSubject">{t('admin.subject')}</Label>
                <Input
                  id="emailSubject"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                  placeholder={t('admin.subject')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailMessage">{t('admin.message')}</Label>
                <Textarea
                  id="emailMessage"
                  value={emailForm.message}
                  onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                  placeholder={t('admin.message')}
                  className="min-h-[200px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleSendEmail}
                  disabled={!emailForm.subject || !emailForm.message}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {t('admin.send')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Year Group Posts Dialog */}
        <Dialog open={postsDialogOpen} onOpenChange={setPostsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('admin.posts')} - {t('profile.class_of', { year: selectedYearGroupForPosts?.year })}</DialogTitle>
              <DialogDescription>
                {t('admin.manage_network')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-center">
                <div>
                  {selectedYearGroupForPosts?.whatsappLink && (
                    <a
                      href={selectedYearGroupForPosts.whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700 flex items-center gap-1 text-sm"
                    >
                      <Phone className="w-4 h-4" />
                      {t('home.join_whatsapp')}
                    </a>
                  )}
                </div>
                <Button onClick={() => handleOpenPostEdit()}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('admin.posts')}
                </Button>
              </div>

              {isLoadingPosts ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t('status.loading')}</p>
                </div>
              ) : yearGroupPosts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No posts yet. Create one to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {yearGroupPosts.map((post) => (
                    <Card key={post.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-base mb-1">{post.title}</h3>
                            <p className="text-xs text-muted-foreground mb-3">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => handleOpenPostEdit(post)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                              onClick={() => handleDeletePost(post.id)}
                              disabled={deletePostMutation.isPending}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        {post.images && post.images.length > 0 && (
                          <div className="mb-3">
                            {post.images.length === 1 ? (
                              <img
                                src={post.images[0]}
                                alt={post.title}
                                className="w-full h-48 object-cover rounded-lg"
                              />
                            ) : (
                              <div className={`grid gap-2 ${post.images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                {post.images.slice(0, 3).map((img: string, idx: number) => (
                                  <img
                                    key={idx}
                                    src={img}
                                    alt={`${post.title} - ${idx + 1}`}
                                    className="w-full aspect-square object-cover rounded-lg"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                          {post.content}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Post Create/Edit Dialog */}
        <Dialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPost ? t('admin.edit') + " " + t('admin.posts') : t('admin.posts')}
              </DialogTitle>
              <DialogDescription>
                {t('admin.manage_network')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="postTitle">Title *</Label>
                <Input
                  id="postTitle"
                  value={postForm.title}
                  onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                  placeholder={t('admin.post_title_placeholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postContent">Content *</Label>
                <Textarea
                  id="postContent"
                  value={postForm.content}
                  onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                  placeholder={t('admin.post_content_placeholder')}
                  className="min-h-[200px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postImages">Images ({postForm.images.length}/3)</Label>
                {/* Processing indicator */}
                {isProcessingImages && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span className="text-sm text-blue-800">
                        Processing image {imageProcessingProgress.current} of {imageProcessingProgress.total}...
                      </span>
                    </div>
                  </div>
                )}
                {postForm.images.length < 3 && !isProcessingImages && (
                  <>
                    <Input
                      id="postImages"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        const remaining = 3 - postForm.images.length;
                        const newFiles = files.slice(0, remaining);
                        if (newFiles.length > 0) {
                          const processed = await processImagesWithProgress(newFiles);
                          setPostForm({ ...postForm, images: [...postForm.images, ...processed] });
                        }
                        e.target.value = '';
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      {postForm.images.length === 0
                        ? "Upload up to 3 images per post (Instagram-style display)"
                        : `Add ${3 - postForm.images.length} more image(s)`}
                    </p>
                  </>
                )}
                {postForm.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {postForm.images.map((image, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={image}
                          alt={`Preview ${idx + 1}`}
                          className="w-full aspect-square object-cover rounded-lg"
                          loading="lazy"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-1 right-1"
                          onClick={() => {
                            const newImages = postForm.images.filter((_, i) => i !== idx);
                            setPostForm({ ...postForm, images: newImages });
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {editingPost?.images && editingPost.images.length > 0 && (
                  <div className="mt-4">
                    <Label>Existing Images</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {editingPost.images.map((img: string, idx: number) => (
                        <div key={idx} className="relative">
                          <img
                            src={img}
                            alt={`Existing ${idx + 1}`}
                            className="w-full aspect-square object-cover rounded-lg"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setPostDialogOpen(false);
                  setEditingPost(null);
                  setPostForm({ title: "", content: "", images: [] });
                }}>
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleSavePost}
                  disabled={!postForm.title || !postForm.content || postMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingPost ? t('common.save') : t('admin.posts')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        {/* Password Reset Dialog */}
        <Dialog open={passwordResetDialog.open} onOpenChange={(open) => setPasswordResetDialog({ open, user: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('admin.reset_pass')}</DialogTitle>
              <DialogDescription>
                {t('admin.reset_pass')} - {passwordResetDialog.user?.name} ({passwordResetDialog.user?.email})
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('profile.new_password')}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder={t('profile.new_password_placeholder')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPasswordResetDialog({ open: false, user: null });
                    setNewPassword("");
                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleResetPassword}
                  disabled={!newPassword || newPassword.length < 6 || resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending ? t('status.loading') : t('admin.reset_pass')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Report Options Dialog */}
        <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('common.download')}</DialogTitle>
              <DialogDescription>
                {t('admin.manage_network')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Membership Status</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={reportOptions.filterType === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReportOptions((prev) => ({ ...prev, filterType: "all" }))}
                  >
                    All Users ({stats.totalUsers})
                  </Button>
                  <Button
                    type="button"
                    variant={reportOptions.filterType === "members" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReportOptions((prev) => ({ ...prev, filterType: "members" }))}
                  >
                    Members ({stats.totalMembers})
                  </Button>
                  <Button
                    type="button"
                    variant={reportOptions.filterType === "non-members" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReportOptions((prev) => ({ ...prev, filterType: "non-members" }))}
                  >
                    Non-Members ({stats.totalNonMembers})
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Year Group</Label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  <Button
                    type="button"
                    variant={reportOptions.year === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReportOptions((prev) => ({ ...prev, year: "all" }))}
                  >
                    All Years
                  </Button>
                  {uniqueYears.map((year) => (
                    <Button
                      key={year}
                      type="button"
                      variant={reportOptions.year === String(year) ? "default" : "outline"}
                      size="sm"
                      onClick={() => setReportOptions((prev) => ({ ...prev, year: String(year) }))}
                    >
                      {year}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReportDialogOpen(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="button" onClick={handleGenerateReport}>
                  <Download className="w-4 h-4 mr-2" />
                  {t('common.download')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </AdminLayout>
  );
};

export default Admin;
