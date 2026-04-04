'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { studentsApi, usersApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useStudent } from '../StudentContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User, Mail, Phone, Globe, BookOpen, Target, GraduationCap } from 'lucide-react'

export default function StudentProfilePage() {
  const router = useRouter()
  const { isAuthenticated, user, refreshUser, isLoading: authLoading } = useAuth()
  const { student, refreshStudent } = useStudent()

  const [bio, setBio] = useState<string>('')
  const [learningGoals, setLearningGoals] = useState<string>('')
  const [preferredLanguages, setPreferredLanguages] = useState<string>('')
  const [experienceLevel, setExperienceLevel] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [timeZone, setTimeZone] = useState<string>('')
  const [firstName, setFirstName] = useState<string>('')
  const [lastName, setLastName] = useState<string>('')
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const redirectIfNeeded = useCallback(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    redirectIfNeeded()
  }, [redirectIfNeeded])

  useEffect(() => {
    if (student) {
      setBio(student.bio || '')
      setLearningGoals(student.learningGoals || '')
      setPreferredLanguages((student.preferredLanguages || []).join(', '))
      setExperienceLevel(student.experienceLevel || '')
    }
  }, [student])

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '')
      setLastName(user.lastName || '')
      setEmail(user.email || '')
      setTimeZone(user.timeZone || '')
      setAvatarUrl(user.avatarUrl || '')
      setPhone((user.phone as string) || '')
    }
  }, [user])

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  }

  const onSave = async () => {
    if (!user) return
    if (!student) {
      setError('Student data not loaded')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const studentPayload: any = {}
      studentPayload.bio = bio
      studentPayload.learningGoals = learningGoals
      studentPayload.preferredLanguages = preferredLanguages.split(',').map(s => s.trim()).filter(Boolean)
      studentPayload.experienceLevel = experienceLevel || null

      await studentsApi.updateStudentById(student.id, studentPayload)

      const userPayload: any = {}
      if (firstName) userPayload.firstName = firstName
      if (lastName) userPayload.lastName = lastName
      if (email) userPayload.email = email
      if (phone) userPayload.phone = phone
      if (timeZone) userPayload.timeZone = timeZone
      if (avatarUrl) userPayload.avatarUrl = avatarUrl

      if (Object.keys(userPayload).length > 0) {
        await usersApi.updateMe(userPayload)
        await refreshUser()
      }

      await refreshStudent()

      setToast('Profile updated')
      setTimeout(() => setToast(null), 1800)
    } catch (err: any) {
      console.error('Failed to update student profile', err)
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.')
      } else {
        setError(err.response?.data?.error || 'Failed to update profile')
      }
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FAF6F1] via-[#FDFCFA] to-[#F5F0E8]" />
        <div className="relative flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C17F59]"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-gradient-to-br from-[#FAF6F1] via-[#FDFCFA] to-[#F5F0E8]" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-[#C17F59]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-20 left-0 w-80 h-80 bg-[#7D9D6A]/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3" />
      
      <div className="relative container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C17F59]/10 rounded-full mb-4">
            <User className="h-4 w-4 text-[#C17F59]" />
            <span className="text-sm font-medium text-[#C17F59]">Your Profile</span>
          </div>
          <h1 className="text-4xl font-bold text-[#5C5C5C]">My Profile</h1>
          <p className="text-[#5C5C5C]/70">View and edit your student profile information</p>
        </div>

        <Card className="max-w-3xl mx-auto border-0 bg-white/60 backdrop-blur-sm organic-shadow">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20 border-4 border-[#C17F59]/20">
                <AvatarFallback className="bg-gradient-to-br from-[#C17F59] to-[#7D9D6A] text-white text-2xl">
                  {getInitials(firstName, lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl text-[#5C5C5C]">{firstName} {lastName}</CardTitle>
                <CardDescription className="text-[#5C5C5C]/70">Student Account</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Personal Info Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#5C5C5C] flex items-center gap-2">
                  <User className="h-5 w-5 text-[#C17F59]" /> Personal Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-[#5C5C5C]">First Name</Label>
                    <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="border-[#C17F59]/20 focus:border-[#C17F59] focus:ring-[#C17F59]/20 bg-white/80" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-[#5C5C5C]">Last Name</Label>
                    <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="border-[#C17F59]/20 focus:border-[#C17F59] focus:ring-[#C17F59]/20 bg-white/80" />
                  </div>
                </div>
              </div>

              {/* Contact Info Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#5C5C5C] flex items-center gap-2">
                  <Mail className="h-5 w-5 text-[#7D9D6A]" /> Contact Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#5C5C5C]">Email</Label>
                    <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="border-[#7D9D6A]/20 focus:border-[#7D9D6A] focus:ring-[#7D9D6A]/20 bg-white/80" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[#5C5C5C]">Phone</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="border-[#7D9D6A]/20 focus:border-[#7D9D6A] focus:ring-[#7D9D6A]/20 bg-white/80" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="timeZone" className="text-[#5C5C5C]">Time Zone</Label>
                    <Input id="timeZone" value={timeZone} onChange={(e) => setTimeZone(e.target.value)} className="border-[#7D9D6A]/20 focus:border-[#7D9D6A] focus:ring-[#7D9D6A]/20 bg-white/80" />
                  </div>
                </div>
              </div>

              {/* Learning Info Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#5C5C5C] flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[#D4A853]" /> Learning Information
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-[#5C5C5C]">Bio</Label>
                    <textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full px-3 py-2 border border-[#D4A853]/20 rounded-lg focus:border-[#D4A853] focus:ring-[#D4A853]/20 bg-white/80 min-h-[100px]"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="learningGoals" className="text-[#5C5C5C]">Learning Goals</Label>
                    <textarea
                      id="learningGoals"
                      value={learningGoals}
                      onChange={(e) => setLearningGoals(e.target.value)}
                      className="w-full px-3 py-2 border border-[#D4A853]/20 rounded-lg focus:border-[#D4A853] focus:ring-[#D4A853]/20 bg-white/80 min-h-[100px]"
                      placeholder="What do you want to achieve?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferredLanguages" className="text-[#5C5C5C]">Preferred Languages (comma separated)</Label>
                    <Input id="preferredLanguages" value={preferredLanguages} onChange={(e) => setPreferredLanguages(e.target.value)} className="border-[#D4A853]/20 focus:border-[#D4A853] focus:ring-[#D4A853]/20 bg-white/80" placeholder="English, Spanish, French" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experienceLevel" className="text-[#5C5C5C]">Experience Level</Label>
                    <select id="experienceLevel" value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} className="w-full px-3 py-2 border border-[#D4A853]/20 rounded-lg focus:border-[#D4A853] focus:ring-[#D4A853]/20 bg-white/80">
                      <option value="">Select</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">{error}</div>
              )}

              <div className="flex gap-3 pt-4">
                <Button onClick={onSave} disabled={loading} className="bg-[#C17F59] hover:bg-[#B3714F]">
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={() => router.push('/student/dashboard')} className="border-[#7D9D6A]/20 text-[#7D9D6A] hover:bg-[#7D9D6A]/5">
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {toast && (
          <div className="fixed bottom-6 right-6 bg-[#7D9D6A] text-white px-6 py-3 rounded-xl shadow-lg organic-shadow">
            {toast}
          </div>
        )}
      </div>
    </div>
  )
}