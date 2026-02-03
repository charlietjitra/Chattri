"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LogOut,
  User,
  Calendar,
  Star,
  Users,
  LayoutDashboard,
} from "lucide-react";

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const pathname = usePathname();

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const isActive = (path: string) => pathname === path;

  const getLogoHref = () => {
    if (isAuthenticated && user?.role === "student") {
      return "/student/dashboard";
    }
    if (isAuthenticated && user?.role === "tutor") {
      return "/tutor/dashboard";
    }
    return "/";
  };

  return (
    <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href={getLogoHref()} className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold">
              C
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Chattri
            </span>
          </Link>

          {/* Navigation Links */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-1">
              {user?.role === "student" && (
                <>
                  <Link href="/student/dashboard">
                    <Button
                      variant={
                        isActive("/student/dashboard") ? "secondary" : "ghost"
                      }
                      size="sm"
                      className="gap-2"
                    >
                      <Star className="h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/student/tutors">
                    <Button
                      variant={
                        isActive("/student/tutors") ? "secondary" : "ghost"
                      }
                      size="sm"
                      className="gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Find Tutors
                    </Button>
                  </Link>
                  <Link href="/student/bookings">
                    <Button
                      variant={
                        isActive("/student/bookings") ? "secondary" : "ghost"
                      }
                      size="sm"
                      className="gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      My Bookings
                    </Button>
                  </Link>
                </>
              )}

              {user?.role === "tutor" && (
                <>
                  <Link href="/tutor/dashboard">
                    <Button
                      variant={
                        isActive("/tutor/dashboard") ? "secondary" : "ghost"
                      }
                      size="sm"
                      className="gap-2"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/tutor/bookings">
                    <Button
                      variant={
                        isActive("/tutor/bookings") ? "secondary" : "ghost"
                      }
                      size="sm"
                      className="gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      Bookings
                    </Button>
                  </Link>
                  <Link href="/tutor/reviews">
                    <Button
                      variant={
                        isActive("/tutor/reviews") ? "secondary" : "ghost"
                      }
                      size="sm"
                      className="gap-2"
                    >
                      <Star className="h-4 w-4" />
                      Reviews
                    </Button>
                  </Link>
                </>
              )}

              {user?.role === "admin" && (
                <>
                  <Link href="/admin/dashboard">
                    <Button
                      variant={
                        isActive("/admin/dashboard") ? "secondary" : "ghost"
                      }
                      size="sm"
                      className="gap-2"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/admin/users">
                    <Button
                      variant={isActive("/admin/users") ? "secondary" : "ghost"}
                      size="sm"
                      className="gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Users
                    </Button>
                  </Link>
                </>
              )}
            </div>
          )}

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                <div className="hidden md:flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium">{`${user.firstName} ${user.lastName}`}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {user.role}
                    </p>
                  </div>
                  <Link href="/student/profile">
                    <Avatar className="h-9 w-9 border-2 border-purple-200">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white font-semibold">
                        {getInitials(user.firstName, user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
