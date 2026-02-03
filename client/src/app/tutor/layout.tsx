// app/tutor/layout.tsx
import React from 'react'
import { TutorProvider } from './TutorContext'

export default function TutorLayout({ children }: { children: React.ReactNode }) {
  return <TutorProvider>{children}</TutorProvider>
}
