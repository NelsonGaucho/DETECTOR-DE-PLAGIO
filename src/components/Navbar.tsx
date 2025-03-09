
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Moon, Sun, User } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoginForm } from "./LoginForm";
import { useIsMobile } from "@/hooks/use-mobile";
import { Diamond } from "lucide-react";

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const navLinks = [
    { path: "/", label: "Inicio" },
    { path: "/premium", label: "Premium" }
  ];

  return (
    <header className="w-full backdrop-blur-md bg-white/70 dark:bg-slate-900/70 fixed top-0 left-0 right-0 z-50 border-b border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link 
          to="/" 
          className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent"
        >
          Detector de Plagio
        </Link>

        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`transition-all duration-200 px-1 py-2 ${
                location.pathname === link.path
                  ? "text-primary font-medium"
                  : "text-foreground/80 hover:text-primary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full"
            aria-label="Cambiar tema"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 text-yellow-400" />
            ) : (
              <Moon className="h-5 w-5 text-slate-700" />
            )}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full border border-primary/20"
                >
                  <User className="h-5 w-5 text-primary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass-panel animate-fade-in">
                <DropdownMenuLabel className="flex flex-col items-center py-3">
                  <span>{user.email}</span>
                  <div className="flex items-center text-sm text-green-500 mt-1">
                    <Diamond className="h-4 w-4 mr-1" />
                    <span>{user.credits} créditos</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/premium" className="w-full cursor-pointer">
                    Comprar créditos
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={logout}
                  className="cursor-pointer text-red-500 focus:text-red-500"
                >
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="default" 
                  size={isMobile ? "icon" : "default"}
                  className={isMobile ? "rounded-full" : "rounded-full"}
                >
                  {isMobile ? (
                    <User className="h-5 w-5" />
                  ) : (
                    "Iniciar sesión"
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-panel p-0 border-none overflow-hidden">
                <LoginForm onSuccess={() => setIsLoginOpen(false)} />
              </DialogContent>
            </Dialog>
          )}
          
          {isMobile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                    />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-panel animate-fade-in">
                {navLinks.map((link) => (
                  <DropdownMenuItem key={link.path} asChild>
                    <Link
                      to={link.path}
                      className={
                        location.pathname === link.path
                          ? "font-medium text-primary"
                          : ""
                      }
                    >
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
