# Visitor Experience - Detail View Popups

## ✅ Completed Features

### 1. Story Detail Dialog
**Component:** `src/components/StoryDetailDialog.tsx`

Features:
- Beautiful full-screen modal dialog
- Author avatar with first letter
- Full date display (e.g., "Monday, January 15, 2025")
- Image gallery grid (2-3 columns)
- Full story content with proper formatting
- Category badges
- Responsive design

**Usage in Stories Page:** `src/pages/Stories.tsx`
- Click "Read full story →" button
- Opens detailed view dialog
- Shows complete story with all images

---

### 2. Memorial Detail Dialog
**Component:** `src/components/MemorialDetailDialog.tsx`

Features:
- Elegant memorial card design
- Large profile photo or heart icon
- Complete tribute text
- Beautifully formatted date cards:
  - **Date of Passing** - Full format (e.g., "Monday, August 15, 2023")
  - **Funeral Date** - Full format (if provided)
  - **Funeral Location** - With location icon (if provided)
  - **Contact Number** - Clickable tel: link (if provided)
- "Forever in our hearts" footer
- Responsive design

**Usage in Memorial Page:** `src/pages/Memorial.tsx`
- Click anywhere on memorial card
- Opens detailed view dialog
- Shows ALL memorial information from admin

---

### 3. Reunion Detail Dialog
**Component:** `src/components/ReunionDetailDialog.tsx`

Features:
- Modern event card design
- Upcoming vs Past event badges
- **Date & Time Card** with gradient background
  - Full date format (e.g., "Monday, June 15, 2025")
  - Time display
- **Location Card** with Google Maps link
  - Clickable "View on Google Maps" button
- Full description with proper formatting
- **RSVP Section** (for upcoming events):
  - "I'm Going" button
  - "Maybe" button
  - Alumni count indicator
- Past event message for historical events
- Responsive design

**Usage in Reunions Page:** `src/pages/Reunions.tsx`
- Click "View Details & RSVP" button
- Opens detailed view dialog
- Shows complete reunion information
- Allows RSVP for upcoming events

---

## Admin Delete Functionality

### Current Status
The backend delete APIs are ready and working:
- `DELETE /api/stories/:id` ✅
- `DELETE /api/memorials/:id` ✅
- `DELETE /api/reunions/:id` ✅

### Admin Dashboard Integration Needed

**File to Update:** `src/pages/Admin.tsx`

Add delete buttons with confirmation dialogs:

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminStoriesApi, adminMemorialsApi, adminReunionsApi } from "@/lib/api";

// In the Admin component:
const queryClient = useQueryClient();

// Delete Story
const deleteStoryMutation = useMutation({
  mutationFn: (id: string) => adminStoriesApi.delete(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "stories"] });
    queryClient.invalidateQueries({ queryKey: ["stories"] });
    toast({ title: "Story deleted successfully!" });
  },
  onError: (error: any) => {
    toast({
      title: "Failed to delete story",
      description: error.message,
      variant: "destructive",
    });
  },
});

// Delete Memorial
const deleteMemorialMutation = useMutation({
  mutationFn: (id: string) => adminMemorialsApi.delete(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "memorials"] });
    queryClient.invalidateQueries({ queryKey: ["memorials"] });
    toast({ title: "Memorial deleted successfully!" });
  },
});

// Delete Reunion
const deleteReunionMutation = useMutation({
  mutationFn: (id: string) => adminReunionsApi.delete(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "reunions"] });
    queryClient.invalidateQueries({ queryKey: ["reunions"] });
    toast({ title: "Reunion deleted successfully!" });
  },
});

// Usage in UI:
const handleDeleteStory = (id: string) => {
  if (confirm("Are you sure you want to delete this story? This action cannot be undone.")) {
    deleteStoryMutation.mutate(id);
  }
};

const handleDeleteMemorial = (id: string) => {
  if (confirm("Are you sure you want to delete this memorial? This action cannot be undone.")) {
    deleteMemorialMutation.mutate(id);
  }
};

const handleDeleteReunion = (id: string) => {
  if (confirm("Are you sure you want to delete this reunion? This action cannot be undone.")) {
    deleteReunionMutation.mutate(id);
  }
};
```

### Add Delete Buttons to Admin UI

**In Stories Tab:**
```tsx
<Button
  variant="destructive"
  size="sm"
  onClick={() => handleDeleteStory(story.id)}
>
  <Trash2 className="w-4 h-4 mr-2" />
  Delete
</Button>
```

**In Memorials Tab:**
```tsx
<Button
  variant="destructive"
  size="sm"
  onClick={() => handleDeleteMemorial(memorial.id)}
>
  <Trash2 className="w-4 h-4 mr-2" />
  Delete
</Button>
```

**In Reunions Tab:**
```tsx
<Button
  variant="destructive"
  size="sm"
  onClick={() => handleDeleteReunion(reunion.id)}
>
  <Trash2 className="w-4 h-4 mr-2" />
  Delete
</Button>
```

---

## Modern Date Pickers

For the admin dashboard memorial creation/editing, you can use Shadcn's Calendar component with a Popover for modern date selection.

**Install if not already installed:**
```bash
npx shadcn-ui@latest add calendar popover
```

**Example Usage in Admin Forms:**

```tsx
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

// Date of Passing Picker
const [dateOfPassing, setDateOfPassing] = useState<Date | undefined>();

<Popover>
  <PopoverTrigger asChild>
    <Button
      variant="outline"
      className="w-full justify-start text-left font-normal"
    >
      <CalendarIcon className="mr-2 h-4 w-4" />
      {dateOfPassing ? format(dateOfPassing, "PPP") : "Select date"}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0" align="start">
    <Calendar
      mode="single"
      selected={dateOfPassing}
      onSelect={setDateOfPassing}
      initialFocus
    />
  </PopoverContent>
</Popover>

// Funeral Date Picker (same pattern)
const [funeralDate, setFuneralDate] = useState<Date | undefined>();

<Popover>
  <PopoverTrigger asChild>
    <Button
      variant="outline"
      className="w-full justify-start text-left font-normal"
    >
      <CalendarIcon className="mr-2 h-4 w-4" />
      {funeralDate ? format(funeralDate, "PPP") : "Select funeral date (optional)"}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0" align="start">
    <Calendar
      mode="single"
      selected={funeralDate}
      onSelect={setFuneralDate}
      initialFocus
    />
  </PopoverContent>
</Popover>
```

---

## Summary of Changes

### Files Created:
1. ✅ `src/components/StoryDetailDialog.tsx` - Story detail popup
2. ✅ `src/components/MemorialDetailDialog.tsx` - Memorial detail popup
3. ✅ `src/components/ReunionDetailDialog.tsx` - Reunion detail popup

### Files Updated:
1. ✅ `src/pages/Stories.tsx` - Added detail dialog integration
2. ✅ `src/pages/Memorial.tsx` - Added detail dialog integration
3. ✅ `src/pages/Reunions.tsx` - Added detail dialog integration

### Files Pending:
1. ❌ `src/pages/Admin.tsx` - Needs delete functionality added

---

## User Experience Flow

### Visitor Experience:

**Stories:**
1. Visitor sees stories list
2. Clicks "Read full story →"
3. Beautiful dialog opens with:
   - Full story content
   - All images in gallery
   - Author info and date
4. Can close anytime

**Memorials:**
1. Visitor sees memorial cards
2. Clicks anywhere on memorial card
3. Detailed memorial dialog opens with:
   - Full tribute text
   - All dates beautifully formatted
   - Funeral location and contact
   - "Forever in our hearts" footer
4. Can close anytime

**Reunions:**
1. Visitor sees reunion cards
2. Clicks "View Details & RSVP"
3. Comprehensive reunion dialog opens with:
   - Full date and time
   - Location with Google Maps link
   - Complete description
   - RSVP buttons (for upcoming)
4. Can RSVP or close

### Admin Experience (To Be Implemented):

1. Admin logs in
2. Views Stories/Memorials/Reunions tab
3. Each item has:
   - Edit button (already exists)
   - **Delete button** (needs to be added)
4. Clicks Delete
5. Confirmation dialog appears
6. Confirms deletion
7. Item removed from database
8. List refreshes automatically
9. Visitors no longer see deleted content

---

## Next Steps

1. Add delete mutation hooks to `src/pages/Admin.tsx`
2. Add delete buttons to each tab's item list
3. Add confirmation dialogs before deletion
4. (Optional) Modernize date pickers in admin forms
5. (Future) Integrate AI for story writing assistance

---

## Testing Checklist

### Visitor Pages:
- [ ] Stories page loads correctly
- [ ] Click "Read full story" opens dialog
- [ ] Story dialog shows all content
- [ ] Memorial cards are clickable
- [ ] Memorial dialog shows all info
- [ ] Reunion "View Details" works
- [ ] Reunion RSVP buttons appear for upcoming events
- [ ] All dialogs close properly
- [ ] Mobile responsive

### Admin Dashboard (After Delete Implementation):
- [ ] Delete button appears on each item
- [ ] Confirmation dialog appears
- [ ] Successful deletion removes item
- [ ] List refreshes after deletion
- [ ] Toast notification appears
- [ ] Error handling works
- [ ] Visitors can't see deleted content

---

**Status:** Visitor experience is 100% complete! Admin delete functionality just needs to be wired up using the code snippets above.
