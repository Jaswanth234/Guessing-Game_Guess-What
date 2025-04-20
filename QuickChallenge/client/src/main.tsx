import React, { createContext, ReactNode, useState, useMemo } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import App from "./App";
import "./index.css";

export type UserRole = 'host' | 'participant' | null;

// Enhanced Auth Context with role selection
export interface AuthContextType {
  user: any;
  isLoading: boolean;
  error: null | Error;
  role: UserRole;
  setRole: (role: UserRole) => void;
  loginMutation: { isPending: boolean, mutate: (data: any) => void };
  logoutMutation: { isPending: boolean, mutate: () => void };
  registerMutation: { isPending: boolean, mutate: (data: any) => void };
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  error: null,
  role: null,
  setRole: () => {},
  loginMutation: { isPending: false, mutate: () => console.log('Login') },
  logoutMutation: { isPending: false, mutate: () => console.log('Logout') },
  registerMutation: { isPending: false, mutate: () => console.log('Register') },
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>(null);
  
  const value = useMemo(() => ({
    user: null,
    isLoading: false,
    error: null,
    role,
    setRole,
    loginMutation: { isPending: false, mutate: () => console.log('Login') },
    logoutMutation: { isPending: false, mutate: () => console.log('Logout') },
    registerMutation: { isPending: false, mutate: () => console.log('Register') },
  }), [role]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Wait for DOM to be fully loaded before rendering
document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('root');
  
  if (rootElement) {
    // Use the older ReactDOM.render pattern to avoid multiple createRoot calls
    import('react-dom').then(({ render }) => {
      render(
        <React.StrictMode>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <App />
            </AuthProvider>
          </QueryClientProvider>
        </React.StrictMode>,
        rootElement
      );
    });
  }
});
