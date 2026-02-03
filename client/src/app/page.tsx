"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import HomePage from "./landing/page";

export default function app() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role) {
      if (user.role === "student") {
        router.replace("/student/dashboard");
      } else if (user.role === "tutor") {
        router.replace("/tutor/dashboard");
      } else if (user.role === "admin") {
        router.replace("/admin/dashboard");
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return <HomePage />;
}
