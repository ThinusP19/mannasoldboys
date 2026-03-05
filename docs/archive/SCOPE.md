# Potchefstroom Gymnasium Alumni Connect - Complete Project Scope

## Overview
This platform serves as the official alumni network for Potchefstroom Gymnasium, connecting former students, facilitating reunions, and enabling giving back to the alma mater.

---

## User Types & Access Levels

### 1. **Non-Members (Public/Visitors)**
- Registered users who haven't paid for membership
- Limited access to platform features

### 2. **Members (Paid Subscription)**
- Alumni who pay monthly contributions
- Full access to member-only features
- Three tiers: Bronze (R75/month), Silver, Gold

### 3. **Admins**
- Full platform control
- Approve/reject membership requests
- Manage content (stories, memorials, reunions)
- Send bulk emails to year groups

### 4. **Teachers**
- NPO members with special access
- Can view member content

---

## Membership System Flow

### Step 1: User Registration
1. User creates account (email, password, basic info)
2. User becomes "Non-Member" by default
3. Can view limited content

### Step 2: Membership Request
1. User clicks **"Become a Member"** button
2. Fills out membership request form:
   - **Full Name** (Name + Surname)
   - **Email** (auto-filled from account)
   - **Phone Number**
   - **WhatsApp Number**
   - **Monthly Contribution Plan** (Dropdown):
     - Bronze - R75/month
     - Silver - R150/month
     - Gold - R250/month
   - **Requested Date** (auto-filled)
3. Submits form
4. Shows confirmation: "Thank you for your interest! An admin will contact you soon to finalize your membership."

### Step 3: Admin Approval
1. Admin sees request in **"Pending Members"** tab
2. Reviews member information:
   - Name, Email, Phone, WhatsApp
   - Requested plan
   - Date requested
3. Admin contacts member (via phone/WhatsApp)
4. Admin approves or rejects request
5. If approved:
   - User status changes to "Member"
   - User gains access to member-only features
   - User receives welcome email

---

## Feature Access Matrix

### Non-Members Can Access:
✅ **Alumni Vision and Mission** - About page
✅ **Upcoming Reunions** - View upcoming events (limited details)
✅ **Alumni Facebook Link** - Social media connection
✅ **Ways to Give Back:**
  - View current projects
  - Contribute financially to specific projects
  - Learn about investment options (% to Potch Gim NPO)
  - See testament beneficiary wording
✅ **Request Membership** - Become a member form

### Non-Members CANNOT Access:
❌ Matric year photos
❌ Friends' contact details
❌ Year group chat links
❌ Full Gimmie stories (alumni stories)
❌ Member directory
❌ In Memoriam section (member-contributed)
❌ Full reunion details

---

### Members Can Access (All Non-Member Features PLUS):
✅ **Matric Year Photos** - Full resolution group photos
✅ **Contact Details** - Based on permission settings
  - Can see contacts who allow "All alumni"
  - Can see contacts who allow "Same year only"
✅ **Year Group Chat Links** - WhatsApp group access
✅ **Gimmie Stories** - Full access to read and contribute stories
✅ **In Memoriam** - View and contribute to memorials
✅ **Full Reunion Details** - Complete event information
✅ **Alumni Cap** - Bronze tier or higher includes cap with matric year
✅ **Member Directory** - Grid view with filters
✅ **Profile Management:**
  - "Then" and "Now" photos
  - Bio, LinkedIn, Facebook, Instagram links
  - Contact permission settings
✅ **Key Gimmie Events & Updates**

### Member Benefits by Tier:

#### Bronze - R75/month
- All member features listed above
- Alumni cap with matric year
- Access to year photos and contacts
- Year group chat links

#### Silver - R150/month
- All Bronze benefits
- Priority event notifications
- Exclusive silver member badge
- (Future: Additional perks TBD)

#### Gold - R250/month
- All Silver benefits
- VIP event access
- Exclusive gold member badge
- (Future: Premium perks TBD)

---

### Admins Can Access (All Member Features PLUS):
✅ **Admin Dashboard** - `/admin`
✅ **Pending Members Management:**
  - View all membership requests
  - Approve/Reject requests
  - Contact members
  - Track request dates
✅ **Content Management:**
  - Create/Edit/Delete Stories
  - Create/Edit/Delete Memorials
  - Create/Edit/Delete Reunions
✅ **User Management:**
  - View all users
  - Change user roles
  - Verify alumni accounts
  - Manage member subscriptions
✅ **Bulk Email:**
  - Send emails to specific year groups
  - Send emails to all members
  - Email templates
✅ **Analytics Dashboard:**
  - Member statistics
  - Monthly revenue tracking
  - Event attendance
  - Engagement metrics

---

## Page Structure

### Public Pages (Anyone Can View)
1. **Landing Page** - `/`
   - Hero section
   - Vision & Mission
   - Call to action: Register or Become Member

2. **Login** - `/login`
3. **Register** - `/register`
4. **Vision & Mission** - `/about`
5. **Ways to Give Back** - `/give-back`
   - Current projects
   - Financial contribution options
   - Investment options
   - Testament beneficiary information

### Non-Member Pages (Registered Users)
1. **Upcoming Reunions** - `/reunions` (limited view)
2. **Alumni Facebook** - External link
3. **Become a Member** - `/membership/request`
   - Membership request form
   - Benefits explanation
   - Pricing tiers

### Member-Only Pages (Paid Subscribers)
1. **Member Directory** - `/directory`
   - Grid layout with year filter dropdown
   - Each card shows:
     - Matric group photo
     - Name, Year, Bio preview
     - Click to view full profile

2. **Alumni Profile** - `/alumni/:id`
   - Side-by-side layout:
     - "Then" photo (matric year)
     - "Now" photo (current)
   - Full bio
   - Social media links (LinkedIn, Facebook, Instagram)
   - Contact details (based on permission)
   - Contact permission button:
     - "All Alumni" - Anyone can see
     - "Same Year Only" - Only classmates
     - "Private" - Nobody can see

3. **Gimmie Stories** - `/stories` (full access)
   - Read all alumni stories
   - Contribute your own stories
   - Upload photos with stories
   - Filter by year or category

4. **In Memoriam** - `/memorial` (member-contributed)
   - View tributes
   - Contribute memorial entries
   - Update existing memorials

5. **Year Groups** - `/year-groups`
   - View your year group
   - Access WhatsApp group link
   - See matric year photo
   - Year-specific information

6. **Full Reunion Details** - `/reunions/:id`
   - Complete event details
   - RSVP functionality
   - Attendee list
   - Event photos

### Admin Pages
1. **Admin Login** - `/admin/login`
2. **Admin Dashboard** - `/admin`
   - **Overview Tab:**
     - Member statistics
     - Revenue metrics
     - Recent activity
   - **Pending Members Tab:**
     - List of membership requests
     - Approve/Reject actions
     - Contact information
     - Requested tier and date
   - **Users Tab:**
     - All registered users
     - Member/Non-member status
     - Role management
   - **Stories Tab:**
     - Create/Edit/Delete stories
     - Moderate user-contributed stories
   - **Memorials Tab:**
     - Create/Edit/Delete memorials
     - Moderate user-contributed memorials
   - **Reunions Tab:**
     - Create/Edit/Delete reunions
     - Manage RSVPs
     - Event attendance tracking
   - **Year Groups Tab:**
     - Manage year group info
     - Upload matric photos
     - Manage WhatsApp links
   - **Bulk Email Tab:**
     - Select year group
     - Compose email
     - Send to all members or specific years

---

## Database Schema Updates Needed

### Users Table (Existing - Needs Updates)
```sql
- id
- email
- password
- name
- role (alumni/admin/teacher)
- isMember (boolean) -- NEW
- membershipTier (bronze/silver/gold) -- NEW
- membershipStatus (pending/active/expired/cancelled) -- NEW
- membershipStartDate -- NEW
- monthlyContribution (75/150/250) -- NEW
- createdAt
- updatedAt
```

### MembershipRequests Table (NEW)
```sql
- id
- userId (FK)
- fullName
- email
- phone
- whatsapp
- requestedPlan (bronze/silver/gold)
- monthlyAmount (75/150/250)
- status (pending/approved/rejected)
- requestedDate
- approvedDate
- approvedBy (admin userId)
- rejectionReason
- createdAt
- updatedAt
```

### Profiles Table (Existing - Needs Updates)
```sql
- id
- userId (FK)
- year (matric year)
- bio
- photoThen (matric year photo) -- NEW
- photoNow (current photo) -- RENAME from 'photo'
- linkedin
- facebook
- instagram
- email
- phone
- contactPermission (all/year-group/private)
- verificationStatus
- createdAt
- updatedAt
```

### YearGroups Table (Existing - Needs Updates)
```sql
- year (PK)
- groupPhoto
- yearInfo
- whatsappLink
- memberCount -- NEW
- createdAt
- updatedAt
```

---

## API Endpoints Needed

### Membership Requests
```
POST   /api/membership/request          - Submit membership request
GET    /api/membership/requests         - Get all pending (admin only)
PATCH  /api/membership/requests/:id     - Approve/Reject (admin only)
DELETE /api/membership/requests/:id     - Delete request (admin only)
```

### Member Management
```
GET    /api/members                     - Get all members (admin)
GET    /api/members/:id                 - Get member details
PATCH  /api/members/:id/tier            - Update membership tier (admin)
PATCH  /api/members/:id/status          - Update membership status (admin)
```

### Year Groups (Enhanced)
```
GET    /api/year-groups                 - Get all year groups
GET    /api/year-groups/:year           - Get specific year
PATCH  /api/year-groups/:year           - Update year info (admin)
POST   /api/year-groups/:year/photo     - Upload matric photo (admin)
```

### Bulk Email
```
POST   /api/admin/bulk-email            - Send email to year/all (admin)
GET    /api/admin/bulk-email/templates  - Get email templates (admin)
```

---

## UI/UX Components Needed

### 1. Membership Request Form
**Location:** New page `/membership/request`
**Components:**
- Form with fields:
  - Name (text input)
  - Surname (text input)
  - Phone Number (tel input with SA validation)
  - WhatsApp Number (tel input)
  - Monthly Plan (dropdown: Bronze R75, Silver R150, Gold R250)
- Benefits display for each tier
- Submit button
- Success message modal

### 2. Admin Pending Members Table
**Location:** Admin Dashboard - Pending Members Tab
**Components:**
- Sortable table with columns:
  - Name
  - Email
  - Phone
  - WhatsApp
  - Plan
  - Requested Date
  - Actions (Approve/Reject/Contact)
- Filter by plan
- Search functionality
- Approve/Reject confirmation dialogs

### 3. Member Badge
**Location:** User profiles, directory listings
**Components:**
- Bronze/Silver/Gold badge icon
- Tier-specific colors
- Hover tooltip showing benefits

### 4. Contact Permission Toggle
**Location:** User profile edit
**Components:**
- Radio buttons:
  - All Alumni
  - Same Year Only
  - Private
- Visual explanation of each option

### 5. "Become a Member" CTA
**Location:** Multiple pages (for non-members)
**Components:**
- Prominent button
- Benefits preview
- Pricing display
- Redirect to request form

---

## Implementation Priority

### Phase 1: Membership System (NEXT)
1. ✅ Create MembershipRequests database table
2. ✅ Create membership request API endpoints
3. ✅ Build membership request form UI
4. ✅ Add "Become a Member" button throughout app
5. ✅ Create Admin Pending Members tab
6. ✅ Implement approve/reject functionality
7. ✅ Add email notifications

### Phase 2: Member-Only Features
1. Add isMember checks to routes
2. Implement member-only page access
3. Create member directory with filters
4. Add "Then & Now" photo upload
5. Implement contact permission system
6. Show/hide content based on membership

### Phase 3: Tier-Specific Features
1. Add membership tier badges
2. Implement tier-based benefits
3. Create tier upgrade flow
4. Add tier analytics to admin dashboard

### Phase 4: Bulk Email System
1. Create email templates
2. Build year group selector
3. Implement email sending
4. Add email history tracking

### Phase 5: Analytics & Reporting
1. Member growth charts
2. Revenue tracking
3. Engagement metrics
4. Export capabilities

---

## Monetization Flow

### Payment Collection (Future Integration)
**Options:**
1. **Manual (Current Phase):**
   - Admin approves request
   - Admin contacts member
   - Member makes payment via EFT/bank transfer
   - Admin manually activates membership

2. **Automated (Future):**
   - Integrate payment gateway (PayFast, Stripe)
   - Automatic recurring billing
   - Auto-activation on successful payment
   - Auto-deactivation on failed payment

---

## Success Metrics

### Member Acquisition
- Target: 100 members in first 3 months
- Target: 500 members in first year
- Conversion rate: 20% of registered users become members

### Revenue Targets
- Month 1: R7,500 (100 Bronze members)
- Month 6: R37,500 (300 Bronze, 100 Silver, 50 Gold)
- Month 12: R75,000+ (sustained growth)

### Engagement Metrics
- Story contributions: 10+ per month
- Event RSVPs: 80% for reunions
- Profile completeness: 70% of members
- Directory usage: 60% monthly active

---

## Technical Stack Summary

### Frontend
- React + TypeScript
- TanStack React Query
- Tailwind CSS + Shadcn UI
- Vite

### Backend
- Node.js + Express
- PostgreSQL/MySQL (Sequelize ORM)
- JWT Authentication
- Zod Validation

### Deployment
- Frontend: Vercel/Netlify
- Backend: Render/Railway
- Database: Hosted PostgreSQL

---

## Security & Privacy

### Member Data Protection
- Contact details only visible based on permission
- HTTPS enforced
- Password hashing (bcrypt)
- JWT token expiration
- Rate limiting on sensitive endpoints

### Payment Security (Future)
- PCI DSS compliance
- Secure payment gateway
- No credit card storage on server

---

## Next Steps (Immediate)

1. **Create MembershipRequests Model** - `server/src/models/MembershipRequest.ts`
2. **Create Membership API Routes** - `server/src/routes/membership.ts`
3. **Build Membership Request Form** - `src/pages/MembershipRequest.tsx`
4. **Add Pending Members Tab to Admin** - Update `src/pages/Admin.tsx`
5. **Update User Model** - Add membership fields
6. **Create Member Middleware** - Check membership status
7. **Add Member-Only Route Guards** - Protect member pages

---

**Status:** Scope defined. Ready to implement membership system step-by-step.

**Last Updated:** December 12, 2025
