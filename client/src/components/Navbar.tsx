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
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const navLinks = user?.role === "student"
    ? [
        { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/student/tutors", label: "Find Tutors", icon: Users },
        { href: "/student/bookings", label: "My Bookings", icon: Calendar },
      ]
    : user?.role === "tutor"
    ? [
        { href: "/tutor/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/tutor/bookings", label: "Bookings", icon: Calendar },
        { href: "/tutor/reviews", label: "Reviews", icon: Star },
      ]
    : user?.role === "admin"
    ? [
        { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/users", label: "Users", icon: Users },
      ]
    : [];

  return (
    <nav className="sticky top-0 z-50 border-b border-[#C17F59]/10 bg-white/70 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
                <Link href={getLogoHref()} className="flex items-center gap-2 group">
                  <Button variant="ghost" className="p-0 h-auto hover:bg-transparent group">
                    <div className="relative">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#C17F59] to-[#7D9D6A] flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-105 transition-transform duration-300">
                        C
                      </div>
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#C17F59] to-[#7D9D6A] opacity-50 blur-md -z-10" />
                    </div>
                    <span className="text-xl font-bold text-[#5C5C5C] group-hover:text-[#C17F59] transition-colors duration-300 ml-2">
                      Chattri
                    </span>
                  </Button>
                </Link>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant={isActive(link.href) ? "secondary" : "ghost"}
                    size="sm"
                    className={`gap-2 rounded-lg transition-all duration-200 ${
                      isActive(link.href)
                        ? "bg-[#C17F59]/10 text-[#C17F59]"
                        : "text-[#5C5C5C] hover:bg-[#C17F59]/5 hover:text-[#C17F59]"
                    }`}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Button>
                </Link>
              ))}
            </div>
          )}

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                <div className="hidden md:flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#5C5C5C]">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-[#7D9D6A] capitalize font-medium">
                      {user.role}
                    </p>
                  </div>
                  <Link href="/student/profile">
                    <Avatar className="h-9 w-9 border-2 border-[#C17F59]/20 hover:border-[#C17F59]/40 transition-colors">
                      <AvatarFallback className="bg-gradient-to-br from-[#C17F59] to-[#7D9D6A] text-white font-semibold text-sm">
                        {getInitials(user.firstName, user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="gap-2 text-[#5C5C5C] hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#5C5C5C] hover:text-[#C17F59] hover:bg-[#C17F59]/5 rounded-lg"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    size="sm"
                    className="bg-[#C17F59] hover:bg-[#B3714F] text-white rounded-lg px-5 hover-lift shadow-md"
                  >
                    Get Started
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              className="md:hidden p-2 rounded-lg hover:bg-[#C17F59]/5"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 text-[#5C5C5C]" />
              ) : (
                <Menu className="h-5 w-5 text-[#5C5C5C]" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && isAuthenticated && (
          <div className="md:hidden py-4 border-t border-[#C17F59]/10">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant={isActive(link.href) ? "secondary" : "ghost"}
                    className={`w-full justify-start gap-2 rounded-lg ${
                      isActive(link.href)
                        ? "bg-[#C17F59]/10 text-[#C17F59]"
                        : "text-[#5C5C5C]"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Button>
                </Link>
              ))}
              <div className="pt-2 border-t border-[#C17F59]/10 mt-2">
                <div className="flex items-center gap-3 px-3 py-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-[#C17F59] to-[#7D9D6A] text-white text-xs">
                      {user ? getInitials(user.firstName, user.lastName) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-[#5C5C5C]">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-[#7D9D6A] capitalize">{user?.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}