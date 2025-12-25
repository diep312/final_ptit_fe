import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/common/Input";
import authGradient from "@/assets/auth-gradient.png";
import { useApi } from "@/hooks/use-api";
import { useAuth } from "@/contexts/AuthContext";

interface LoginResponse {
  status: number;
  success: boolean;
  message: string;
  data: {
    access_token: string;
    expire_in: number;
    auth_type: string;
    user_type?: string; // 'system_user' for admin/staff, 'organizer' for organizers
  };
}

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

const Login = () => {
  const navigate = useNavigate();
  const { api, safeRequest } = useApi();
  const { login, isAuthenticated, userType } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (userType === "admin" || userType === "system_user") {
        navigate("/admin", { replace: true });
      } else if (userType === "organizer") {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, userType, navigate]);

  // Email validation
  const validateEmail = (email: string): string => {
    if (!email) {
      return "Email là bắt buộc";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Email không hợp lệ";
    }
    return "";
  };

  // Password validation
  const validatePassword = (password: string): string => {
    if (!password) {
      return "Mật khẩu là bắt buộc";
    }
    if (password.length < 6) {
      return "Mật khẩu phải có ít nhất 6 ký tự";
    }
    return "";
  };

  // Handle field blur
  const handleBlur = (field: "email" | "password") => {
    setTouched({ ...touched, [field]: true });
    
    if (field === "email") {
      setErrors({ ...errors, email: validateEmail(formData.email) });
    } else if (field === "password") {
      setErrors({ ...errors, password: validatePassword(formData.password) });
    }
  };

  // Handle field change
  const handleChange = (field: "email" | "password", value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear error when user starts typing
    if (touched[field]) {
      if (field === "email") {
        setErrors({ ...errors, email: validateEmail(value) });
      } else if (field === "password") {
        setErrors({ ...errors, password: validatePassword(value) });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    setErrors({
      email: emailError,
      password: passwordError,
    });

    setTouched({
      email: true,
      password: true,
    });

    // Don't submit if there are errors
    if (emailError || passwordError) {
      return;
    }

    let loginSuccess = false;

    try {
      const adminLoginResult = await api.post<LoginResponse>("/admin/auth/login", {
        email: formData.email,
        password: formData.password,
      });
    });

    if (loginResult && loginResult.data?.access_token) {
      const token = loginResult.data.access_token;
      const userType = loginResult.data.user_type || "system_user"; // Default to system_user for admin endpoint

      if (token && typeof token === "string" && token.trim() !== "") {
        localStorage.setItem("auth_token", token);
        // Map user_type from backend to frontend type
        const frontendUserType =
          userType === "system_user" ? "admin" : "organizer";
        localStorage.setItem("user_type", frontendUserType);

        // Fetch user profile
        const profileResponse = await safeRequest<{
          status: number;
          success: boolean;
          message: string;
          data: UserProfile;
        }>(async () => {
          return await api.get<{
            status: number;
            success: boolean;
            message: string;
            data: UserProfile;
          }>("/admin/auth/me");
        });

        if (profileResponse) {
          const profile: UserProfile =
            (profileResponse as any)?.data || profileResponse;
          login(token, profile, frontendUserType as "admin" | "organizer");

          // Redirect based on user type
          if (frontendUserType === "admin") {
            navigate("/admin");
          } else {
            navigate("/dashboard");
          }
          return;
        }
      } else {
        console.error("Invalid token received from login");
      }
    }

    // If admin login failed, try organizer login (fallback for backward compatibility)
    const organizerLoginResult = await safeRequest<LoginResponse>(async () => {
      return await api.post<LoginResponse>("/organizer/auth/login", {
        email: formData.email,
        password: formData.password,
      });
    });

    if (organizerLoginResult && organizerLoginResult.data?.access_token) {
      const token = organizerLoginResult.data.access_token;
      if (token && typeof token === "string" && token.trim() !== "") {
        localStorage.setItem("auth_token", token);
        localStorage.setItem("user_type", "organizer");

        const organizerProfileResponse = await safeRequest<{
          status: number;
          success: boolean;
          message: string;
          data: UserProfile;
        }>(async () => {
          return await api.get<{
            status: number;
            success: boolean;
            message: string;
            data: UserProfile;
          }>("/organizer/auth/me");
        });

        if (organizerProfileResponse) {
          const organizerProfile: UserProfile =
            (organizerProfileResponse as any)?.data || organizerProfileResponse;
          login(token, organizerProfile, "organizer");
          navigate("/dashboard");
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative self-center overflow-hidden mx-10">
        <div
          className="relative w-full"
          style={{ aspectRatio: "1 / 1", height: "80vh" }}
        >
          <img
            src={authGradient}
            alt="Abstract gradient background"
            className="absolute inset-0 w-full h-full object-cover rounded-2xl"
          />
          <div className="relative z-10 flex items-center justify-center h-full pl-14 pr-28">
            <div className="max-w-md text-white">
              <h1 className="font-heading text-5xl mb-4 font-semibold">
                Tiếp tục nơi mọi kết nối đang diễn ra.
              </h1>
              <p className="text-base text-white/90 pt-9">
                Quản lý sự kiện, gặp người tham dự và tạo ra trải nghiệm khó
                quên với tất cả ở cùng tầm tay.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="font-heading text-3xl font-bold mb-2">Đăng nhập</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                label="Email"
                type="email"
                placeholder="Nhập email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                required
              />
              {touched.email && errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            <div className="relative">
              <Input
                label="Mật khẩu"
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                onBlur={() => handleBlur("password")}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-12 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
              {touched.password && errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            <Button type="submit" className="w-full h-11 font-medium">
              Đăng nhập
            </Button>
          </form>

          {/* <div className="text-center space-y-4">

            <div className="flex items-center justify-center">
              <hr className="w-1/4"/>
              <p className="text-sm text-muted-foreground px-10">hoặc</p>
              <hr className="w-1/4"/>
            </div>
            <p className="text-sm text-muted-foreground">
              Đăng ký tài khoản mới{" "}
              <Link to="/register" className="text-primary font-medium underline">
                tại đây
              </Link>
            </p>
          </div> */}
        </div>
      </div>

      <div className="absolute w-15 h- bg-primary rounded-lg flex items-center justify-center right-10 bottom-10">
        <img
          src="/logo.png"
          alt="Logo"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default Login;
