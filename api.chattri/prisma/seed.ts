import { db } from '../src/lib/db.js'
import { hashPassword } from '../src/utils/auth.js'
import { generateUserId, generateId } from '../src/utils/id-generator.js'

// Seed data configuration
const SEED_DATA = {
  admins: [
    {
      email: 'admin@chattri.com',
      password: '123456',
      firstName: 'Admin',
      lastName: 'User',
      timeZone: 'UTC'
    },
    {
      email: 'superadmin@chattri.com',
      password: 'SuperAdmin123',
      firstName: 'Super',
      lastName: 'Admin',
      timeZone: 'UTC'
    },
    {
      email: 'operation@chattri.com',
      password: 'Operation123',
      firstName: 'Operation',
      lastName: 'Manager',
      timeZone: 'UTC'
    }
  ],
  
  tutors: [
    {
      email: 'tutor1@chattri.com',
      password: 'tutor123',
      firstName: 'John',
      lastName: 'Smith',
      timeZone: 'America/New_York',
      bio: 'Experienced English tutor with 10 years of teaching',
      expertise: ['English', 'Grammar', 'Writing'],
      teachingLanguages: ['English', 'Spanish'],
      videoPlatformLink: 'https://zoom.us/j/tutor1',
      yearsExperience: 10,
      education: 'Master in English Literature'
    },
    {
      email: 'tutor2@chattri.com',
      password: 'tutor123',
      firstName: 'Maria',
      lastName: 'Garcia',
      timeZone: 'Europe/Madrid',
      bio: 'Native Spanish speaker, certified DELE examiner',
      expertise: ['Spanish', 'Conversation', 'Business Spanish'],
      teachingLanguages: ['Spanish', 'English'],
      videoPlatformLink: 'https://zoom.us/j/tutor2',
      yearsExperience: 8,
      education: 'Bachelor in Spanish Linguistics'
    },
    {
      email: 'tutor3@chattri.com',
      password: 'tutor123',
      firstName: 'Wei',
      lastName: 'Chen',
      timeZone: 'Asia/Shanghai',
      bio: 'Mandarin teacher specializing in HSK preparation',
      expertise: ['Mandarin', 'HSK', 'Chinese Culture'],
      teachingLanguages: ['Mandarin', 'English'],
      videoPlatformLink: 'https://zoom.us/j/tutor3',
      yearsExperience: 5,
      education: 'Bachelor in Chinese Language Teaching'
    }
  ],

  students: [
    {
      email: 'student1@chattri.com',
      password: 'student123',
      firstName: 'Alice',
      lastName: 'Johnson',
      timeZone: 'America/Los_Angeles',
      bio: 'Learning Spanish for travel',
      learningGoals: 'Conversational fluency in Spanish within 6 months',
      preferredLanguages: ['Spanish'],
      experienceLevel: 'beginner' as const
    },
    {
      email: 'student2@chattri.com',
      password: 'student123',
      firstName: 'Bob',
      lastName: 'Williams',
      timeZone: 'Europe/London',
      bio: 'Preparing for IELTS exam',
      learningGoals: 'Score 7.5 or higher in IELTS',
      preferredLanguages: ['English'],
      experienceLevel: 'intermediate' as const
    }
  ]
}

async function createAdmin(data: typeof SEED_DATA.admins[0]) {
  // Check if admin already exists
  const existing = await db.user.findUnique({
    where: { email: data.email }
  })

  if (existing) {
    console.log(`⚠️  Admin ${data.email} already exists, skipping...`)
    return null
  }

  // Generate IDs
  const userId = generateUserId()
  const adminId = `a${generateId().slice(1)}` // a + 5 chars = 6 total

  // Hash password
  const passwordHash = await hashPassword(data.password)

  // Create admin profile
  const admin = await db.admin.create({
    data: { id: adminId }
  })

  // Create admin user
  const user = await db.user.create({
    data: {
      id: userId,
      email: data.email,
      passwordHash,
      metaType: 'admin',
      metaId: admin.id,
      firstName: data.firstName,
      lastName: data.lastName,
      timeZone: data.timeZone
    }
  })

  console.log(`✅ Admin created: ${data.email}`)
  return user
}

async function createTutor(data: typeof SEED_DATA.tutors[0]) {
  // Check if tutor already exists
  const existing = await db.user.findUnique({
    where: { email: data.email }
  })

  if (existing) {
    console.log(`⚠️  Tutor ${data.email} already exists, skipping...`)
    return null
  }

  // Generate IDs
  const userId = generateUserId()
  const tutorId = `t${generateId().slice(1)}` // t + 5 chars = 6 total

  // Hash password
  const passwordHash = await hashPassword(data.password)

  // Create tutor profile
  const tutor = await db.tutor.create({
    data: {
      id: tutorId,
      bio: data.bio,
      expertise: data.expertise,
      teachingLanguages: data.teachingLanguages,
      videoPlatformLink: data.videoPlatformLink,
      yearsExperience: data.yearsExperience,
      education: data.education
    }
  })

  // Create tutor user
  const user = await db.user.create({
    data: {
      id: userId,
      email: data.email,
      passwordHash,
      metaType: 'tutor',
      metaId: tutor.id,
      firstName: data.firstName,
      lastName: data.lastName,
      timeZone: data.timeZone
    }
  })

  // Create default 24-hour time slots for tutor
  const timeSlots = []
  for (let hour = 0; hour < 24; hour++) {
    timeSlots.push({
      id: generateId(), // Generate proper 6-char ID
      tutorId: tutor.id,
      hourStart: hour,
      isAvailable: true
    })
  }
  
  await db.tutorTimeSlot.createMany({
    data: timeSlots
  })

  console.log(`✅ Tutor created: ${data.email}`)
  return user
}

async function createStudent(data: typeof SEED_DATA.students[0]) {
  // Check if student already exists
  const existing = await db.user.findUnique({
    where: { email: data.email }
  })

  if (existing) {
    console.log(`⚠️  Student ${data.email} already exists, skipping...`)
    return null
  }

  // Generate IDs
  const userId = generateUserId()
  const studentId = `s${generateId().slice(1)}` // s + 5 chars = 6 total

  // Hash password
  const passwordHash = await hashPassword(data.password)

  // Create student profile
  const student = await db.student.create({
    data: {
      id: studentId,
      bio: data.bio,
      learningGoals: data.learningGoals,
      preferredLanguages: data.preferredLanguages,
      experienceLevel: data.experienceLevel
    }
  })

  // Create student user
  const user = await db.user.create({
    data: {
      id: userId,
      email: data.email,
      passwordHash,
      metaType: 'student',
      metaId: student.id,
      firstName: data.firstName,
      lastName: data.lastName,
      timeZone: data.timeZone
    }
  })

  console.log(`✅ Student created: ${data.email}`)
  return user
}

async function main() {
  console.log('🌱 Starting database seed...\n')

  try {
    // Seed Admins
    console.log('📌 Seeding Admins...')
    for (const adminData of SEED_DATA.admins) {
      await createAdmin(adminData)
    }
    console.log('')

    // Seed Tutors
    console.log('� Seeding Tutors...')
    for (const tutorData of SEED_DATA.tutors) {
      await createTutor(tutorData)
    }
    console.log('')

    // Seed Students
    console.log('📌 Seeding Students...')
    for (const studentData of SEED_DATA.students) {
      await createStudent(studentData)
    }
    console.log('')

    console.log('✅ Database seeding completed successfully!\n')
    console.log('📋 Summary:')
    console.log(`   - Admins: ${SEED_DATA.admins.length}`)
    console.log(`   - Tutors: ${SEED_DATA.tutors.length}`)
    console.log(`   - Students: ${SEED_DATA.students.length}`)
    console.log('\n⚠️  Default password for all test accounts: check SEED_DATA in seed.ts')
    console.log('⚠️  Please change passwords in production!')

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  } finally {
    await db.$disconnect()
  }
}

main()
