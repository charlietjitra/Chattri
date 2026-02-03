'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { studentsApi, usersApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useStudent } from '../StudentContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function StudentProfilePage() {
  const router = useRouter()
  const { isAuthenticated, user, refreshUser, isLoading } = useAuth()
  const { student, refreshStudent } = useStudent()
  console.log(student)
  console.log(user)
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

  useEffect(() => {
    // wait until auth finishes loading; then redirect if not authenticated
    if (!isLoading && !isAuthenticated) router.push('/login')
  }, [isLoading, isAuthenticated])

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

      // update student-specific data
      await studentsApi.updateStudentById(student.id, studentPayload)

      // update user-level data (email/phone/timeZone) via usersApi
    const userPayload: any = {}
    if (firstName) userPayload.firstName = firstName
    if (lastName) userPayload.lastName = lastName
    if (email) userPayload.email = email
    if (phone) userPayload.phone = phone
    if (timeZone) userPayload.timeZone = timeZone
    if (avatarUrl) userPayload.avatarUrl = avatarUrl

      if (Object.keys(userPayload).length > 0) {
        await usersApi.updateMe(userPayload)
        // refresh auth user in context so navbar/current user updates
        await refreshUser()
      }

      // Refresh student context
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

  // while auth is loading, don't render the page (prevents showing stale data)
  if (isLoading) return null
  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
            <CardDescription>View and edit your student profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <Label htmlFor="learningGoals">Learning goals</Label>
                <textarea
                  id="learningGoals"
                  value={learningGoals}
                  onChange={(e) => setLearningGoals(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <Label htmlFor="preferredLanguages">Preferred languages (comma separated)</Label>
                <Input id="preferredLanguages" value={preferredLanguages} onChange={(e) => setPreferredLanguages(e.target.value)} />
              </div>

              <div>
                <Label htmlFor="experienceLevel">Experience level</Label>
                <select id="experienceLevel" value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} className="w-full px-3 py-2 border rounded-md">
                  <option value="">Select</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>

              <div>
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>

              {/* <div>
                <Label htmlFor="avatarUrl">Avatar URL</Label>
                <Input id="avatarUrl" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
              </div> */}

              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <div>
                <Label htmlFor="timeZone">Time zone</Label>
                <Input id="timeZone" value={timeZone} onChange={(e) => setTimeZone(e.target.value)} />
              </div>

              {error && <div className="text-red-600">{error}</div>}

              <div className="flex gap-2">
                <Button onClick={onSave} disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
                <Button variant="outline" onClick={() => router.push('/student/tutors')}>Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {toast && (
          <div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-2 rounded shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </div>
  )
}
