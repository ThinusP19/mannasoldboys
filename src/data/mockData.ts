import { AlumniProfile, YearGroup, Story, Memorial, Reunion, Project } from "@/types/alumni";

export const mockAlumni: AlumniProfile[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    year: 2015,
    bio: "Software Engineer at Google. Passionate about AI and education technology.",
    linkedin: "https://linkedin.com",
    instagram: "https://instagram.com",
    email: "sarah@example.com",
    phone: "+27123456789",
    contactPermission: "all",
    verificationStatus: "verified",
  },
  {
    id: "2",
    name: "Michael Chen",
    year: 2015,
    bio: "Entrepreneur and founder of TechStart. Building the future of fintech.",
    linkedin: "https://linkedin.com",
    facebook: "https://facebook.com",
    phone: "+1234567890",
    contactPermission: "year-group",
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    year: 2016,
    bio: "Doctor at City Hospital. Specializing in pediatric care.",
    email: "emily@example.com",
    contactPermission: "all",
  },
  {
    id: "4",
    name: "David Kim",
    year: 2016,
    bio: "Marketing Director at BrandCo. Love connecting people and ideas.",
    linkedin: "https://linkedin.com",
    instagram: "https://instagram.com",
    contactPermission: "all",
  },
  {
    id: "5",
    name: "Jessica Taylor",
    year: 2017,
    bio: "Architect passionate about sustainable design and urban planning.",
    linkedin: "https://linkedin.com",
    contactPermission: "year-group",
  },
  {
    id: "6",
    name: "Ryan Patel",
    year: 2017,
    bio: "Professional photographer traveling the world capturing stories.",
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    contactPermission: "all",
  },
];

export const mockYearGroups: YearGroup[] = [
  {
    year: 2020,
    groupPhoto: "/placeholder.svg",
    yearInfo: "Class of 2020 - A year of resilience and determination.",
    members: [],
    whatsappLink: "https://chat.whatsapp.com/class-of-2020",
  },
  {
    year: 2021,
    groupPhoto: "/placeholder.svg",
    yearInfo: "Class of 2021 - Celebrating achievements and new beginnings.",
    members: [],
    whatsappLink: "https://chat.whatsapp.com/class-of-2021",
  },
  {
    year: 2022,
    groupPhoto: "/placeholder.svg",
    yearInfo: "Class of 2022 - A year of excellence and growth.",
    members: [],
    whatsappLink: "https://chat.whatsapp.com/class-of-2022",
  },
  {
    year: 2023,
    groupPhoto: "/placeholder.svg",
    yearInfo: "Class of 2023 - Building on tradition, creating the future.",
    members: [],
    whatsappLink: "https://chat.whatsapp.com/class-of-2023",
  },
  {
    year: 2024,
    groupPhoto: "/placeholder.svg",
    yearInfo: "Class of 2024 - New graduates ready to make their mark.",
    members: [],
    whatsappLink: "https://chat.whatsapp.com/class-of-2024",
  },
  {
    year: 2025,
    groupPhoto: "/placeholder.svg",
    yearInfo: "Class of 2025 - The latest generation of Monnas Old Boys.",
    members: [],
    whatsappLink: "https://chat.whatsapp.com/class-of-2025",
  },
];

export const mockStories: Story[] = [
  {
    id: "1",
    title: "Reunion Magic: Class of 2015",
    content: "What an incredible evening reuniting with old friends! The memories came flooding back...",
    author: "Sarah Johnson",
    images: [],
    date: "2024-03-15",
  },
  {
    id: "2",
    title: "From Classroom to Boardroom",
    content: "Reflecting on how our school years shaped our entrepreneurial journey...",
    author: "Michael Chen",
    images: [],
    date: "2024-03-10",
  },
];

export const mockMemorials: Memorial[] = [
  {
    id: "1",
    name: "James Wilson",
    year: 2014,
    tribute: "A brilliant mind and kind soul who touched everyone he met. Forever in our hearts.",
    dateOfPassing: "2023-08-15",
  },
];

export const mockReunions: Reunion[] = [
  {
    id: "1",
    title: "Class of 2015 - 10 Year Reunion",
    date: "2025-06-15",
    location: "School Campus, Main Hall",
    description: "Join us for a memorable evening of reconnection, dinner, and dancing!",
  },
  {
    id: "2",
    title: "All-Alumni Summer BBQ",
    date: "2025-08-20",
    location: "Central Park, Pavilion B",
    description: "Casual gathering for all alumni. Bring your family!",
  },
];

export const mockProjects: Project[] = [
  {
    id: "1",
    title: "New Science Lab Fund",
    description: "Help us build a state-of-the-art science laboratory for current students.",
    goal: 100000,
    raised: 67500,
  },
  {
    id: "2",
    title: "Scholarship Fund",
    description: "Support deserving students with educational opportunities.",
    goal: 50000,
    raised: 32000,
  },
];
