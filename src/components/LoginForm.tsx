
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login, register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validación básica
      if (!loginData.email || !loginData.password) {
        toast.error("Por favor, completa todos los campos");
        return;
      }
      
      // Intentar login
      const success = await login(loginData.email, loginData.password);
      
      if (success && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error durante el inicio de sesión:", error);
      toast.error("Ha ocurrido un error durante el inicio de sesión");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validación básica
      if (!registerData.email || !registerData.password || !registerData.confirmPassword) {
        toast.error("Por favor, completa todos los campos");
        return;
      }
      
      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(registerData.email)) {
        toast.error("Por favor, introduce un correo electrónico válido");
        return;
      }
      
      // Validar contraseña
      if (registerData.password.length < 6) {
        toast.error("La contraseña debe tener al menos 6 caracteres");
        return;
      }
      
      // Confirmar contraseña
      if (registerData.password !== registerData.confirmPassword) {
        toast.error("Las contraseñas no coinciden");
        return;
      }
      
      // Intentar registro
      const success = await register(registerData.email, registerData.password);
      
      if (success && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error durante el registro:", error);
      toast.error("Ha ocurrido un error durante el registro");
    } finally {
      setIsLoading(false);
    }
  };

  // Función para cambiar a la pestaña de registro
  const switchToRegister = () => {
    const registerTab = document.querySelector('[data-value="register"]') as HTMLElement;
    if (registerTab) {
      registerTab.click?.();
    }
  };

  // Función para cambiar a la pestaña de login
  const switchToLogin = () => {
    const loginTab = document.querySelector('[data-value="login"]') as HTMLElement;
    if (loginTab) {
      loginTab.click?.();
    }
  };

  return (
    <Tabs defaultValue="login" className="w-full">
      <div className="bg-primary p-4 text-white">
        <h2 className="text-xl font-semibold text-center">Acceso</h2>
        <TabsList className="mt-2 grid grid-cols-2 bg-primary/20">
          <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:text-primary">
            Iniciar sesión
          </TabsTrigger>
          <TabsTrigger value="register" className="data-[state=active]:bg-white data-[state=active]:text-primary">
            Registrarse
          </TabsTrigger>
        </TabsList>
      </div>
      
      <div className="p-6">
        <TabsContent value="login">
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Correo electrónico</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="tu@email.com"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password">Contraseña</Label>
                <a href="#" className="text-xs text-primary hover:underline">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              ¿No tienes una cuenta?{" "}
              <a href="#" onClick={(e) => { e.preventDefault(); switchToRegister(); }} className="text-primary hover:underline">
                Regístrate
              </a>
            </p>
          </form>
        </TabsContent>
        
        <TabsContent value="register">
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="register-email">Correo electrónico</Label>
              <Input
                id="register-email"
                type="email"
                placeholder="tu@email.com"
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="register-password">Contraseña</Label>
              <Input
                id="register-password"
                type="password"
                placeholder="••••••••"
                value={registerData.password}
                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="register-confirm-password">Confirmar contraseña</Label>
              <Input
                id="register-confirm-password"
                type="password"
                placeholder="••••••••"
                value={registerData.confirmPassword}
                onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Registrando..." : "Registrarse"}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              ¿Ya tienes una cuenta?{" "}
              <a href="#" onClick={(e) => { e.preventDefault(); switchToLogin(); }} className="text-primary hover:underline">
                Inicia sesión
              </a>
            </p>
          </form>
        </TabsContent>
      </div>
    </Tabs>
  );
}
