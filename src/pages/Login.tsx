import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { authApi, alumniApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Check, Upload, ArrowLeft, X, Eye, EyeOff } from "lucide-react";

const Login = () => {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(0); // 0 = email, 1 = security question
  const [showForgotDetails, setShowForgotDetails] = useState(false);
  const [forgotDetailsEmail, setForgotDetailsEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { login, register: registerUser, logout } = useAuth();
  const { toast } = useToast();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    surname: "",
    securityQuestion: "",
    securityAnswer: "",
    mobile: "", // Mobile number (used for phone in profile)
    year: "",
    bio: "",
    linkedin: "",
    instagram: "",
    facebook: "",
    contactPermission: "all" as "all" | "year-group" | "none",
    thenPhoto: null as File | null,
    nowPhoto: null as File | null,
  });

  // Forgot password data
  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: "",
    securityAnswer: "",
  });

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

  const handleInputChange = (field: string, value: string | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (field === "password" || field === "confirmPassword") {
      setError("");
    }
  };

  // Password validation function
  const validatePassword = (password: string) => {
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

    return {
      isValid: hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar,
      hasMinLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar,
    };
  };

  // Check if step 0 can proceed
  const canProceedStep0 = () => {
    if (!formData.email || !formData.email.includes("@")) return false;
    if (!formData.name || formData.name.trim().length === 0) return false;
    if (!formData.surname || formData.surname.trim().length === 0) return false;
    if (!formData.password) return false;
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) return false;
    if (formData.password !== formData.confirmPassword) return false;
    if (!formData.mobile || formData.mobile.trim().length === 0) return false;
    const mobileRegex = /^0[0-9]{9}$/;
    const cleanMobile = formData.mobile.replace(/\s+/g, "");
    if (!mobileRegex.test(cleanMobile)) return false;
    return true;
  };

  // Reset form data function
  const resetFormData = () => {
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      surname: "",
      securityQuestion: "",
      securityAnswer: "",
      mobile: "",
      year: "",
      bio: "",
      linkedin: "",
      instagram: "",
      facebook: "",
      contactPermission: "all",
      thenPhoto: null,
      nowPhoto: null,
    });
  };

  // Reset to login form when component mounts (e.g., after logout)
  // Only run once on initial mount
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      setIsLogin(true);
      setOnboardingStep(0);
      resetFormData();
    }
  }, []);

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (forgotPasswordStep === 0) {
      // Enter email and send reset link
      if (!forgotPasswordData.email) {
        setError("Please enter your email address!");
        return;
      }

      try {
        setLoading(true);
        setError("");
        // Try to send password reset email
        await authApi.requestPasswordReset(forgotPasswordData.email);
      } catch (err: any) {
        // Even if email not found, show success for security (don't reveal if email exists)
      } finally {
        setLoading(false);
        // Always show success step
        setForgotPasswordStep(1);
      }
    }
  };

  const handleForgotDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotDetailsEmail) {
      setError("Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await authApi.forgotDetails(forgotDetailsEmail);
      toast({
        title: "Request submitted successfully!",
        description: response.message || "Your request has been sent to the administrators. They will contact you with a new password soon.",
        duration: 5000,
      });
      setShowForgotDetails(false);
      setForgotDetailsEmail("");
      } catch (err: any) {
        const errorMsg = err?.error || err?.details || "We couldn't submit your request. Please check your email address and try again.";
        if (err?.error === "User not found" || err?.error?.includes("not found")) {
          setError("No account found with this email address. Please check your email and try again.");
        } else {
          setError(errorMsg);
        }
      } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        // Validate required fields
        if (!formData.email || !formData.email.includes("@")) {
          setError("Please enter a valid email address!");
          setLoading(false);
          return;
        }
        if (!formData.password) {
          setError("Please enter your password!");
          setLoading(false);
          return;
        }

        // Login - authenticate with real backend credentials only
        try {
          const loginResponse = await login(formData.email, formData.password);

          // Check if user is an admin - admins must use admin login page
          if (loginResponse?.user?.role === "admin") {
            // Clear regular auth and redirect to admin login
            logout();
            setError("Admin users must login through the Admin Login page.");
            setLoading(false);
            setTimeout(() => {
              navigate("/admin/login");
            }, 2000);
            return;
          }

          sessionStorage.setItem("showPreloader", "true");
          // Navigate immediately
          navigate("/profile");
        } catch (loginError: any) {
          // Handle login errors from backend
          const errorMessage = loginError?.error || loginError?.details || "Login failed. Please check your credentials and try again.";
          setError(errorMessage);
          setLoading(false);
          return;
        }
      } else {
        // Register - handle steps
        if (onboardingStep === 0) {
          // Step 1: Validate password match and required fields
          if (!formData.email || !formData.email.includes("@")) {
            setError("Please enter a valid email address!");
            setLoading(false);
            return;
          }
          if (!formData.name || formData.name.trim().length === 0) {
            setError("Please enter your name!");
            setLoading(false);
            return;
          }
          if (!formData.surname || formData.surname.trim().length === 0) {
            setError("Please enter your surname!");
            setLoading(false);
            return;
          }
          if (!formData.password || formData.password.length < 8) {
            setError("Password must be at least 8 characters long!");
            setLoading(false);
            return;
          }
          // Validate password requirements
          const hasUpperCase = /[A-Z]/.test(formData.password);
          const hasLowerCase = /[a-z]/.test(formData.password);
          const hasNumber = /[0-9]/.test(formData.password);
          const hasSpecialChar = /[^A-Za-z0-9]/.test(formData.password);

          if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
            const missing = [];
            if (!hasUpperCase) missing.push("uppercase letter");
            if (!hasLowerCase) missing.push("lowercase letter");
            if (!hasNumber) missing.push("number");
            if (!hasSpecialChar) missing.push("special character");
            setError(`Password missing: ${missing.join(", ")}`);
            setLoading(false);
            return;
          }
          if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match!");
            setLoading(false);
            return;
          }
          // Validate South African mobile number (063... or 083... etc)
          if (!formData.mobile || formData.mobile.trim().length === 0) {
            setError("Please enter your mobile number!");
            setLoading(false);
            return;
          }
          // Validate SA mobile format (should start with 0 and be 10 digits)
          const mobileRegex = /^0[0-9]{9}$/;
          const cleanMobile = formData.mobile.replace(/\s+/g, "");
          if (!mobileRegex.test(cleanMobile)) {
            setError("Please enter a valid South African mobile number (e.g., 0631234567)!");
            setLoading(false);
            return;
          }
          // Store cleaned mobile number
          formData.mobile = cleanMobile;
          setOnboardingStep(1);
          setLoading(false);
        } else if (onboardingStep === 1) {
          // Step 2a: Basic profile info - validate and continue
          if (!formData.year || parseInt(formData.year) < 1950 || parseInt(formData.year) > new Date().getFullYear()) {
            setError("Please enter a valid graduation year!");
            setLoading(false);
            return;
          }
          if (!formData.bio || formData.bio.trim().length === 0) {
            setError("Please enter your bio!");
            setLoading(false);
            return;
          }
          // Validate bio length
          if (formData.bio.length > 200) {
            setError("Bio must be 200 characters or less!");
            setLoading(false);
            return;
          }
          if (formData.bio.trim().length < 10) {
            setError("Bio must be at least 10 characters long!");
            setLoading(false);
            return;
          }
          setOnboardingStep(2);
          setLoading(false);
        } else if (onboardingStep === 2) {
          // Step 2b: Photos - validate and continue
          if (!formData.thenPhoto) {
            setError("Please upload your 'Then' photo (matric year photo)!");
            setLoading(false);
            return;
          }
          if (!formData.nowPhoto) {
            setError("Please upload your 'Now' photo (current photo)!");
            setLoading(false);
            return;
          }
          // Validate file types
          const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
          if (!validImageTypes.includes(formData.thenPhoto.type)) {
            setError("'Then' photo must be a valid image file (JPEG, PNG, or WebP)!");
            setLoading(false);
            return;
          }
          if (!validImageTypes.includes(formData.nowPhoto.type)) {
            setError("'Now' photo must be a valid image file (JPEG, PNG, or WebP)!");
            setLoading(false);
            return;
          }
          setOnboardingStep(3);
          setLoading(false);
        } else if (onboardingStep === 3) {
          // Step 2c: Social links (optional) - complete registration
          const fullName = `${formData.name} ${formData.surname}`;

          try {
            // Register user first
          await registerUser(formData.email, formData.password, fullName);

            // Check if we have a token (registration succeeded)
            const token = localStorage.getItem("authToken");
            if (!token) {
              setError("Registration succeeded but authentication token not found. Please try logging in.");
              setLoading(false);
              return;
            }

            // After registration, update profile with all collected data
            // Convert images to base64 for database storage
            let thenPhotoBase64: string | null = null;
            let nowPhotoBase64: string | null = null;

            if (formData.thenPhoto) {
              try {
                thenPhotoBase64 = await fileToBase64(formData.thenPhoto);
              } catch (error) {
                console.error("Error converting thenPhoto to base64:", error);
                throw new Error("Failed to process 'Then' photo. Please try again.");
              }
            }

            if (formData.nowPhoto) {
              try {
                nowPhotoBase64 = await fileToBase64(formData.nowPhoto);
              } catch (error) {
                console.error("Error converting nowPhoto to base64:", error);
                throw new Error("Failed to process 'Now' photo. Please try again.");
              }
            }

            // Prepare profile data with base64 images
            const profileData = {
              name: fullName,
              year: parseInt(formData.year),
              bio: formData.bio,
              phone: formData.mobile, // Use mobile number from step 0
              email: formData.email,
              contactPermission: formData.contactPermission,
              linkedin: formData.linkedin || null,
              instagram: formData.instagram || null,
              facebook: formData.facebook || null,
              thenPhoto: thenPhotoBase64,
              nowPhoto: nowPhotoBase64,
            };

            // Update profile via API (profile was auto-created during registration)
            await alumniApi.createOrUpdateProfile(profileData);

            // Profile created successfully
          sessionStorage.setItem("showPreloader", "true");
          navigate("/profile");
          } catch (regError: any) {
            console.error("Registration/Profile creation error:", regError);

            // Format error message - check all possible error locations
            let errorMessage = "Registration failed. Please try again.";
            let validationErrors: any[] = [];

            // Check error field first (most common location for validation errors)
            if (regError?.error) {
              if (Array.isArray(regError.error)) {
                validationErrors = regError.error;
              } else if (typeof regError.error === 'string') {
                errorMessage = regError.error;
              }
            }

            // Check details field
            if (regError?.details) {
              if (Array.isArray(regError.details)) {
                validationErrors = regError.details;
              } else if (typeof regError.details === 'object') {
                if (Array.isArray(regError.details.error)) {
                  validationErrors = regError.details.error;
                } else if (regError.details.error && Array.isArray(regError.details.error)) {
                  validationErrors = regError.details.error;
                }
              }
            }

            // Format validation errors into readable messages
            if (validationErrors.length > 0) {
              // Separate password errors from other errors
              const passwordErrors = validationErrors.filter((e: any) =>
                e.path?.includes('password') || (Array.isArray(e.path) && e.path[0] === 'password')
              );
              const otherErrors = validationErrors.filter((e: any) =>
                !e.path?.includes('password') && (!Array.isArray(e.path) || e.path[0] !== 'password')
              );

              if (passwordErrors.length > 0) {
                // Format password errors nicely
                errorMessage = "Password requirements:\n" + passwordErrors.map((e: any) => `• ${e.message || 'Invalid password'}`).join("\n");
              } else if (otherErrors.length > 0) {
                // Format other validation errors
                const errorMessages = otherErrors.map((e: any) => {
                  if (typeof e === 'string') return e;
                  const field = Array.isArray(e.path) ? e.path.join('.') : e.path || 'field';
                  const message = e.message || 'invalid';
                  return `${field}: ${message}`;
                });
                errorMessage = errorMessages.join(". ");
              } else {
                // Fallback: format all errors
                const errorMessages = validationErrors.map((e: any) => {
                  if (typeof e === 'string') return e;
                  const field = Array.isArray(e.path) ? e.path.join('.') : e.path || 'field';
                  const message = e.message || 'invalid';
                  return `${field}: ${message}`;
                });
                errorMessage = errorMessages.join(". ");
              }
            }

            // Check message field as fallback
            if (errorMessage === "Registration failed. Please try again." && regError?.message) {
              errorMessage = regError.message;
            }

            // Simplify common error messages
            if (errorMessage.includes("User already exists") || errorMessage.includes("already exists")) {
              errorMessage = "An account with this email already exists. Please login instead.";
            } else if (errorMessage.includes("Invalid email") || (errorMessage.includes("email") && errorMessage.includes("Invalid"))) {
              errorMessage = "Please enter a valid email address.";
            }

            setError(errorMessage);
            setLoading(false);
          }
        }
      }
    } catch (err: any) {
      // Provide user-friendly error messages
      let errorMessage = "An error occurred. Please try again.";

      if (err?.error) {
        if (typeof err.error === 'string') {
          errorMessage = err.error;
        } else if (Array.isArray(err.error)) {
          // Handle validation errors
          errorMessage = err.error.map((e: any) => e.message).join(", ");
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }

      // Specific error messages for common cases
      if (errorMessage.includes("Invalid credentials") || errorMessage.includes("401")) {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (errorMessage.includes("User already exists")) {
        errorMessage = "An account with this email already exists. Please login instead.";
      } else if (errorMessage.includes("Cannot connect to server")) {
        errorMessage = "Unable to connect to server. Please check your connection and try again.";
      }

      setError(errorMessage);
      setLoading(false);
      console.error("Login/Register error:", err);
    }
  };


  return (
    <div className={`min-h-screen bg-[#f5f0e8] px-4 py-8 ${isLogin ? 'flex items-center justify-center' : ''}`}>
      <div className="w-full max-w-md space-y-4 mx-auto">
        <Card className="border-0 shadow-lg bg-[#000000] text-white rounded-xl">
          <CardHeader className="text-center space-y-2 border-b border-gray-900 rounded-t-xl">
            <div className="flex items-center justify-center mb-4">
              <h1 className="text-2xl font-bold text-white">Monnas Oldboys</h1>
            </div>
            {!isLogin && (
              <div className="flex items-center justify-center gap-2 mb-4">
                {[0, 1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                        onboardingStep === step
                          ? "bg-accent text-white"
                          : onboardingStep > step
                          ? "bg-accent/30 text-accent"
                          : "bg-gray-800 text-gray-400"
                      }`}
                    >
                      {step + 1}
                    </div>
                    {step < 3 && (
                      <div
                        className={`w-12 h-0.5 mx-1 ${
                          onboardingStep > step ? "bg-accent" : "bg-gray-800"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
            <CardDescription className="text-base text-gray-300">
              {isForgotPassword
                ? forgotPasswordStep === 0
                  ? t('auth.forgot_password_title')
                  : t('auth.forgot_password_security')
                : isLogin
                ? t('auth.welcome_back')
                : onboardingStep === 0
                ? t('auth.step1')
                : onboardingStep === 1
                ? t('auth.step2a')
                : onboardingStep === 2
                ? t('auth.step2b')
                : t('auth.step2c')}
          </CardDescription>
        </CardHeader>

          <CardContent className="bg-[#000000] rounded-b-xl">
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-md text-red-400 text-sm whitespace-pre-line">
                {error}
              </div>
            )}
            {isForgotPassword && forgotPasswordStep === 0 ? (
              // Forgot Password: Enter Email
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setForgotPasswordStep(0);
                    setForgotPasswordData({ email: "", securityAnswer: "" });
                    setError("");
                  }}
                  className="w-full mb-2 text-gray-300 hover:text-white hover:bg-gray-900"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('auth.back_to_login')}
                </Button>
                <div className="space-y-2">
                  <Label htmlFor="forgotEmail" className="text-gray-300">{t('auth.email')}</Label>
                  <Input
                    id="forgotEmail"
                    type="email"
                    placeholder="your@email.com"
                    required
                    className="h-11 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
                    value={forgotPasswordData.email}
                    onChange={(e) => setForgotPasswordData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 font-medium bg-accent text-white hover:bg-accent/90"
                  disabled={loading}
                >
                  {loading ? t('auth.sending') : t('auth.send_reset')}
                </Button>
              </form>
            ) : isForgotPassword && forgotPasswordStep === 1 ? (
              // Forgot Password: Success Message
              <div className="space-y-4 text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">{t('auth.check_email')}</h3>
                <p className="text-gray-300">{t('auth.reset_email_sent')}</p>
                <Button
                  type="button"
                  className="w-full h-11 font-medium bg-accent text-white hover:bg-accent/90"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setForgotPasswordStep(0);
                    setForgotPasswordData({ email: "", securityAnswer: "" });
                    setError("");
                  }}
                >
                  {t('auth.back_to_login')}
                </Button>
              </div>
            ) : !isLogin && onboardingStep === 1 ? (
              // Step 2a: Basic Profile Info (Year, Bio, Phone, Contact Permission)
              <form onSubmit={handleSubmit} className="space-y-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOnboardingStep(0)}
                  className="w-full mb-2 text-gray-300 hover:text-white hover:bg-gray-900"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('common.back')}
                </Button>
                <div className="space-y-2">
                  <Label htmlFor="year" className="text-gray-300">{t('profile.graduation_year')} *</Label>
                  <select
                    id="year"
                    required
                    className="w-full h-11 bg-gray-900 border border-gray-800 rounded-md text-white px-3 focus:outline-none focus:ring-2 focus:ring-accent"
                    value={formData.year}
                    onChange={(e) => handleInputChange("year", e.target.value)}
                  >
                    <option value="" className="bg-gray-900 text-gray-400">{t('profile.select_year')}</option>
                    {Array.from({ length: new Date().getFullYear() - 1949 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <option key={year} value={year} className="bg-gray-900 text-white">
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-gray-300">{t('profile.bio')} * (Max 200 characters)</Label>
                  <Textarea
                    id="bio"
                    placeholder={t('profile.bio_placeholder')}
                    required
                    maxLength={200}
                    className="min-h-[100px] bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
                    value={formData.bio}
                    onChange={(e) => {
                      if (e.target.value.length <= 200) {
                        handleInputChange("bio", e.target.value);
                      }
                    }}
                  />
                  <p className="text-xs text-gray-400 text-right">
                    {formData.bio.length}/200 characters
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPermission" className="text-gray-300">{t('profile.contact_permission')} *</Label>
                  <select
                    id="contactPermission"
                    required
                    className="w-full h-11 bg-gray-900 border border-gray-800 rounded-md text-white px-3"
                    value={formData.contactPermission}
                    onChange={(e) => handleInputChange("contactPermission", e.target.value)}
                  >
                    <option value="all">{t('profile.visible_all')}</option>
                    <option value="year-group">{t('profile.visible_year')}</option>
                    <option value="none">{t('profile.not_visible')}</option>
                  </select>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 font-medium bg-accent text-white hover:bg-accent/90"
                  disabled={loading}
                >
                  {loading ? t('auth.loading') : t('auth.continue')}
                </Button>
              </form>
            ) : !isLogin && onboardingStep === 2 ? (
              // Step 2b: Photos (Then and Now)
              <form onSubmit={handleSubmit} className="space-y-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOnboardingStep(1)}
                  className="w-full mb-2 text-gray-300 hover:text-white hover:bg-gray-900"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('common.back')}
                </Button>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="thenPhoto" className="text-gray-300">{t('profile.then_photo_label')} *</Label>
                    <div className="relative">
                      <Input
                        id="thenPhoto"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => handleInputChange("thenPhoto", e.target.files?.[0] || null)}
                      />
                      <Label htmlFor="thenPhoto" className="cursor-pointer">
                        <div className="h-32 border-2 border-dashed border-gray-800 rounded-lg flex items-center justify-center bg-gray-900/50 hover:bg-gray-900 transition-colors">
                          {formData.thenPhoto ? (
                            <span className="text-sm text-gray-300">{formData.thenPhoto.name}</span>
                          ) : (
                            <div className="text-center">
                              <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                              <span className="text-sm text-gray-400">{t('profile.upload_then')}</span>
                            </div>
                          )}
                        </div>
                      </Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nowPhoto" className="text-gray-300">{t('profile.now_photo_label')} *</Label>
                    <div className="relative">
                      <Input
                        id="nowPhoto"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => handleInputChange("nowPhoto", e.target.files?.[0] || null)}
                      />
                      <Label htmlFor="nowPhoto" className="cursor-pointer">
                        <div className="h-32 border-2 border-dashed border-gray-800 rounded-lg flex items-center justify-center bg-gray-900/50 hover:bg-gray-900 transition-colors">
                          {formData.nowPhoto ? (
                            <span className="text-sm text-gray-300">{formData.nowPhoto.name}</span>
                          ) : (
                            <div className="text-center">
                              <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                              <span className="text-sm text-gray-400">{t('profile.upload_now')}</span>
                            </div>
                          )}
                        </div>
                      </Label>
                    </div>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 font-medium bg-accent text-white hover:bg-accent/90"
                  disabled={loading}
                >
                  {loading ? t('auth.loading') : t('auth.continue')}
                </Button>
              </form>
            ) : !isLogin && onboardingStep === 3 ? (
              // Step 2c: Social Links (All Optional)
              <form onSubmit={handleSubmit} className="space-y-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOnboardingStep(2)}
                  className="w-full mb-2 text-gray-300 hover:text-white hover:bg-gray-900"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('common.back')}
                </Button>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkedin" className="text-gray-300">{t('profile.social_linkedin')}</Label>
                    <Input
                      id="linkedin"
                      type="url"
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="h-11 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
                      value={formData.linkedin}
                      onChange={(e) => handleInputChange("linkedin", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram" className="text-gray-300">{t('profile.social_insta')}</Label>
                    <Input
                      id="instagram"
                      type="url"
                      placeholder="https://instagram.com/yourprofile"
                      className="h-11 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
                      value={formData.instagram}
                      onChange={(e) => handleInputChange("instagram", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebook" className="text-gray-300">{t('profile.social_fb')}</Label>
                    <Input
                      id="facebook"
                      type="url"
                      placeholder="https://facebook.com/yourprofile"
                      className="h-11 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
                      value={formData.facebook}
                      onChange={(e) => handleInputChange("facebook", e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-11 font-medium bg-accent text-white hover:bg-accent/90">
                  {t('auth.complete_registration')}
                </Button>
              </form>
            ) : !isLogin && onboardingStep === 0 ? (
              // Step 1: Account Creation (Name, Surname, Password, Security)
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">{t('auth.email')} *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    className="h-11 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-300">{t('auth.name')} *</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John"
                      required
                      className="h-11 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="surname" className="text-gray-300">{t('auth.surname')} *</Label>
                    <Input
                      id="surname"
                      type="text"
                      placeholder="Doe"
                      required
                      className="h-11 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
                      value={formData.surname}
                      onChange={(e) => handleInputChange("surname", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300">{t('auth.password')} *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      className="h-11 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 pr-10"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-9 w-9 p-0 text-gray-400 hover:text-white hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {formData.password && (
                    <div className="space-y-1 mt-2">
                      {(() => {
                        const validation = validatePassword(formData.password);
                        return (
                          <>
                            <div className={`flex items-center gap-2 text-xs ${validation.hasMinLength ? 'text-green-400' : 'text-red-400'}`}>
                              {validation.hasMinLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              <span>{t('auth.password_req')}</span>
                            </div>
                            <div className={`flex items-center gap-2 text-xs ${validation.hasUpperCase ? 'text-green-400' : 'text-red-400'}`}>
                              {validation.hasUpperCase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              <span>{t('auth.one_upper')}</span>
                            </div>
                            <div className={`flex items-center gap-2 text-xs ${validation.hasLowerCase ? 'text-green-400' : 'text-red-400'}`}>
                              {validation.hasLowerCase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              <span>{t('auth.one_lower')}</span>
                            </div>
                            <div className={`flex items-center gap-2 text-xs ${validation.hasNumber ? 'text-green-400' : 'text-red-400'}`}>
                              {validation.hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              <span>{t('auth.one_number')}</span>
                            </div>
                            <div className={`flex items-center gap-2 text-xs ${validation.hasSpecialChar ? 'text-green-400' : 'text-red-400'}`}>
                              {validation.hasSpecialChar ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              <span>{t('auth.one_special')}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-300">{t('auth.retype_password')} *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      className={`h-11 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 pr-10 ${
                        formData.confirmPassword && formData.password === formData.confirmPassword
                          ? 'border-green-500'
                          : formData.confirmPassword && formData.password !== formData.confirmPassword
                          ? 'border-red-500'
                          : ''
                      }`}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-9 w-9 p-0 text-gray-400 hover:text-white hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {formData.confirmPassword && (
                    <div className="flex items-center gap-2 text-xs">
                      {formData.password === formData.confirmPassword ? (
                        <span className="text-green-400 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {t('auth.passwords_match')}
                        </span>
                      ) : (
                        <span className="text-red-400 flex items-center gap-1">
                          <X className="w-3 h-3" />
                          {t('auth.passwords_mismatch')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
            <div className="space-y-2">
                  <Label htmlFor="mobile" className="text-gray-300">{t('auth.mobile_number')} *</Label>
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="0631234567"
                    required
                    pattern="^0[0-9]{9}$"
                    className="h-11 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
                    value={formData.mobile}
                    onChange={(e) => {
                      // Only allow numbers and limit to 10 digits starting with 0
                      const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                      if (value === "" || value.startsWith("0")) {
                        handleInputChange("mobile", value);
                      }
                    }}
                  />
                  <p className="text-xs text-gray-400">{t('auth.sa_format')}</p>
            </div>
                <Button
                  type="submit"
                  className="w-full h-11 font-medium bg-accent text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!canProceedStep0() || loading}
                >
                  {loading ? t('auth.loading') : t('auth.continue_membership')}
                </Button>
                {!canProceedStep0() && formData.password && (
                  <p className="text-xs text-red-400 text-center mt-2">
                    {t('auth.fix_errors')}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setOnboardingStep(0);
                  }}
                  className="w-full text-sm text-gray-300 hover:text-white transition-colors pt-2"
                >
                  {t('auth.have_account')}
                </button>
              </form>
            ) : (
              // Login Form
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">{t('auth.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    className="h-11 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300">{t('auth.password')}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      className="h-11 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 pr-10"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-9 w-9 p-0 text-gray-400 hover:text-white hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotDetails(true)}
                    className="text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    {t('auth.forgot_details')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setForgotPasswordStep(0);
                      setForgotPasswordData({ email: formData.email || "", securityAnswer: "" });
                      setError("");
                    }}
                    className="text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    {t('auth.forgot_password')}
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 font-medium bg-accent text-white hover:bg-accent/90"
                  disabled={loading}
                >
                  {loading ? t('auth.signing_in') : t('auth.sign_in')}
                </Button>

            <button
              type="button"
                  onClick={() => {
                    setIsLogin(false);
                    setOnboardingStep(0);
                    resetFormData();
                  }}
                  className="w-full text-sm text-gray-300 hover:text-white transition-colors pt-2"
                >
                  {t('auth.no_account')}
            </button>

          </form>
            )}
        </CardContent>
      </Card>

      {/* Forgot My Details Dialog */}
      <Dialog open={showForgotDetails} onOpenChange={setShowForgotDetails}>
        <DialogContent className="bg-[#000000] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">{t('forgot_password.title')}</DialogTitle>
            <DialogDescription className="text-gray-300">
              I have forgotten my details. Notify admin - they will send you a new password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotDetailsSubmit} className="space-y-4 mt-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-md text-red-400 text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="forgotDetailsEmail" className="text-gray-300">{t('auth.email')}</Label>
              <Input
                id="forgotDetailsEmail"
                type="email"
                placeholder="your@email.com"
                required
                className="h-11 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
                value={forgotDetailsEmail}
                onChange={(e) => setForgotDetailsEmail(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForgotDetails(false);
                  setForgotDetailsEmail("");
                  setError("");
                }}
                className="bg-gray-900 border-gray-800 text-white hover:bg-gray-800"
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                className="bg-accent text-white hover:bg-accent/90"
                disabled={loading}
              >
                {loading ? t('forgot_password.submitting') : t('common.confirm')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      </div>
    </div>
  );
};

export default Login;
