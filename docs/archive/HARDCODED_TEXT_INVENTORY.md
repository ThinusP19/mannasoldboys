# Hardcoded English Text Inventory

This document lists all hardcoded English text found in the frontend that needs to be translated to Afrikaans using the i18n system.

## Navigation & Common UI

### DesktopSidebar.tsx
- "Profile" (TODO: Add profile.title to af.json)
- "In Memoriam" (TODO: Add nav.memorial to af.json)

### DesktopHeader.tsx
- "Class of {year}"

### MobileTopBar.tsx
- "Directory" (hardcoded title check)

## Authentication & Login (Login.tsx)

### Login Form
- "Welcome back! Sign in to your account"
- "Step 1: Create your account"
- "Step 2: Basic Profile Information"
- "Step 2: Add Your Photos"
- "Step 2: Connect Your Socials (Optional)"
- "Forgot Password: Enter Your Email"
- "Forgot Password: Answer Security Question"
- "Back to Login"
- "Email Address" (TODO: Add auth.email to af.json)
- "Password" (TODO: Add auth.password to af.json)
- "Signing in..."
- "Sign In"
- "Don't have an account? Sign up"
- "Already have an account? Sign in"
- "Forgot my details"

### Registration Form - Step 1
- "Email *" (TODO: Add auth.email to af.json)
- "Name *"
- "Surname *"
- "Password *" (TODO: Add auth.password to af.json)
- "Retype Password *"
- "Security Question *"
- "Security Answer *"
- "Mobile Number *"
- "South African format: 0631234567"
- "At least 8 characters"
- "One uppercase letter (A-Z)"
- "One lowercase letter (a-z)"
- "One number (0-9)"
- "One special character (!@#$% etc.)"
- "Passwords match"
- "Passwords do not match"
- "Continue to Membership Info"
- "Please fix all password requirements above to continue"

### Registration Form - Step 2a (Basic Info)
- "Graduation Year *" (using profile.matric_year)
- "Select your graduation year"
- "Bio * (Max 200 characters)" (using profile.bio)
- "Tell us about yourself..."
- "{count}/200 characters"
- "Contact Permission *" (using profile.permissions)
- "Visible to all alumni"
- "Visible to year group only"
- "Not visible"
- "Continue"
- "Loading..."

### Registration Form - Step 2b (Photos)
- "Then Photo (Matric Year) *" (using profile.then_now and profile.matric_year)
- "Upload Then Photo"
- "Now Photo (Current) *" (TODO: Add profile.nowPhoto to af.json)
- "Upload Now Photo"
- "Back"
- "Please upload your 'Then' photo (matric year photo)!"

### Registration Form - Step 2c (Social Links)
- "LinkedIn (Optional)"
- "Instagram (Optional)"
- "Facebook (Optional)"
- "https://linkedin.com/in/yourprofile"
- "https://instagram.com/yourprofile"
- "https://facebook.com/yourprofile"
- "Complete Registration"

### Forgot Password Dialog
- "Forgot My Details"
- "I have forgotten my details. Notify admin - they will send you a new password."
- "Cancel"
- "Submitting..."
- "Confirm"
- "Verifying..."
- "Verify Answer"
- "{count} attempt(s) remaining"
- "Incorrect answer. {count} attempt(s) remaining."

### App Download Sections
- "Download on the"
- "App Store"
- "Get it on"
- "Google Play"

## Profile Page (AlumniProfile.tsx)

- "Profile" (TODO: Add profile.title to af.json)
- "No name"
- "Not visible"
- "Visible to all"
- "Visible to year group only"
- "Not set"
- "Enter your security answer"
- "Missing information"
- "Now Photo" (TODO: Add profile.nowPhoto to af.json)

## Give Back Page (GiveBack.tsx)

- "Give Back to Your Alma Mater"
- "Become a member to access this page"
- "Join as a Member"
- "Minimum R75 per month"
- "What You Get:"
- "Access to Matric Year Photos"
- "View and download photos from your matric year"
- "Friends Contact Details"
- "Connect with classmates from your year"
- "Links to Matric Year Chat Groups"
- "Join WhatsApp and other chat groups"
- "Updates on Key Gimmie Events"
- "Stay informed about reunions and activities"
- "Gimmies Stories (Staaltjies)"
- "Read and share stories from your years at Gimmies"
- "Alumni Cap with Your Matric Year"
- "Included in Bronze or higher packages"
- "Become a Member"
- "Make a difference for future generations of Gimmies"
- "Loading projects..."
- "No projects available at the moment. Check back soon!"
- "Progress"
- "Banking Details"
- "Bank:"
- "Account:"
- "Account Holder:"
- "Branch Code:"
- "Reference:"
- "Copy"
- "Copied!"
- "Contribute"
- "Thank you!"
- "Your contribution has been recorded successfully."
- "Error"
- "Failed to record contribution. Please try again."
- "Invalid amount"
- "Please enter a valid contribution amount."

## Admin Panel (Admin.tsx)

### Dashboard
- "Dashboard Overview" (TODO: Add admin.overview to af.json)
- "Manage your alumni network"
- "Total Users"
- "Total Members"
- "Stories"
- "Memorials"
- "Reunions"
- "Year Groups"
- "Total Donations"
- "New registrations over the last 12 months"
- "Users by Year Group"
- "Distribution across graduation years (last 10 years)"
- "Quick Actions"
- "Manage Users"
- "Notifications"
- "Create Story"
- "Create Reunion"
- "Manage Projects"

### Users Tab
- "Users"
- "Manage user accounts and membership status"
- "R{amount}/month"
- "Loading users..."
- "No users found"
- "Name"
- "Email"
- "Year"
- "Role"
- "Member"
- "Monthly Amount"
- "Actions"
- "Edit"
- "Remove Membership"
- "Reset Password"
- "Are you sure you want to remove this user's membership?"

### Year Groups Tab
- "Year Groups"
- "Create and manage year groups"
- "Create Year Group"
- "Upload and edit year group photos and information"
- "Loading year groups..."
- "No year groups found. Create one to get started!"
- "Class of {year}"
- "Are you sure you want to delete the year group for {year}?"
- "Information about this year group..."

### Stories Tab
- "Stories"
- "Create and manage Gimmie stories"
- "Create Story"
- "Story title"
- "Story content..."
- "By {author} • {date}"

### Memorials Tab
- "Memorials"
- "Create and manage memorials"
- "Create Memorial"
- "Full name"
- "Graduation year"
- "Date of Passing"
- "Upload Photo"
- "Photo selected"
- "Link to More Images (Google Drive, WeTransfer, etc.)"
- "Enter a link to Google Drive, WeTransfer, or similar where people can view more images"
- "Tribute"
- "Tribute message..."
- "Funeral Date"
- "Funeral Location"
- "Funeral venue address"
- "Contact Number"
- "Contact number for funeral arrangements"

### Reunions Tab
- "Reunions"
- "Create and manage reunions"
- "Create Reunion"
- "Edit Reunion"
- "Reunion title"
- "Date"
- "Location (Address or Google Maps URL)"
- "You can enter an address or paste a Google Maps URL"
- "Description"
- "Reunion description..."
- "Target Year Groups (Select which year groups can see this reunion)"
- "Leave empty to show to all year groups"
- "No year groups available"
- "RSVP List ({count} {person/people})"
- "Coming: {count}"
- "Maybe: {count}"
- "Not Coming: {count}"
- "Loading RSVPs..."
- "No RSVPs yet"
- "Registered"

### Notifications Tab
- "Notifications"
- "View and manage all system notifications"
- "Mark All Read"
- "View All ({count})"
- "Loading notifications..."
- "No notifications yet"

### Pending Members Tab
- "Pending Members"
- "Members waiting for approval - Contact them via WhatsApp"
- "Pending Membership Requests"
- "Contact these members via WhatsApp to complete their membership"
- "Name"
- "Email"
- "Phone"
- "WhatsApp"
- "Plan"
- "Amount"
- "Requested Date"
- "Actions"
- "Reject" (TODO: Add admin.reject to af.json)
- "Approve Membership - {name}"
- "Minimum: ZAR 75 per month"
- "Enter monthly amount (ZAR)"
- "Confirm Approval"

### Bulk Email Dialog
- "Send Bulk Email"
- "Send an email to all members or a specific year group"
- "All members"
- "Email subject"
- "Email message"
- "Send Email"

### Posts Dialog
- "Posts - Class of {year}"
- "Create Post"
- "Loading posts..."
- "No posts yet. Create one to get started!"
- "Post title"
- "Post content..."

### Password Reset Dialog
- "Reset Password for {email}"
- "Enter new password (min 6 characters)"
- "Reset Password"

### Success/Error Messages
- "Success"
- "Error"
- "User membership updated successfully"
- "Failed to update membership"
- "Year group updated successfully"
- "Year group created successfully"
- "Failed to save year group"
- "Year group deleted successfully"
- "Failed to delete year group"
- "Post updated successfully"
- "Post created successfully"
- "Failed to save post"
- "Post deleted successfully"
- "Failed to delete post"
- "Story updated successfully"
- "Story created successfully"
- "Failed to save story"
- "Validation Error"
- "Memorial updated successfully"
- "Memorial created successfully"
- "Failed to save memorial"
- "Reunion updated successfully"
- "Reunion created successfully"
- "Failed to save reunion"
- "Notification deleted"
- "Invalid password"
- "Password reset successfully"
- "Failed to reset password"
- "Membership Approved"
- "The user has been granted membership access and will receive a notification."
- "Failed to approve membership"
- "Membership Rejected"
- "The user's membership request has been rejected."
- "Failed to reject membership"

## Other Components

### MembershipGate.tsx
- "Member Only"
- "Become a Member"
- "Request Membership"
- "Membership Required"
- "You need to be a member to access this content."
- "Membership Request Pending"
- "Your membership request is pending approval."
- "Membership Request Rejected"
- "Your membership request was rejected. Please contact support."
- "Membership Request Approved"
- "Your membership request was approved. Welcome!"

### ErrorBoundary.tsx
- "Something went wrong"
- "An unexpected error occurred. Please try refreshing the page."
- "Go to Login"
- "Refresh Page"

### Directory.tsx
- "Alumni Directory"
- "Type year (e.g., 2020)"
- "No results found"
- "Loading..."

### Stories.tsx
- "Stories"
- "Loading stories..."
- "No stories available"
- "Read More"

### Reunions.tsx
- "Reunions"
- "Loading reunions..."
- "No reunions available"
- "Register"
- "View Details"

### Memorial.tsx
- "In Memoriam"
- "Loading memorials..."
- "No memorials available"
- "View Tribute"

### Notifications.tsx
- "Notifications"
- "Mark all as read"
- "No new notifications"
- "View All"

### Settings.tsx
- "Settings"
- "Language"
- "Notifications"
- "Account"
- "Privacy"

### More.tsx
- "More"
- "About"
- "Terms of Service"
- "Privacy Policy"
- "Contact Us"
- "Logout"

### AdminLogin.tsx
- "Admin Login"
- "Email"
- "Password"
- "Sign In"
- "Invalid credentials"
- "Failed to login"

## Notes

1. All text marked with "TODO:" needs to be added to the `af.json` file
2. Some text includes variables (e.g., "{year}", "{count}") - these should be handled with i18n interpolation
3. Error messages and toast notifications should also be translated
4. Placeholder text in input fields needs translation
5. Button labels and action text need translation
6. Dialog titles and descriptions need translation
7. Table headers and column names need translation
8. Status badges and labels need translation

