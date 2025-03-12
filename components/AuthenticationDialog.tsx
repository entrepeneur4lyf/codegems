"use client";

import React, { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LogIn, UserPlus, Mail, Lock, User, Gift } from "lucide-react";

interface AuthDialogProps {
  trigger?: React.ReactNode;
  defaultTab?: "login" | "register";
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const AuthenticationDialog: React.FC<AuthDialogProps> = ({
  trigger,
  defaultTab = "login",
  isOpen,
  onOpenChange,
}) => {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [isLoading, setIsLoading] = useState(false);

  // Login fields
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register fields
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerDisplayName, setRegisterDisplayName] = useState("");

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { login, register } = useAuth();

  const validateLogin = () => {
    const newErrors: Record<string, string> = {};

    if (!loginUsername.trim()) {
      newErrors.loginUsername = "Benutzername wird benötigt";
    }

    if (!loginPassword) {
      newErrors.loginPassword = "Passwort wird benötigt";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegister = () => {
    const newErrors: Record<string, string> = {};

    if (!registerUsername.trim()) {
      newErrors.registerUsername = "Benutzername wird benötigt";
    } else if (registerUsername.length < 3) {
      newErrors.registerUsername =
        "Benutzername muss mindestens 3 Zeichen lang sein";
    }

    if (!registerEmail.trim()) {
      newErrors.registerEmail = "E-Mail wird benötigt";
    } else if (!/\S+@\S+\.\S+/.test(registerEmail)) {
      newErrors.registerEmail = "Ungültiges E-Mail-Format";
    }

    if (!registerPassword) {
      newErrors.registerPassword = "Passwort wird benötigt";
    } else if (registerPassword.length < 6) {
      newErrors.registerPassword =
        "Passwort muss mindestens 6 Zeichen lang sein";
    }

    if (registerPassword !== registerConfirmPassword) {
      newErrors.registerConfirmPassword = "Passwörter stimmen nicht überein";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateLogin()) return;

    setIsLoading(true);

    try {
      const success = await login(loginUsername, loginPassword);

      if (success && onOpenChange) {
        onOpenChange(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateRegister()) return;

    setIsLoading(true);

    try {
      const success = await register(
        registerUsername,
        registerEmail,
        registerPassword,
        registerDisplayName || registerUsername
      );

      if (success && onOpenChange) {
        onOpenChange(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // If Dialog is being controlled externally
  const dialogProps =
    isOpen !== undefined ? { open: isOpen, onOpenChange } : {};

  const content = (
    <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-xl">
          Anmelden oder Registrieren
        </DialogTitle>
        <DialogDescription className="text-gray-400">
          Melde dich an, um Projekte zu bewerten, zu kommentieren und Abzeichen
          freizuschalten.
        </DialogDescription>
      </DialogHeader>

      <Tabs
        defaultValue={activeTab}
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 bg-slate-700">
          <TabsTrigger
            value="login"
            className="data-[state=active]:bg-slate-900 data-[state=active]:text-white"
          >
            <LogIn className="h-4 w-4 mr-2" /> Anmelden
          </TabsTrigger>
          <TabsTrigger
            value="register"
            className="data-[state=active]:bg-slate-900 data-[state=active]:text-white"
          >
            <UserPlus className="h-4 w-4 mr-2" /> Registrieren
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="py-4">
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white">
                Benutzername
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Dein Benutzername"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                />
              </div>
              {errors.loginUsername && (
                <p className="text-red-400 text-sm">{errors.loginUsername}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Passwort
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Dein Passwort"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                />
              </div>
              {errors.loginPassword && (
                <p className="text-red-400 text-sm">{errors.loginPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-purple-500 hover:bg-purple-600 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Anmelden...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Anmelden
                </span>
              )}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="register" className="py-4">
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="register-username" className="text-white">
                Benutzername
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="register-username"
                  type="text"
                  placeholder="Wähle einen Benutzernamen"
                  value={registerUsername}
                  onChange={(e) => setRegisterUsername(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                />
              </div>
              {errors.registerUsername && (
                <p className="text-red-400 text-sm">
                  {errors.registerUsername}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-email" className="text-white">
                E-Mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="register-email"
                  type="email"
                  placeholder="deine@email.de"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                />
              </div>
              {errors.registerEmail && (
                <p className="text-red-400 text-sm">{errors.registerEmail}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-display-name" className="text-white">
                Anzeigename (optional)
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="register-display-name"
                  type="text"
                  placeholder="Wie möchtest du genannt werden?"
                  value={registerDisplayName}
                  onChange={(e) => setRegisterDisplayName(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-password" className="text-white">
                Passwort
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="register-password"
                  type="password"
                  placeholder="Erstelle ein sicheres Passwort"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                />
              </div>
              {errors.registerPassword && (
                <p className="text-red-400 text-sm">
                  {errors.registerPassword}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-confirm-password" className="text-white">
                Passwort bestätigen
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="register-confirm-password"
                  type="password"
                  placeholder="Passwort bestätigen"
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                />
              </div>
              {errors.registerConfirmPassword && (
                <p className="text-red-400 text-sm">
                  {errors.registerConfirmPassword}
                </p>
              )}
            </div>

            <div className="bg-slate-700/50 rounded-lg p-3 flex items-start gap-2">
              <Gift className="text-purple-400 h-5 w-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-300">
                Bei der Registrierung erhältst du dein erstes Abzeichen und 10
                Punkte!
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-purple-500 hover:bg-purple-600 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Registrieren...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Registrieren
                </span>
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </DialogContent>
  );

  if (trigger) {
    return (
      <Dialog {...dialogProps}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        {content}
      </Dialog>
    );
  }

  return <Dialog {...dialogProps}>{content}</Dialog>;
};

export default AuthenticationDialog;
