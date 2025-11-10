import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, Package, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import { useTheme } from "@/context/ThemeContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  
    const toggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const openAuth = (mode) => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const role = (user?.role || "").toLowerCase();
  const canBackoffice =
    role === "staff" || role === "admin";

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-card/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">CargoHub</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/quote"
              className="text-foreground hover:text-primary transition-colors"
            >
              Get Quote
            </Link>
            <Link
              to="/track"
              className="text-foreground hover:text-primary transition-colors"
            >
              Track Shipment
            </Link>
            <Link
              to="/support"
              className="text-foreground hover:text-primary transition-colors"
            >
              Support
            </Link>
            <Link
              to="/shipments"
              className="text-foreground hover:text-primary transition-colors"
            >
              My Shipments
            </Link>
            {/*  Back-office link (only for staff/admin) */}
            {canBackoffice && (
              <NavLink
                to="/backoffice"
                className={({ isActive }) =>
                  `flex items-center gap-1 transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-foreground hover:text-primary"
                  }`
                }
              >
                <Shield className="h-4 w-4" />
                Back-office
              </NavLink>
            )}
            {user && (
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `text-foreground hover:text-primary transition-colors ${
                    isActive ? "text-primary" : ""
                  }`
                }
              >
                Dashboard
              </NavLink>
            )}
          </div>

          {/* Auth Buttons (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">
                  Hi, <strong>{user.username}</strong>
                </span>
                <Button variant="outline" onClick={logout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => openAuth("login")}>
                  Login
                </Button>
                <Button onClick={() => openAuth("register")}>Register</Button>
              </>
            )}
          </div>
          {/* Theme toggle button */}
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 transition"
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-foreground"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <Link
                to="/quote"
                className="text-foreground hover:text-primary transition-colors"
              >
                Get Quote
              </Link>
              <Link
                to="/track"
                className="text-foreground hover:text-primary transition-colors"
              >
                Track Shipment
              </Link>
              <Link
                to="/support"
                className="text-foreground hover:text-primary transition-colors"
              >
                Support
              </Link>
              <Link
                to="/shipments"
                className="text-foreground hover:text-primary transition-colors"
              >
                My Shipments
              </Link>
              {/* Back-office (mobile) */}
              {canBackoffice && (
                <Link
                  to="/backoffice"
                  className="text-foreground hover:text-primary transition-colors"
                >
                  Back-office
                </Link>
              )}
              {user && (
                <Link
                  to="/dashboard"
                  className={({ isActive }) =>
                    `text-foreground hover:text-primary transition-colors ${
                      isActive ? "text-primary" : ""
                    }`
                  }
                >
                  Dashboard
                </Link>
              )}

              {/* Auth Buttons (Mobile) */}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                {user ? (
                  <>
                    <span className="text-sm text-muted-foreground">
                      Hi, <strong>{user.username}</strong>
                    </span>
                    <Button variant="outline" onClick={logout}>
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" onClick={() => openAuth("login")}>
                      Login
                    </Button>
                    <Button onClick={() => openAuth("register")}>
                      Register
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </nav>
  );
};

export default Navbar;
