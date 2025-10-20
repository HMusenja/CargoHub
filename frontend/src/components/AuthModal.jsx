import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { Cloud, Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const AuthModal = ({ isOpen = false, onClose, initialMode = "login" }) => {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [mode, setMode] = useState(initialMode); // "login" | "register"
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successNote, setSuccessNote] = useState("");

  const identifierRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    emailOrUsername: "", // for login
    email: "", // for register
    password: "",
  });

  const isLogin = mode === "login";

  // Reset modal state when opened
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (isOpen) {
      setError("");
      setSuccessNote("");
      setShowPassword(false);
      if (initialMode === "login") {
        setFormData({
          fullName: "",
          username: "",
          emailOrUsername: "",
          email: "",
          password: "",
        });
      }
    }
  }, [isOpen, initialMode]);

  // Autofocus identifier when switching to login
  useEffect(() => {
    if (mode === "login" && isOpen) {
      const t = setTimeout(() => identifierRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [mode, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError("");
    setSuccessNote("");
    setFormData({
      fullName: "",
      username: "",
      emailOrUsername: "",
      email: "",
      password: "",
    });
  };

  const canSubmit = useMemo(() => {
    if (isLogin) {
      return formData.emailOrUsername.trim() && formData.password.trim();
    }
    return (
      formData.fullName.trim() &&
      formData.username.trim() &&
      formData.email.trim() &&
      formData.password.trim()
    );
  }, [isLogin, formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setError("");
    setSuccessNote("");

    try {
      if (isLogin) {
        const res = await login({
          identifier: formData.emailOrUsername.trim(),
          password: formData.password,
        });
        if (res.ok) {
          onClose();
          navigate("/dashboard");
        } else {
          setError(res.error || "Login failed");
        }
      } else {
        const res = await register({
          fullName: formData.fullName.trim(),
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
        });

        if (res.ok) {
          const identifierPreferred =
            formData.email.trim() || formData.username.trim();
          setMode("login");
          setFormData({
            fullName: "",
            username: "",
            emailOrUsername: identifierPreferred,
            email: "",
            password: "",
          });
          setSuccessNote("✅ Account created. Please sign in.");
        } else {
          setError(res.error || "Registration failed");
        }
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-effect border border-white/20 bg-gradient-to-br from-primary/5 to-secondary/5 backdrop-blur-xl max-w-md">
        <DialogHeader className="space-y-4">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="p-3 rounded-xl bg-primary/10 backdrop-blur-sm">
              <Cloud className="h-8 w-8 text-primary" />
            </div>
          </div>

          <DialogTitle className="text-center text-2xl font-bold text-foreground">
            {isLogin ? "Welcome Back" : "Create Account"}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-center text-muted-foreground text-sm">
          {isLogin
            ? "Sign in to access your dashboard"
            : "Join CargoHub for a better logistics experience"}
        </DialogDescription>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {/* Register-only fields */}
          {!isLogin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) =>
                      handleInputChange("fullName", e.target.value)
                    }
                    className="pl-10 glass-input"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={(e) =>
                      handleInputChange("username", e.target.value)
                    }
                    className="pl-10 glass-input"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {/* Identifier field */}
          <div className="space-y-2">
            <Label htmlFor="identifier">
              {isLogin ? "Email or Username" : "Email"}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="identifier"
                ref={identifierRef}
                type={isLogin ? "text" : "email"}
                placeholder={
                  isLogin ? "Enter email or username" : "Enter your email"
                }
                value={isLogin ? formData.emailOrUsername : formData.email}
                onChange={(e) =>
                  isLogin
                    ? handleInputChange("emailOrUsername", e.target.value)
                    : handleInputChange("email", e.target.value)
                }
                className="pl-10 glass-input"
                required
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="pl-10 pr-10 glass-input"
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {/* Forgot password link (only for login) */}
            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate("/forgot-password");
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}
          </div>

          {/* Messages */}
          {successNote && (
            <p className="text-sm text-green-500">{successNote}</p>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            type="submit"
            disabled={!canSubmit || submitting}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white"
          >
            {submitting
              ? isLogin
                ? "Signing in..."
                : "Creating account..."
              : isLogin
              ? "Sign In"
              : "Create Account"}
          </Button>

          {/* Switch mode */}
          <div className="relative my-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </span>
          </div>

          <Button
            type="button"
            variant="ghost"
            className="w-full text-primary"
            onClick={() => switchMode(isLogin ? "register" : "login")}
          >
            {isLogin ? "Create new account" : "Sign in instead"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
