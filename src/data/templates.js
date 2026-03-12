export const TEMPLATES = {
  email: {
    job: { 
      build: (name) => `Hi ${name} Team,\n\n[AI_HOOK]\n\nI'm Devdeep, a final-year B.Tech CSE student who sits somewhere between a designer and a developer.\n\nWhile most developers focus only on code, I enjoy building experiences where visuals, interaction, and storytelling are just as important as functionality. I work on creative web projects, interactive UI concepts, and design-driven builds where aesthetics and logic meet.\n\nPortfolio:\nhttps://devdeepsahaportfolio.vercel.app/\n\nIf this aligns with what your team is building, I'd genuinely love to connect.\n\nThanks,\nDevdeep Saha` 
    },
    build: { 
      build: (name) => `Hi ${name} Team,\n\n[AI_HOOK]\n\nI'm Devdeep, a creative developer focused on building modern, performance-driven web experiences.\n\nI wanted to share my portfolio in case you're exploring design or development support:\nhttps://devwebstudio.vercel.app/\n\nIf at any point you're considering revamping your website or improving the user experience, I'd be happy to help. I work on clean UI systems, responsive layouts, and structured builds that balance aesthetics with performance.\n\nBest regards,\nDevdeep Saha` 
    },
    build_plus: { 
      build: (name) => `Hi ${name} Team,\n\n[AI_HOOK]\n\nI'm Devdeep, a developer specializing in structured, performance-optimized websites.\n\nTo demonstrate the kind of work I do, I drafted a quick homepage concept tailored specifically to your brand — see the attached image. It is just a visual direction idea, but I believe it improves clarity and hierarchy while keeping things modern.\n\nYou can view more of my work here:\nhttps://devwebstudio.vercel.app/\n\nIf you are open to discussing a revamp, I would be happy to explore this further.\n\nBest regards,\nDevdeep Saha` 
    }
  },
  whatsapp: {
    // Keep WhatsApp simple as it's a chat interface
    job: {
      build: (name) => `Hi ${name} team \n\n[AI_HOOK]\n\nI'm Devdeep — a developer who builds design-focused websites. Saw your work and wanted to reach out.\n\nPortfolio: https://devdeepsahaportfolio.vercel.app/`
    },
    build: {
      build: (name) => `Hi ${name} \n\n[AI_HOOK]\n\nI'm Devdeep, a developer who builds simple modern websites for businesses. If you plan to make one, I would be happy to help.\n\nPortfolio: https://devwebstudio.vercel.app/`
    },
    build_plus: {
      build: (name) => `Hi ${name} \n\n[AI_HOOK]\n\nI'm Devdeep, a web developer. I tried redesigning your homepage concept for fun — sending it here, thought you might like the idea.\n\nPortfolio: https://devwebstudio.vercel.app/`
    }
  }
};