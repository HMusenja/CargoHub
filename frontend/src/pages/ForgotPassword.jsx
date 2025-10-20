import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Mail, Cloud } from "lucide-react";
import axios from "axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const res = await axios.post("/api/users/forgot-password", { email });
      setMessage(res.data.message || "Password reset link sent to your email.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-lg glass-effect border border-white/20 bg-gradient-to-br from-primary/5 to-secondary/5 backdrop-blur-xl">
        <div className="flex flex-col items-center space-y-3 mb-6">
          <div className="p-3 rounded-xl bg-primary/10 backdrop-blur-sm">
            <Cloud className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Forgot Password
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            Enter your email address to receive a password reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 glass-input"
              />
            </div>
          </div>

          {message && (
            <p className="text-sm text-green-500 text-center">{message}</p>
          )}
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white"
          >
            {submitting ? "Sending..." : "Send Reset Link"}
          </Button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-sm text-primary hover:underline"
            >
              Back to login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
