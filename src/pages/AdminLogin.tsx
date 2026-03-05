import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { authApi } from "@/lib/api";

// Safari-safe storage helpers
const safeSetItem = (key: string, value: string, useSession = false) => {
  try {
    if (useSession) {
      sessionStorage.setItem(key, value);
    } else {
      localStorage.setItem(key, value);
    }
  } catch {
    console.warn('Storage not available');
  }
};

const AdminLogin = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("admin@monnas.co.za");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate required fields
      if (!email || !email.includes("@")) {
        setError(t('validation.enter_valid_email'));
        setLoading(false);
        return;
      }
      if (!password) {
        setError(t('validation.required'));
        setLoading(false);
        return;
      }

      // Login with admin login (separate from regular user login)
      // This doesn't touch regular user auth at all - completely separate systems!
      const response = await authApi.adminLogin(email, password);

      // Check if user is an admin
      if (!response || !response.user || response.user.role !== "admin") {
        setError(t('errors.unauthorized'));
        setLoading(false);
        return;
      }

      // Store admin session (completely separate from regular user auth)
      safeSetItem("adminAuthToken", response.token);
      safeSetItem("adminUser", JSON.stringify(response.user));
      safeSetItem("isAdminAuthenticated", "true");
      // Skip verification on fresh login - token was just issued
      safeSetItem("adminJustLoggedIn", "true", true);

      // DON'T touch regular user auth - keep them completely separate!
      // Regular users can still be logged in on their side - two separate portals

      // Navigate to admin dashboard
      window.location.href = "/admin";
    } catch (err: any) {
      // Handle login errors from backend
      const errorMessage = err?.error || err?.details || t('errors.login_failed');
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f0e8] p-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-[#000000] flex items-center justify-center">
              <Shield className="w-8 h-8 text-accent" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">{t('auth.admin_login')}</CardTitle>
            <CardDescription className="mt-2">
              {t('auth.admin_sign_in')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Test Credentials Box */}
            <div className="p-3 text-sm bg-blue-50 border border-blue-200 rounded-md">
              <p className="font-medium text-blue-800">Test Credentials:</p>
              <p className="text-blue-700">Email: admin@monnas.co.za</p>
              <p className="text-blue-700">Password: admin123</p>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('auth.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#000000] text-white hover:bg-[#000000]/90 h-11"
              disabled={loading}
            >
              {loading ? t('auth.signing_in') : t('auth.login')}
            </Button>

          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;







