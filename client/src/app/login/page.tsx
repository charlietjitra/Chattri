"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Leaf, ArrowRight, Mail, Lock, Sparkles } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setError(null);
      setIsLoading(true);
      await login(data);
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#C17F59] via-[#B3714F] to-[#7D9D6A] overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-white/20 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-white/10 rounded-full" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Leaf className="h-6 w-6" />
              </div>
              <span className="text-2xl font-bold">Chattri</span>
            </div>
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              Welcome back to your learning journey
            </h1>
            <p className="text-white/80 text-lg leading-relaxed">
              Continue where you left off and keep progressing towards your goals with personalized tutoring.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-6 mt-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <div className="text-3xl font-bold mb-1">100+</div>
              <div className="text-white/70 text-sm">Expert Tutors</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <div className="text-3xl font-bold mb-1">4.9</div>
              <div className="text-white/70 text-sm">Average Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
        {/* Background Effects */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-[#C17F59]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-[#7D9D6A]/5 rounded-full blur-3xl" />
        
        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-[#C17F59] to-[#7D9D6A] rounded-xl flex items-center justify-center text-white font-bold">
              C
            </div>
            <span className="text-xl font-bold text-[#5C5C5C]">Chattri</span>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C17F59]/10 rounded-full mb-4">
              <Sparkles className="h-4 w-4 text-[#C17F59]" />
              <span className="text-sm font-medium text-[#C17F59]">Welcome Back</span>
            </div>
            <h2 className="text-3xl font-bold text-[#5C5C5C] mb-2">Sign In</h2>
            <p className="text-muted-foreground">Enter your credentials to continue</p>
          </div>

          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl shadow-[#C17F59]/5">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {error && (
                  <Alert variant="destructive" className="bg-red-50 border-red-200">
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#5C5C5C] font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10 border-[#C17F59]/20 focus:border-[#C17F59] focus:ring-[#C17F59]/20"
                      {...register("email")}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#5C5C5C] font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 border-[#C17F59]/20 focus:border-[#C17F59] focus:ring-[#C17F59]/20"
                      {...register("password")}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#C17F59] hover:bg-[#B3714F] text-white h-11 rounded-xl hover-lift"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Sign In <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-4 pb-6">
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[#C17F59]/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">or</span>
                </div>
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  href="/register"
                  className="text-[#C17F59] hover:text-[#B3714F] font-semibold transition-colors"
                >
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}