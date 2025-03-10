
import { createContext, useContext, useEffect, useState } from "react";
import bcrypt from "bcryptjs";
import { toast } from "sonner";

export interface User {
  email: string;
  credits: number;
  isPremium: boolean;
  premiumUntil?: Date;
  isUnlimited: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  register: (email: string, password: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  useCredit: () => boolean;
  addCredits: (amount: number) => void;
  setPremium: (until?: Date) => void;
  setUnlimited: () => void;
}

interface StoredUser extends User {
  passwordHash: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar usuario al inicio
  useEffect(() => {
    const loadUser = () => {
      const userJson = localStorage.getItem("currentUser");
      if (userJson) {
        try {
          const userData = JSON.parse(userJson);
          // Convertir premiumUntil de string a Date si existe
          if (userData.premiumUntil) {
            userData.premiumUntil = new Date(userData.premiumUntil);
          }
          setUser(userData);
        } catch (error) {
          console.error("Error parsing user data:", error);
          localStorage.removeItem("currentUser");
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  // Guardar usuario cuando cambie
  useEffect(() => {
    if (user) {
      localStorage.setItem("currentUser", JSON.stringify(user));
    }
  }, [user]);

  // Función para registrar un nuevo usuario
  const register = async (email: string, password: string): Promise<boolean> => {
    try {
      const users = getUsers();
      
      // Verificar si el email ya está registrado
      if (users.some(u => u.email === email)) {
        toast.error("Este correo electrónico ya está registrado");
        return false;
      }
      
      // Hash de la contraseña (costo 12)
      const passwordHash = await bcrypt.hash(password, 12);
      
      // Crear nuevo usuario
      const newUser: StoredUser = {
        email,
        passwordHash,
        credits: 0,
        isPremium: false,
        isUnlimited: false
      };
      
      // Guardar usuario
      users.push(newUser);
      localStorage.setItem("users", JSON.stringify(users));
      
      // Iniciar sesión con el nuevo usuario
      const userForContext: User = {
        email: newUser.email,
        credits: newUser.credits,
        isPremium: newUser.isPremium,
        isUnlimited: newUser.isUnlimited
      };
      
      setUser(userForContext);
      toast.success("Registro exitoso");
      return true;
    } catch (error) {
      console.error("Error during registration:", error);
      toast.error("Error durante el registro");
      return false;
    }
  };

  // Función para iniciar sesión
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const users = getUsers();
      const userFound = users.find(u => u.email === email);
      
      if (!userFound) {
        toast.error("Correo electrónico o contraseña incorrectos");
        return false;
      }
      
      const passwordMatch = await bcrypt.compare(password, userFound.passwordHash);
      
      if (!passwordMatch) {
        toast.error("Correo electrónico o contraseña incorrectos");
        return false;
      }
      
      // Verificar y actualizar estado premium si ha expirado
      if (userFound.premiumUntil && new Date(userFound.premiumUntil) < new Date()) {
        userFound.isPremium = false;
        userFound.premiumUntil = undefined;
        
        // Actualizar en el almacenamiento
        updateUserInStorage(userFound);
      }
      
      // Iniciar sesión
      const userForContext: User = {
        email: userFound.email,
        credits: userFound.credits,
        isPremium: userFound.isPremium,
        premiumUntil: userFound.premiumUntil ? new Date(userFound.premiumUntil) : undefined,
        isUnlimited: userFound.isUnlimited
      };
      
      setUser(userForContext);
      toast.success("Inicio de sesión exitoso");
      return true;
    } catch (error) {
      console.error("Error during login:", error);
      toast.error("Error durante el inicio de sesión");
      return false;
    }
  };

  // Cerrar sesión
  const logout = () => {
    setUser(null);
    localStorage.removeItem("currentUser");
  };

  // Actualizar datos del usuario
  const updateUser = (userData: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    
    // Actualizar en el almacenamiento de usuarios
    if (updatedUser) {
      updateUserInStorage(updatedUser);
    }
  };

  // Usar un crédito
  const useCredit = (): boolean => {
    if (!user) return false;
    
    // Si tiene premium ilimitado o es unlimited, no consume créditos
    if (user.isUnlimited || (user.isPremium && user.premiumUntil && user.premiumUntil > new Date())) {
      return true;
    }
    
    if (user.credits <= 0) {
      toast.error("No tienes suficientes créditos");
      return false;
    }
    
    const updatedUser = {
      ...user,
      credits: user.credits - 1
    };
    
    setUser(updatedUser);
    updateUserInStorage(updatedUser);
    return true;
  };

  // Añadir créditos
  const addCredits = (amount: number) => {
    if (!user) return;
    
    const updatedUser = {
      ...user,
      credits: user.credits + amount
    };
    
    setUser(updatedUser);
    updateUserInStorage(updatedUser);
    toast.success(`Se han añadido ${amount} créditos a tu cuenta`);
  };

  // Establecer usuario como premium
  const setPremium = (until?: Date) => {
    if (!user) return;
    
    const updatedUser = {
      ...user,
      isPremium: true,
      premiumUntil: until
    };
    
    setUser(updatedUser);
    updateUserInStorage(updatedUser);
    toast.success("¡Ahora eres usuario Premium!");
  };

  // Establecer usuario como ilimitado
  const setUnlimited = () => {
    if (!user) return;
    
    const updatedUser = {
      ...user,
      isUnlimited: true
    };
    
    setUser(updatedUser);
    updateUserInStorage(updatedUser);
    toast.success("¡Ahora tienes acceso ilimitado!");
  };

  // Funciones auxiliares para el almacenamiento
  function getUsers(): StoredUser[] {
    const usersJson = localStorage.getItem("users");
    return usersJson ? JSON.parse(usersJson) : [];
  }

  function updateUserInStorage(updatedUser: User) {
    const users = getUsers();
    const index = users.findIndex(u => u.email === updatedUser.email);
    
    if (index !== -1) {
      // Mantener el passwordHash que ya teníamos
      users[index] = {
        ...users[index],
        ...updatedUser
      };
      
      localStorage.setItem("users", JSON.stringify(users));
    }
  }

  // Crear usuario demo si no existe ninguno
  useEffect(() => {
    const createDemoUser = async () => {
      const users = getUsers();
      
      if (users.length === 0) {
        const demoEmail = "demo@ejemplo.com";
        const demoPassword = "demo1234";
        const passwordHash = await bcrypt.hash(demoPassword, 12);
        
        const demoUser: StoredUser = {
          email: demoEmail,
          passwordHash,
          credits: 3,
          isPremium: false,
          isUnlimited: false
        };
        
        localStorage.setItem("users", JSON.stringify([demoUser]));
        console.log("Usuario demo creado: demo@ejemplo.com / demo1234");
      }
    };
    
    createDemoUser();
  }, []);

  const value = {
    user,
    isLoading,
    register,
    login,
    logout,
    updateUser,
    useCredit,
    addCredits,
    setPremium,
    setUnlimited
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
