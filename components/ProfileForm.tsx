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
import { LogIn, UserPlus, Mail, Lock, User, Gift, AlertCircle, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FormData {
  displayName: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  email: string;
}

const ProfileForm = () => {
  const { user, updateUser, isLoading } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    displayName: user?.displayName || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    email: user?.email || "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when value changes
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    // Validate display name
    if (!formData.displayName.trim()) {
      errors.displayName = "Display name is required";
    }
    
    // Validate email
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Invalid email format";
    }
    
    // If changing password, validate password fields
    if (formData.currentPassword || formData.newPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        errors.currentPassword = "Current password is required to change password";
      }
      
      if (!formData.newPassword) {
        errors.newPassword = "New password is required";
      } else if (formData.newPassword.length < 6) {
        errors.newPassword = "Password must be at least 6 characters";
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords don't match";
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSuccess(null);
    setFormError(null);
    
    if (!validateForm()) return;
    
    // Prepare update data
    const updateData = {
      displayName: formData.displayName,
      ...(formData.email && { email: formData.email }),
    };
    
    // Add password data if changing password
    if (formData.currentPassword && formData.newPassword) {
      Object.assign(updateData, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
    }
    
    try {
      const success = await updateUser(updateData);
      
      if (success) {
        setFormSuccess("Profile updated successfully");
        // Reset password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        }));
      } else {
        setFormError("Failed to update profile. Please check your inputs and try again.");
      }
    } catch (error) {
      setFormError("An unexpected error occurred. Please try again later.");
      console.error("Profile update error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formSuccess && (
        <Alert className="bg-green-500/20 border-green-500 mb-4">
          <Check className="h-4 w-4 text-green-400" />
          <AlertDescription className="text-green-200">
            {formSuccess}
          </AlertDescription>
        </Alert>
      )}
      
      {formError && (
        <Alert className="bg-red-500/20 border-red-500 mb-4">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-200">
            {formError}
          </AlertDescription>
        </Alert>
      )}
    
      <div className="space-y-2">
        <Label htmlFor="displayName" className="text-white">
          Display Name
        </Label>
        <Input
          id="displayName"
          name="displayName"
          value={formData.displayName}
          onChange={handleInputChange}
          placeholder="Your display name"
          className="bg-slate-700 border-slate-600 text-white"
        />
        {formErrors.displayName && (
          <p className="text-red-400 text-sm">{formErrors.displayName}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email" className="text-white">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="Your email address"
          className="bg-slate-700 border-slate-600 text-white"
        />
        {formErrors.email && (
          <p className="text-red-400 text-sm">{formErrors.email}</p>
        )}
      </div>
      
      <div className="pt-4 border-t border-slate-700">
        <h3 className="text-white font-medium mb-2">Change Password</h3>
        
        <div className="space-y-2">
          <Label htmlFor="currentPassword" className="text-white">
            Current Password
          </Label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            value={formData.currentPassword}
            onChange={handleInputChange}
            placeholder="Enter your current password"
            className="bg-slate-700 border-slate-600 text-white"
          />
          {formErrors.currentPassword && (
            <p className="text-red-400 text-sm">{formErrors.currentPassword}</p>
          )}
        </div>
        
        <div className="space-y-2 mt-2">
          <Label htmlFor="newPassword" className="text-white">
            New Password
          </Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            value={formData.newPassword}
            onChange={handleInputChange}
            placeholder="Enter your new password"
            className="bg-slate-700 border-slate-600 text-white"
          />
          {formErrors.newPassword && (
            <p className="text-red-400 text-sm">{formErrors.newPassword}</p>
          )}
        </div>
        
        <div className="space-y-2 mt-2">
          <Label htmlFor="confirmPassword" className="text-white">
            Confirm New Password
          </Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="Confirm your new password"
            className="bg-slate-700 border-slate-600 text-white"
          />
          {formErrors.confirmPassword && (
            <p className="text-red-400 text-sm">{formErrors.confirmPassword}</p>
          )}
        </div>
      </div>
      
      <div className="pt-4">
        <Button
          type="submit"
          className="bg-purple-500 hover:bg-purple-600 text-white"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              Updating...
            </span>
          ) : (
            "Update Profile"
          )}
        </Button>
      </div>
    </form>
  );
};

export default ProfileForm;