'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Leaf, ArrowRight, Sparkles, User, Mail, Lock, Globe } from 'lucide-react'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  timeZone: z.string().min(1, 'Time zone is required'),
  bio: z.string().optional(),
  learningGoals: z.string().optional(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [experienceLevel, setExperienceLevel] = useState<string>()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  })

  const onSubmit = async (data: RegisterForm) => {
    setError(null)
    setIsLoading(true)

    try {
      await registerUser({
        ...data,
        experienceLevel: experienceLevel as any,
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#7D9D6A] via-[#6D8C5A] to-[#C17F59] overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-40 right-40 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-white/20 rounded-full" />
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
              Start your learning journey today
            </h1>
            <p className="text-white/80 text-lg leading-relaxed">
              Join thousands of students who have transformed their learning experience with personalized tutoring from expert educators.
            </p>
          </div>
          
          <div className="space-y-4 mt-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Expert Tutors</h3>
                <p className="text-white/70 text-sm">Learn from qualified professionals</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Leaf className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Personalized Learning</h3>
                <p className="text-white/70 text-sm">Tailored to your goals</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Learn Anywhere</h3>
                <p className="text-white/70 text-sm">Flexible scheduling for your lifestyle</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
        {/* Background Effects */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-[#7D9D6A]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-[#C17F59]/5 rounded-full blur-3xl" />
        
        <div className="w-full max-w-lg relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-[#C17F59] to-[#7D9D6A] rounded-xl flex items-center justify-center text-white font-bold">
              C
            </div>
            <span className="text-xl font-bold text-[#5C5C5C]">Chattri</span>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#7D9D6A]/10 rounded-full mb-4">
              <Sparkles className="h-4 w-4 text-[#7D9D6A]" />
              <span className="text-sm font-medium text-[#7D9D6A]">Join Chattri</span>
            </div>
            <h2 className="text-3xl font-bold text-[#5C5C5C] mb-2">Create Account</h2>
            <p className="text-muted-foreground">Start your learning journey today</p>
          </div>

          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl shadow-[#7D9D6A]/5">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-[#5C5C5C] font-medium">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="firstName"
                        placeholder="John"
                        className="pl-10 border-[#7D9D6A]/20 focus:border-[#7D9D6A] focus:ring-[#7D9D6A]/20"
                        {...register('firstName')}
                      />
                    </div>
                    {errors.firstName && (
                      <p className="text-sm text-red-500">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-[#5C5C5C] font-medium">Last Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        className="pl-10 border-[#7D9D6A]/20 focus:border-[#7D9D6A] focus:ring-[#7D9D6A]/20"
                        {...register('lastName')}
                      />
                    </div>
                    {errors.lastName && (
                      <p className="text-sm text-red-500">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#5C5C5C] font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10 border-[#7D9D6A]/20 focus:border-[#7D9D6A] focus:ring-[#7D9D6A]/20"
                      {...register('email')}
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
                      className="pl-10 border-[#7D9D6A]/20 focus:border-[#7D9D6A] focus:ring-[#7D9D6A]/20"
                      {...register('password')}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeZone" className="text-[#5C5C5C] font-medium">Time Zone</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="timeZone"
                      placeholder="America/New_York"
                      className="pl-10 border-[#7D9D6A]/20 focus:border-[#7D9D6A] focus:ring-[#7D9D6A]/20"
                      {...register('timeZone')}
                    />
                  </div>
                  {errors.timeZone && (
                    <p className="text-sm text-red-500">{errors.timeZone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experienceLevel" className="text-[#5C5C5C] font-medium">Experience Level</Label>
                  <Select onValueChange={setExperienceLevel}>
                    <SelectTrigger className="border-[#7D9D6A]/20 focus:border-[#7D9D6A] focus:ring-[#7D9D6A]/20">
                      <SelectValue placeholder="Select your level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="learningGoals" className="text-[#5C5C5C] font-medium">Learning Goals (Optional)</Label>
                  <Input
                    id="learningGoals"
                    placeholder="What do you want to achieve?"
                    className="border-[#7D9D6A]/20 focus:border-[#7D9D6A] focus:ring-[#7D9D6A]/20"
                    {...register('learningGoals')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-[#5C5C5C] font-medium">Bio (Optional)</Label>
                  <Input
                    id="bio"
                    placeholder="Tell us about yourself"
                    className="border-[#7D9D6A]/20 focus:border-[#7D9D6A] focus:ring-[#7D9D6A]/20"
                    {...register('bio')}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#7D9D6A] hover:bg-[#6D8C5A] text-white h-11 rounded-xl hover-lift"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Create Account <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-[#7D9D6A] hover:text-[#6D8C5A] font-semibold transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}