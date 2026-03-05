export interface AlumniProfile {
  id: string;
  name: string;
  year: number;
  bio: string;
  thenPhoto?: string;
  nowPhoto?: string;
  linkedin?: string;
  instagram?: string;
  facebook?: string;
  email?: string;
  phone?: string;
  contactPermission: "all" | "year-group" | "none";
  verificationStatus?: "pending" | "verified";
}

export interface YearGroup {
  year: number;
  groupPhoto?: string;
  members: AlumniProfile[];
  yearInfo?: string; // Additional year information
  whatsappLink?: string; // WhatsApp group link for this year
}

export interface Story {
  id: string;
  title: string;
  content: string;
  author: string;
  images: string[];
  date: string;
}

export interface Memorial {
  id: string;
  name: string;
  year: number;
  photo?: string;
  imageLink?: string; // Link to Google Drive, WeTransfer, etc. for more images
  tribute: string;
  dateOfPassing: string;
  funeralDate?: string;
  funeralLocation?: string;
  contactNumber?: string;
}

export interface Reunion {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  goal?: number;
  raised?: number;
}
