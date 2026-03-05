import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { storiesApi, alumniApi, yearGroupsApi, yearGroupPostsApi, memorialsApi, reunionsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Search, User, BookOpen, Users, Calendar, Heart, FileText } from "lucide-react";

interface SpotlightSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SpotlightSearch = ({ open, onOpenChange }: SpotlightSearchProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Determine current page
  const currentPage = location.pathname.split("/")[1] || "home";

  // Fetch data based on current page
  const { data: stories = [] } = useQuery({
    queryKey: ["stories"],
    queryFn: () => storiesApi.getAll(),
    enabled: open && (currentPage === "stories" || currentPage === "home"),
  });

  const { data: userData } = useQuery({
    queryKey: ["alumni", "me"],
    queryFn: async () => {
      try {
        return await alumniApi.getMe();
      } catch {
        return null;
      }
    },
    enabled: open && !!user,
  });

  const currentUserYear = userData?.profile?.year;

  // Fetch year group data for Index/Directory pages
  const { data: userYearGroup } = useQuery({
    queryKey: ["year-group", currentUserYear],
    queryFn: async () => {
      if (!currentUserYear) return null;
      try {
        return await yearGroupsApi.getByYear(currentUserYear);
      } catch {
        return null;
      }
    },
    enabled: open && !!currentUserYear && (currentPage === "home" || currentPage === "directory"),
  });

  const { data: yearGroupPosts = [] } = useQuery({
    queryKey: ["year-group-posts", userYearGroup?.id],
    queryFn: async () => {
      if (!userYearGroup?.id) return [];
      try {
        return await yearGroupPostsApi.getByYearGroup(userYearGroup.id);
      } catch {
        return [];
      }
    },
    enabled: open && !!userYearGroup?.id && currentPage === "home",
  });

  const { data: yearGroupMembers } = useQuery({
    queryKey: ["year-group-members", currentUserYear],
    queryFn: async () => {
      if (!currentUserYear) return null;
      try {
        return await yearGroupsApi.getMembersByYear(currentUserYear);
      } catch {
        return null;
      }
    },
    enabled: open && !!currentUserYear && (currentPage === "home" || currentPage === "directory"),
  });

  const { data: allYearGroups = [] } = useQuery({
    queryKey: ["all-year-groups"],
    queryFn: async () => {
      try {
        return await yearGroupsApi.getAll();
      } catch {
        return [];
      }
    },
    enabled: open && currentPage === "directory",
  });

  const { data: memorials = [] } = useQuery({
    queryKey: ["memorials"],
    queryFn: () => memorialsApi.getAll(),
    enabled: open && currentPage === "memorial",
  });

  const { data: reunions = [] } = useQuery({
    queryKey: ["reunions"],
    queryFn: () => reunionsApi.getAll(),
    enabled: open && currentPage === "reunions",
  });

  // Filter and search all data
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { stories: [], members: [], posts: [], yearGroups: [], memorials: [], reunions: [] };

    const query = searchQuery.toLowerCase();
    const results: {
      stories: any[];
      members: any[];
      posts: any[];
      yearGroups: any[];
      memorials: any[];
      reunions: any[];
    } = {
      stories: [],
      members: [],
      posts: [],
      yearGroups: [],
      memorials: [],
      reunions: [],
    };

    // Search stories
    if (stories && (currentPage === "stories" || currentPage === "home")) {
      results.stories = stories.filter(
        (story: any) =>
          story.title?.toLowerCase().includes(query) ||
          story.content?.toLowerCase().includes(query) ||
          story.author?.toLowerCase().includes(query)
      );
    }

    // Search year group members
    if (yearGroupMembers?.members && (currentPage === "home" || currentPage === "directory")) {
      results.members = yearGroupMembers.members.filter(
        (member: any) =>
          member.name?.toLowerCase().includes(query) ||
          member.email?.toLowerCase().includes(query) ||
          member.year?.toString().includes(query) ||
          member.bio?.toLowerCase().includes(query)
      );
    }

    // Search year group posts
    if (yearGroupPosts && currentPage === "home") {
      results.posts = yearGroupPosts.filter(
        (post: any) =>
          post.title?.toLowerCase().includes(query) ||
          post.content?.toLowerCase().includes(query) ||
          post.author?.name?.toLowerCase().includes(query)
      );
    }

    // Search year groups
    if (allYearGroups && currentPage === "directory") {
      results.yearGroups = allYearGroups.filter(
        (group: any) =>
          group.year?.toString().includes(query) ||
          group.yearInfo?.toLowerCase().includes(query)
      );
    }

    // Search memorials
    if (memorials && currentPage === "memorial") {
      results.memorials = memorials.filter(
        (memorial: any) =>
          memorial.name?.toLowerCase().includes(query) ||
          memorial.year?.toString().includes(query) ||
          memorial.tribute?.toLowerCase().includes(query)
      );
    }

    // Search reunions
    if (reunions && currentPage === "reunions") {
      results.reunions = reunions.filter(
        (reunion: any) =>
          reunion.title?.toLowerCase().includes(query) ||
          reunion.location?.toLowerCase().includes(query) ||
          reunion.description?.toLowerCase().includes(query)
      );
    }

    return results;
  }, [searchQuery, stories, yearGroupMembers, yearGroupPosts, allYearGroups, memorials, reunions, currentPage]);

  const totalResults =
    searchResults.stories.length +
    searchResults.members.length +
    searchResults.posts.length +
    searchResults.yearGroups.length +
    searchResults.memorials.length +
    searchResults.reunions.length;

  const handleSelect = (type: string, item: any) => {
    onOpenChange(false);
    setSearchQuery("");

    switch (type) {
      case "story":
        navigate(`/stories`);
        // Could scroll to story or open detail view
        break;
      case "member":
        // Could open member profile dialog
        navigate(`/directory`);
        break;
      case "post":
        navigate(`/`);
        // Could scroll to post
        break;
      case "yearGroup":
        navigate(`/directory`);
        break;
      case "memorial":
        navigate(`/memorial`);
        break;
      case "reunion":
        navigate(`/reunions`);
        break;
    }
  };

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder={`Search ${currentPage === "home" ? "posts, members, stories" : currentPage === "directory" ? "members, year groups" : currentPage === "stories" ? "stories" : currentPage === "memorial" ? "memorials" : currentPage === "reunions" ? "reunions" : "anything"}...`}
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>
          {searchQuery ? `No results found for "${searchQuery}"` : "Start typing to search..."}
        </CommandEmpty>

        {totalResults > 0 && (
          <>
            {searchResults.stories.length > 0 && (
              <CommandGroup heading="Stories">
                {searchResults.stories.map((story: any) => (
                  <CommandItem
                    key={story.id}
                    onSelect={() => handleSelect("story", story)}
                    className="flex items-center gap-3"
                  >
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">{story.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {story.content?.substring(0, 60)}...
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {searchResults.posts.length > 0 && (
              <CommandGroup heading="Year Group Posts">
                {searchResults.posts.map((post: any) => (
                  <CommandItem
                    key={post.id}
                    onSelect={() => handleSelect("post", post)}
                    className="flex items-center gap-3"
                  >
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">{post.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {post.content?.substring(0, 60)}...
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {searchResults.members.length > 0 && (
              <CommandGroup heading="Members">
                {searchResults.members.map((member: any) => (
                  <CommandItem
                    key={member.id}
                    onSelect={() => handleSelect("member", member)}
                    className="flex items-center gap-3"
                  >
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">{member.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Class of {member.year}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {searchResults.yearGroups.length > 0 && (
              <CommandGroup heading="Year Groups">
                {searchResults.yearGroups.map((group: any) => (
                  <CommandItem
                    key={group.id}
                    onSelect={() => handleSelect("yearGroup", group)}
                    className="flex items-center gap-3"
                  >
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">Class of {group.year}</div>
                      {group.yearInfo && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {group.yearInfo.substring(0, 60)}...
                        </div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {searchResults.memorials.length > 0 && (
              <CommandGroup heading="Memorials">
                {searchResults.memorials.map((memorial: any) => (
                  <CommandItem
                    key={memorial.id}
                    onSelect={() => handleSelect("memorial", memorial)}
                    className="flex items-center gap-3"
                  >
                    <Heart className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">{memorial.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Class of {memorial.year}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {searchResults.reunions.length > 0 && (
              <CommandGroup heading="Reunions">
                {searchResults.reunions.map((reunion: any) => (
                  <CommandItem
                    key={reunion.id}
                    onSelect={() => handleSelect("reunion", reunion)}
                    className="flex items-center gap-3"
                  >
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">{reunion.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {reunion.location} • {new Date(reunion.date).toLocaleDateString()}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
};

