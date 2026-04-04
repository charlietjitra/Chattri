'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Calendar, Star, Leaf, ArrowRight, Sparkles, BookOpen, GraduationCap } from 'lucide-react'

const features = [
  {
    icon: GraduationCap,
    title: 'Expert Tutors',
    description: 'Learn from qualified professionals with years of teaching experience and proven track records.',
    accent: 'terracotta'
  },
  {
    icon: Calendar,
    title: 'Flexible Scheduling',
    description: 'Book sessions that adapt to your schedule. Learn anytime, anywhere at your own pace.',
    accent: 'sage'
  },
  {
    icon: BookOpen,
    title: 'Personalized Learning',
    description: 'Tailored lessons designed specifically for your unique learning goals and style.',
    accent: 'gold'
  }
]

const stats = [
  { value: '100+', label: 'Expert Tutors' },
  { value: '10K+', label: 'Sessions Completed' },
  { value: '4.9', label: 'Average Rating' },
  { value: '98%', label: 'Satisfaction Rate' }
]

export default function HomePage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FAF6F1] via-[#FDFCFA] to-[#F5F0E8] -z-10" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#C17F59]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#7D9D6A]/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3" />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C17F59]/10 rounded-full border border-[#C17F59]/20">
                <Leaf className="h-4 w-4 text-[#C17F59]" />
                <span className="text-sm font-medium text-[#C17F59]">Transform Your Learning Journey</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Find Your Perfect <span className="text-gradient-organic">Tutor</span> Match
              </h1>
              
              <p className="text-lg text-[#5C5C5C] leading-relaxed max-w-lg">
                Connect with expert tutors for personalized learning experiences. 
                Master new skills, ace your exams, and reach your goals with 
                one-on-one guidance tailored just for you.
              </p>
              
              <div className="flex flex-wrap gap-4">
                {isAuthenticated ? (
                  <Button asChild size="lg" className="bg-[#C17F59] hover:bg-[#B3714F] text-white px-8 rounded-full hover-lift">
                    <Link href="/student/tutors" className="flex items-center gap-2">
                      Browse Tutors <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild size="lg" className="bg-[#C17F59] hover:bg-[#B3714F] text-white px-8 rounded-full hover-lift">
                      <Link href="/register" className="flex items-center gap-2">
                        Start Learning <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="px-8 rounded-full border-[#7D9D6A] text-[#7D9D6A] hover:bg-[#7D9D6A]/5">
                      <Link href="/login">Sign In</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative">
              <div className="relative w-full aspect-square max-w-md mx-auto">
                {/* Decorative circles */}
                <div className="absolute inset-0 border-2 border-[#C17F59]/20 rounded-full" />
                <div className="absolute inset-8 border border-[#7D9D6A]/20 rounded-full" />
                <div className="absolute inset-16 bg-gradient-to-br from-[#C17F59]/10 to-[#7D9D6A]/10 rounded-full" />
                
                {/* Floating cards */}
                <div className="absolute top-8 right-0 glass-card p-4 rounded-2xl organic-shadow animate-[float_6s_ease-in-out_infinite]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#C17F59]/20 rounded-full flex items-center justify-center">
                      <GraduationCap className="h-5 w-5 text-[#C17F59]" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Expert Tutors</p>
                      <p className="text-xs text-muted-foreground">100+ Available</p>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-16 left-0 glass-card p-4 rounded-2xl organic-shadow animate-[float_6s_ease-in-out_infinite_1s]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#7D9D6A]/20 rounded-full flex items-center justify-center">
                      <Star className="h-5 w-5 text-[#7D9D6A]" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">4.9 Rating</p>
                      <p className="text-xs text-muted-foreground">10K+ Reviews</p>
                    </div>
                  </div>
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-32 h-32 bg-gradient-to-br from-[#C17F59] to-[#7D9D6A] rounded-full flex items-center justify-center animate-[float_6s_ease-in-out_infinite_0.5s]">
                    <span className="text-4xl font-bold text-white">C</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-[#F5F0E8]/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose Chattri?</h2>
            <p className="text-[#5C5C5C] max-w-2xl mx-auto">
              We connect you with the best tutors who are passionate about helping you succeed in your learning journey.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="group relative overflow-hidden border-0 bg-white/80 backdrop-blur-sm hover-lift organic-shadow">
                <div className={`absolute top-0 left-0 w-full h-1 ${feature.accent === 'terracotta' ? 'bg-[#C17F59]' : feature.accent === 'sage' ? 'bg-[#7D9D6A]' : 'bg-[#D4A853]'}`} />
                <CardHeader className="pb-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${feature.accent === 'terracotta' ? 'bg-[#C17F59]/10' : feature.accent === 'sage' ? 'bg-[#7D9D6A]/10' : 'bg-[#D4A853]/10'}`}>
                    <feature.icon className={`h-7 w-7 ${feature.accent === 'terracotta' ? 'text-[#C17F59]' : feature.accent === 'sage' ? 'text-[#7D9D6A]' : 'text-[#D4A853]'}`} />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#C17F59] via-[#B3714F] to-[#7D9D6A] p-12">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
            <div className="relative grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-white/80 text-sm md:text-base">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-24 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="relative bg-white rounded-3xl p-8 md:p-12 organic-shadow overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#C17F59]/5 rounded-full blur-[80px]" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#7D9D6A]/5 rounded-full blur-[60px]" />
              
              <div className="relative text-center space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold">Ready to Start Your Learning Journey?</h2>
                <p className="text-[#5C5C5C] text-lg max-w-xl mx-auto">
                  Join thousands of students who have transformed their learning experience with Chattri. 
                  Your perfect tutor is just a click away.
                </p>
                <Button asChild size="lg" className="bg-[#C17F59] hover:bg-[#B3714F] text-white px-10 rounded-full hover-lift">
                  <Link href="/register" className="flex items-center gap-2">
                    Create Your Free Account <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-sm text-muted-foreground">
                  No credit card required. Start learning in minutes.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer Teaser */}
      <section className="py-12 px-4 border-t border-[#C17F59]/10">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#C17F59] to-[#7D9D6A] rounded-lg flex items-center justify-center text-white font-bold text-sm">
                C
              </div>
              <span className="font-semibold text-lg">Chattri</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 Chattri. Connecting learners with expert tutors.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}