import type { CvData, CvLinks } from './cvTypes'

/** CV de ejemplo (ficticio). La plantilla visual es fija; el contenido lo reemplaza el usuario. */
export const EXAMPLE_CV: CvData = {
  name: 'Ana Sofía Ruiz Mendoza',
  location: 'Bogotá, Colombia',
  phone: '+57 300 123 4567',
  email: 'ana.ruiz.ejemplo@email.com',
  portfolioLabel: 'Portafolio web',
  linkedinLabel: 'Linkedin/AnaRuiz',
  links: {
    phoneUrl: 'https://wa.me/573001234567',
    emailUrl: 'mailto:ana.ruiz.ejemplo@email.com',
    portfolioUrl: 'https://example.com/portfolio',
    linkedinUrl: 'https://www.linkedin.com/in/ejemplo-ana-ruiz/',
  },
  summary:
    '**Desarrolladora Full Stack** con **3 años** de experiencia en **React**, **TypeScript** y **Node.js**. Enfocada en productos web escalables, **APIs REST** y buenas prácticas de **Clean Architecture**. Experiencia con bases de datos relacionales, despliegues en la nube y trabajo colaborativo en equipos ágiles.',
  experience: [
    {
      company: 'NovaTech Labs',
      role: 'Desarrolladora Full Stack',
      location: 'Bogotá, Colombia',
      dates: 'Marzo 2023 - Presente',
      bullets: [
        '**Desarrollé** features de producto en **React** y **TypeScript**, mejorando la experiencia de usuarios internos y externos.',
        '**Implementé** servicios **backend** en **Node.js** con **APIs REST**, integrando autenticación y control de acceso.',
        '**Optimicé** consultas y flujos de datos, reduciendo tiempos de respuesta en módulos críticos del sistema.',
        '**Colaboré** con diseño y producto en sprints ágiles, documentando componentes y criterios de aceptación.',
      ],
    },
    {
      company: 'Orbit Soft',
      role: 'Desarrolladora Frontend',
      location: 'Remoto, Colombia',
      dates: 'Enero 2022 - Febrero 2023',
      bullets: [
        '**Construí** interfaces responsivas con **React** y **Vue.js** para dashboards operativos.',
        '**Integré** consumos de **APIs** y estados de carga/error consistentes en la aplicación.',
        '**Apliqué** control de versiones con **Git** y revisiones de código para mantener calidad del frontend.',
        '**Aporté** mejoras de accesibilidad y performance en páginas de alto tráfico interno.',
      ],
    },
  ],
  education: [
    {
      school: 'Universidad Ejemplo',
      degree: 'Ingeniería de Sistemas',
      location: 'Bogotá, Colombia',
      date: 'Diciembre 2022',
    },
  ],
  skills: [
    { label: 'Frontend', value: 'React, TypeScript, Vue.js, Javascript' },
    {
      label: 'Backend',
      value: 'Node.js, APIs REST, PostgreSQL, Clean Architecture',
    },
    { label: 'Herramientas', value: 'Git, Docker, AWS' },
  ],
}

/** @deprecated Usar EXAMPLE_CV — se mantiene el alias por compatibilidad interna. */
export const QUEEN_CV = EXAMPLE_CV

export function buildCvLinks(input: {
  phone: string
  email: string
  portfolioUrl?: string
  linkedinUrl?: string
}): CvLinks {
  const digits = input.phone.replace(/\D/g, '')
  return {
    phoneUrl: digits ? `https://wa.me/${digits}` : '#',
    emailUrl: input.email.trim() ? `mailto:${input.email.trim()}` : '#',
    portfolioUrl: input.portfolioUrl?.trim() || EXAMPLE_CV.links.portfolioUrl,
    linkedinUrl: input.linkedinUrl?.trim() || EXAMPLE_CV.links.linkedinUrl,
  }
}

export function cvFileName(cv: CvData): string {
  const slug =
    cv.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '') || 'CV'
  return `CV_${slug}.pdf`
}

export function cvDataToPlainText(cv: CvData): string {
  const strip = (s: string) => s.replace(/\*\*/g, '')
  const lines: string[] = [
    cv.name,
    `${cv.location} · ${cv.phone} · ${cv.email} · ${cv.portfolioLabel} · ${cv.linkedinLabel}`,
    strip(cv.summary),
    '',
    'EXPERIENCIA PROFESIONAL',
  ]

  for (const job of cv.experience) {
    lines.push(job.company)
    lines.push(job.role)
    lines.push(job.location)
    lines.push(job.dates)
    for (const bullet of job.bullets) {
      lines.push(`● ${strip(bullet)}`)
    }
  }

  lines.push('', 'EDUCACIÓN')
  for (const edu of cv.education) {
    lines.push(edu.school)
    lines.push(edu.degree)
    lines.push(edu.location)
    lines.push(edu.date)
  }

  lines.push('', 'SKILLS ADICIONALES')
  for (const skill of cv.skills) {
    lines.push(`● ${skill.label}: ${skill.value}`)
  }

  return lines.join('\n')
}
