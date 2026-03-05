import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { storiesApi, alumniApi, yearGroupsApi, yearGroupPostsApi, memorialsApi, reunionsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Search, User, BookOpen, Users, Calendar, Heart, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface InlineSearchProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelect?: (type: string, item: any) => void;
}

export const InlineSearch = ({ searchQuery, onSearchChange, onSelect }: InlineSearchProps) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch ALL data regardless of current page - search across everything
  const { data: stories = [] } = useQuery({
    queryKey: ["stories"],
    queryFn: () => storiesApi.getAll(),
    enabled: isOpen,
  });

  const { data: userData } = useQuery({
    queryKey: ["alumni", "me"],
    queryFn: async () => {
      try {
        return await alumniApi.getMe();
      } catch (error) {
        if (import.meta.env.DEV) console.error('InlineSearch: Error fetching user data:', error);
        return null;
      }
    },
    enabled: isOpen && !!user,
  });

  const currentUserYear = userData?.profile?.year;

  const { data: userYearGroup } = useQuery({
    queryKey: ["year-group", currentUserYear],
    queryFn: async () => {
      if (!currentUserYear) return null;
      try {
        return await yearGroupsApi.getByYear(currentUserYear);
      } catch (error) {
        if (import.meta.env.DEV) console.error('InlineSearch: Error fetching user year group:', error);
        return null;
      }
    },
    enabled: isOpen && !!currentUserYear,
  });

  const { data: yearGroupPosts = [] } = useQuery({
    queryKey: ["year-group-posts", userYearGroup?.id],
    queryFn: async () => {
      if (!userYearGroup?.id) return [];
      try {
        return await yearGroupPostsApi.getByYearGroup(userYearGroup.id);
      } catch (error) {
        if (import.meta.env.DEV) console.error('InlineSearch: Error fetching year group posts:', error);
        return [];
      }
    },
    enabled: isOpen && !!userYearGroup?.id,
  });

  // Fetch all year groups for directory search
  const { data: allYearGroups = [] } = useQuery({
    queryKey: ["all-year-groups"],
    queryFn: async () => {
      try {
        return await yearGroupsApi.getAll();
      } catch (error) {
        if (import.meta.env.DEV) console.error('InlineSearch: Error fetching all year groups:', error);
        return [];
      }
    },
    enabled: isOpen,
  });

  // Fetch members for all year groups (we'll search through all of them)
  // For now, fetch user's year group members and we can expand later
  const { data: yearGroupMembers } = useQuery({
    queryKey: ["year-group-members", currentUserYear],
    queryFn: async () => {
      if (!currentUserYear) return null;
      try {
        return await yearGroupsApi.getMembersByYear(currentUserYear);
      } catch (error) {
        if (import.meta.env.DEV) console.error('InlineSearch: Error fetching year group members:', error);
        return null;
      }
    },
    enabled: isOpen && !!currentUserYear,
  });

  // Fetch members for all year groups when searching
  // We'll fetch a few key year groups for search
  const { data: allYearGroupsWithMembers } = useQuery({
    queryKey: ["all-year-groups-members"],
    queryFn: async () => {
      if (!allYearGroups.length) return [];
      try {
        // Fetch members for top 10 most recent year groups for search
        const recentGroups = allYearGroups.slice(0, 10);
        const membersPromises = recentGroups.map(async (group: any) => {
          try {
            const members = await yearGroupsApi.getMembersByYear(group.year);
            return { year: group.year, members: members?.members || [] };
          } catch (error) {
            if (import.meta.env.DEV) console.error(`InlineSearch: Error fetching members for year ${group.year}:`, error);
            return { year: group.year, members: [] };
          }
        });
        return await Promise.all(membersPromises);
      } catch (error) {
        if (import.meta.env.DEV) console.error('InlineSearch: Error fetching all year groups with members:', error);
        return [];
      }
    },
    enabled: isOpen && allYearGroups.length > 0 && searchQuery.trim().length > 2,
  });

  const { data: memorials = [] } = useQuery({
    queryKey: ["memorials"],
    queryFn: () => memorialsApi.getAll(),
    enabled: isOpen,
  });

  const { data: reunions = [] } = useQuery({
    queryKey: ["reunions"],
    queryFn: () => reunionsApi.getAll(),
    enabled: isOpen,
  });

  // Filter and search all data - search across ALL pages
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

    // Search stories - available on all pages
    if (stories) {
      results.stories = stories.filter(
        (story: any) =>
          story.title?.toLowerCase().includes(query) ||
          story.content?.toLowerCase().includes(query) ||
          story.author?.toLowerCase().includes(query)
      );
    }

    // Search members - from user's year group and other year groups
    // Use a Map to deduplicate members by ID
    const membersMap = new Map<string, any>();
    if (yearGroupMembers?.members) {
      yearGroupMembers.members.forEach((member: any) => {
        if (member.id) membersMap.set(member.id, member);
      });
    }
    if (allYearGroupsWithMembers) {
      allYearGroupsWithMembers.forEach((groupData: any) => {
        if (groupData.members) {
          groupData.members.forEach((member: any) => {
            if (member.id) membersMap.set(member.id, member);
          });
        }
      });
    }
    results.members = Array.from(membersMap.values()).filter(
      (member: any) =>
        member.name?.toLowerCase().includes(query) ||
        member.email?.toLowerCase().includes(query) ||
        member.year?.toString().includes(query) ||
        member.bio?.toLowerCase().includes(query)
    );

    // Search year group posts - available on all pages
    if (yearGroupPosts) {
      results.posts = yearGroupPosts.filter(
        (post: any) =>
          post.title?.toLowerCase().includes(query) ||
          post.content?.toLowerCase().includes(query) ||
          post.author?.name?.toLowerCase().includes(query)
      );
    }

    // Search year groups - available on all pages
    if (allYearGroups) {
      results.yearGroups = allYearGroups.filter(
        (group: any) =>
          group.year?.toString().includes(query) ||
          group.yearInfo?.toLowerCase().includes(query)
      );
    }

    // Search memorials - available on all pages
    if (memorials) {
      results.memorials = memorials.filter(
        (memorial: any) =>
          memorial.name?.toLowerCase().includes(query) ||
          memorial.year?.toString().includes(query) ||
          memorial.tribute?.toLowerCase().includes(query)
      );
    }

    // Search reunions - available on all pages
    if (reunions) {
      results.reunions = reunions.filter(
        (reunion: any) =>
          reunion.title?.toLowerCase().includes(query) ||
          reunion.location?.toLowerCase().includes(query) ||
          reunion.description?.toLowerCase().includes(query)
      );
    }

    return results;
  }, [searchQuery, stories, yearGroupMembers, yearGroupPosts, allYearGroups, allYearGroupsWithMembers, memorials, reunions]);

  const totalResults =
    searchResults.stories.length +
    searchResults.members.length +
    searchResults.posts.length +
    searchResults.yearGroups.length +
    searchResults.memorials.length +
    searchResults.reunions.length;

  const handleSelect = (type: string, item: any) => {
    onSearchChange("");
    setIsOpen(false);
    
    if (onSelect) {
      onSelect(type, item);
      return;
    }

    // Navigate to the appropriate page with item identifier
    switch (type) {
      case "story":
        navigate(`/stories?story=${item.id}`);
        break;
      case "member":
        // Navigate to directory and set year filter to member's year
        navigate(`/directory?year=${item.year}&member=${item.id}`);
        break;
      case "post":
        navigate(`/?post=${item.id}`);
        break;
      case "yearGroup":
        // Navigate to directory with year parameter to open the year group dialog
        navigate(`/directory?year=${item.year}`);
        // Also dispatch event as backup
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('openYearGroup', { detail: { year: item.year, yearGroup: item } }));
        }, 300);
        break;
      case "memorial":
        navigate(`/memorial?memorial=${item.id}`);
        break;
      case "reunion":
        navigate(`/reunions?reunion=${item.id}`);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Open dropdown when typing
  useEffect(() => {
    if (searchQuery.trim()) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [searchQuery]);

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <div ref={searchRef} className="relative w-96">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
      <input
        ref={inputRef}
        type="text"
        placeholder={t('search.placeholder')}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onFocus={() => searchQuery.trim() && setIsOpen(true)}
        className="w-full pl-10 pr-20 h-12 bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      />
      {searchQuery && (
        <button
          onClick={() => {
            onSearchChange("");
            setIsOpen(false);
          }}
          className="absolute right-12 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
        <span className="text-xs">⌘</span>K
      </kbd>

      {/* Dropdown Results */}
      {isOpen && searchQuery.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {totalResults === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {t('search.no_results', { query: searchQuery })}
            </div>
          ) : (
            <div className="p-2">
              {searchResults.stories.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">{t('nav.stories')}</div>
                  {searchResults.stories.map((story: any, index: number) => (
                    <button
                      key={`story-${story.id}-${index}`}
                      onClick={() => handleSelect("story", story)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent text-left"
                    >
                      <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{story.title}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {story.content?.substring(0, 60)}...
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchResults.posts.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">{t('search.year_group_posts')}</div>
                  {searchResults.posts.map((post: any, index: number) => (
                    <button
                      key={`post-${post.id}-${index}`}
                      onClick={() => handleSelect("post", post)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent text-left"
                    >
                      <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{post.title}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {post.content?.substring(0, 60)}...
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchResults.members.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">{t('search.members')}</div>
                  {searchResults.members.map((member: any, index: number) => (
                    <button
                      key={`member-${member.id}-${index}`}
                      onClick={() => handleSelect("member", member)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent text-left"
                    >
                      <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{member.name}</div>
                        <div className="text-xs text-muted-foreground">{t('profile.class_of', { year: member.year })}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchResults.yearGroups.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">{t('search.year_groups')}</div>
                  {searchResults.yearGroups.map((group: any, index: number) => (
                    <button
                      key={`yearGroup-${group.id}-${index}`}
                      onClick={() => handleSelect("yearGroup", group)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent text-left"
                    >
                      <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{t('profile.class_of', { year: group.year })}</div>
                        {group.yearInfo && (
                          <div className="text-xs text-muted-foreground truncate">
                            {group.yearInfo.substring(0, 60)}...
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchResults.memorials.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">{t('nav.memorial')}</div>
                  {searchResults.memorials.map((memorial: any, index: number) => (
                    <button
                      key={`memorial-${memorial.id}-${index}`}
                      onClick={() => handleSelect("memorial", memorial)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent text-left"
                    >
                      <Heart className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{memorial.name}</div>
                        <div className="text-xs text-muted-foreground">{t('profile.class_of', { year: memorial.year })}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchResults.reunions.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">{t('nav.reunions')}</div>
                  {searchResults.reunions.map((reunion: any, index: number) => (
                    <button
                      key={`reunion-${reunion.id}-${index}`}
                      onClick={() => handleSelect("reunion", reunion)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent text-left"
                    >
                      <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{reunion.title}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {reunion.location} • {new Date(reunion.date).toLocaleDateString()}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

