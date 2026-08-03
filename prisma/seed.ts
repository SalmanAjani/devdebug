import 'dotenv/config';
import { TechCategory } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';

const technologies = [
  // Frontend
  { name: 'React', slug: 'react', category: TechCategory.FRONTEND },
  { name: 'Next.js', slug: 'nextjs', category: TechCategory.FRONTEND },
  { name: 'TypeScript', slug: 'typescript', category: TechCategory.FRONTEND },
  { name: 'Tailwind CSS', slug: 'tailwindcss', category: TechCategory.FRONTEND },
  // Backend
  { name: 'Node.js', slug: 'nodejs', category: TechCategory.BACKEND },
  { name: 'Spring Boot', slug: 'spring-boot', category: TechCategory.BACKEND },
  { name: 'Express', slug: 'express', category: TechCategory.BACKEND },
  { name: 'Python', slug: 'python', category: TechCategory.BACKEND },
  // Database
  { name: 'PostgreSQL', slug: 'postgresql', category: TechCategory.DATABASE },
  { name: 'Prisma', slug: 'prisma', category: TechCategory.DATABASE },
  { name: 'Redis', slug: 'redis', category: TechCategory.DATABASE },
  { name: 'MongoDB', slug: 'mongodb', category: TechCategory.DATABASE },
  // DevOps
  { name: 'Docker', slug: 'docker', category: TechCategory.DEVOPS },
  { name: 'Kubernetes', slug: 'kubernetes', category: TechCategory.DEVOPS },
  { name: 'GitHub Actions', slug: 'github-actions', category: TechCategory.DEVOPS },
  { name: 'Vercel', slug: 'vercel', category: TechCategory.DEVOPS },
  // AI
  { name: 'OpenAI', slug: 'openai', category: TechCategory.AI },
  { name: 'LangChain', slug: 'langchain', category: TechCategory.AI },
];

async function main() {
  console.log('Seeding technologies...');

  // Upsert on `slug` — a single non-null unique column, so re-running is safe.
  for (const tech of technologies) {
    await prisma.technology.upsert({
      where: { slug: tech.slug },
      update: { name: tech.name, category: tech.category },
      create: tech,
    });
  }

  console.log(`Seeded ${technologies.length} technologies.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
