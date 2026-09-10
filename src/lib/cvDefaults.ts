import type { CvData } from './cvTypes'

/** Plantilla reina — estructura fija. Solo cambia el texto al adaptar. */
export const QUEEN_CV: CvData = {
  name: 'Martin Elias Simarra Salgado',
  location: 'Cartagena, Colombia',
  phone: '+57 301 862 8521',
  email: 'martinsimarra4@gmail.com',
  portfolioLabel: 'Portafolio web',
  linkedinLabel: 'Linkedin/Martin',
  links: {
    phoneUrl: 'https://wa.me/3018628521',
    emailUrl: 'mailto:martinsimarra4@gmail.com',
    portfolioUrl: 'https://portafolio-web-sandy.vercel.app/',
    linkedinUrl: 'https://www.linkedin.com/in/martinsimarrapro/',
  },
  summary:
    '**Desarrollador Full Stack** con **3 años** de experiencia especializado en **C#/.NET** para la construcción de sistemas empresariales. Especializado en Desarrollo Full Stack con **C#/.NET**, y **React**, integración de **APIs REST** y arquitecturas basadas en **microservicios**. Experiencia desarrollando SPAs y **backend** escalables, aplicando **Clean Architecture**, principios **SOLID** y buenas prácticas modernas, trabajando con **bases de datos** relacionales y **NoSQL** e integrando procesos de **CI/CD**.',
  experience: [
    {
      company: 'COTECMAR',
      role: 'Desarrollador Full Stack',
      location: 'Cartagena, Colombia',
      dates: 'Mayo 2024 - Julio 2026',
      bullets: [
        '**Diseñé** y **desarrollé** sistemas internos empresariales utilizando **.NET** en **backend** y **React** en **frontend** para la gestión de procesos administrativos y operativos.',
        '**Optimicé flujos** de trabajo internos mediante la automatización y centralización de procesos, logrando un incremento superior al **40%** en la eficiencia operativa de los equipos.',
        '**Lideré** el desarrollo del **Portal de Empleado** y del **sistema de Gestión Administrativa**, utilizados por personal interno para la gestión de información laboral y procesos administrativos.',
        '**Implementé** una arquitectura basada en **microservicios** utilizando **.NET, Nodejs y React**, facilitando la escalabilidad del sistema y la integración entre módulos independientes.',
      ],
    },
    {
      company: 'Saroa',
      role: 'Desarrollador Full Stack',
      location: 'Cartagena, Colombia',
      dates: 'Octubre 2025 – Febrero 2026',
      bullets: [
        'Contratado como **Desarrollador Full Stack remoto** para apoyar la finalización de un proyecto crítico para una entidad del **Gobierno Colombiano** con fecha límite contractual, entregando módulos funcionales dentro del plazo establecido.',
        '**Desarrollé** módulos **frontend** en **Vuejs** y **React** que permitieron completar funcionalidades clave del sistema y cumplir los hitos de entrega definidos en el proyecto.',
        '**Implementé** y mantuve servicios **backend** en **.NET, Nodejs** dentro de una **arquitectura** de **microservicios**, desarrollando **endpoints REST** y gestionando la comunicación entre módulos del sistema.',
        '**Apliqué** principios de **código limpio** y separación de responsabilidades para facilitar el mantenimiento del sistema y la incorporación de nuevos desarrolladores al proyecto.',
      ],
    },
  ],
  education: [
    {
      school: 'Tecnológico Comfenalco',
      degree: 'Ingeniería de Sistemas - Tecnólogo en Desarrollo de Software',
      location: 'Cartagena, Colombia',
      date: 'Abril 2025',
    },
  ],
  skills: [
    { label: 'Frontend', value: 'React, Vuejs, TypeScript, Javascript' },
    {
      label: 'Backend',
      value: 'C#, .NET, Nodejs, MySQL, Microservicios, Clean Architecture, REST',
    },
    { label: 'Herramientas', value: 'Git, Docker, Azure' },
  ],
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
