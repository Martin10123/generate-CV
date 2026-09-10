export type RichText = string // usa **negrita** para resaltar palabras clave

export type CvLinks = {
  phoneUrl: string
  emailUrl: string
  portfolioUrl: string
  linkedinUrl: string
}

export type CvJob = {
  company: string
  role: string
  location: string
  dates: string
  bullets: RichText[]
}

export type CvEducation = {
  school: string
  degree: string
  location: string
  date: string
}

export type CvSkill = {
  label: string
  value: string
}

export type CvData = {
  name: string
  location: string
  phone: string
  email: string
  portfolioLabel: string
  linkedinLabel: string
  links: CvLinks
  summary: RichText
  experience: CvJob[]
  education: CvEducation[]
  skills: CvSkill[]
}
