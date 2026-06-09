import 'dotenv/config';
import { PrismaClient, Role, ProjectCategory, Urgency } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PASSWORD = 'Password123!';

async function main() {
  console.log('🌱  Seeding database…');
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  // Clean slate (dev only).
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.projectMedia.deleteMany();
  await prisma.project.deleteMany();
  await prisma.token.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  // --- Admin ---
  await prisma.user.create({
    data: {
      email: 'admin@homepro.local',
      passwordHash,
      role: Role.ADMIN,
      emailVerified: true,
      profile: { create: { name: 'Platform Admin' } },
    },
  });

  // --- Homeowners ---
  const homeowner = await prisma.user.create({
    data: {
      email: 'homeowner@homepro.local',
      passwordHash,
      role: Role.HOMEOWNER,
      emailVerified: true,
      profile: { create: { name: 'Jamie Rivera', city: 'Austin', zip: '78701' } },
    },
  });

  // --- Contractors ---
  const contractor1 = await prisma.user.create({
    data: {
      email: 'contractor@homepro.local',
      passwordHash,
      role: Role.CONTRACTOR,
      emailVerified: true,
      profile: {
        create: {
          name: 'Sam Carpenter',
          businessName: 'Carpenter & Sons Plumbing',
          licenseNum: 'TX-PLB-44821',
          bio: '20+ years of licensed plumbing and remodeling work across central Texas.',
          serviceRadiusMiles: 40,
          categories: [ProjectCategory.PLUMBING, ProjectCategory.REMODELING],
          city: 'Austin',
          zip: '78704',
          ratingAvg: 4.8,
          ratingCount: 12,
        },
      },
    },
  });

  const contractor2 = await prisma.user.create({
    data: {
      email: 'contractor2@homepro.local',
      passwordHash,
      role: Role.CONTRACTOR,
      emailVerified: true,
      profile: {
        create: {
          name: 'Dana Volt',
          businessName: 'BrightSpark Electric',
          licenseNum: 'TX-ELC-99120',
          bio: 'Residential electrical specialists. Fast, clean, code-compliant work.',
          serviceRadiusMiles: 25,
          categories: [ProjectCategory.ELECTRICAL],
          city: 'Round Rock',
          zip: '78664',
          ratingAvg: 4.6,
          ratingCount: 7,
        },
      },
    },
  });

  // --- Open project with bids ---
  const leak = await prisma.project.create({
    data: {
      homeownerId: homeowner.id,
      title: 'Leaking kitchen faucet & under-sink damage',
      description:
        'The kitchen faucet has been dripping for weeks and there’s now water damage to the cabinet base. Need the faucet replaced and the leak fully resolved.',
      category: ProjectCategory.PLUMBING,
      urgency: Urgency.WITHIN_WEEK,
      budgetMin: 300,
      budgetMax: 900,
      city: 'Austin',
      zip: '78701',
    },
  });

  await prisma.bid.create({
    data: {
      projectId: leak.id,
      contractorId: contractor1.id,
      amount: 650,
      startDate: new Date(Date.now() + 2 * 86400000),
      completionDate: new Date(Date.now() + 4 * 86400000),
      proposalText:
        'I’ll replace the faucet with a quality fixture, repair the supply line, and treat the cabinet base. Includes parts and labor with a 1-year warranty.',
    },
  });

  await prisma.message.create({
    data: {
      projectId: leak.id,
      senderId: contractor1.id,
      receiverId: homeowner.id,
      body: 'Hi Jamie — happy to take a look. Is the shutoff valve under the sink working?',
    },
  });

  // --- A second open project ---
  await prisma.project.create({
    data: {
      homeownerId: homeowner.id,
      title: 'Install ceiling fans in 3 bedrooms',
      description: 'Need three ceiling fans installed where light fixtures currently are. Fans already purchased.',
      category: ProjectCategory.ELECTRICAL,
      urgency: Urgency.FLEXIBLE,
      requestQuotes: true,
      city: 'Austin',
      zip: '78701',
    },
  });

  // --- A completed project with a review ---
  const completed = await prisma.project.create({
    data: {
      homeownerId: homeowner.id,
      title: 'Repaint master bedroom',
      description: 'Two-coat repaint of master bedroom, neutral color. Walls in good condition.',
      category: ProjectCategory.PAINTING,
      urgency: Urgency.FLEXIBLE,
      budgetMin: 400,
      budgetMax: 800,
      city: 'Austin',
      zip: '78701',
      status: 'COMPLETED',
      homeownerDone: true,
      contractorDone: true,
    },
  });
  const winningBid = await prisma.bid.create({
    data: {
      projectId: completed.id,
      contractorId: contractor2.id,
      amount: 600,
      status: 'ACCEPTED',
      startDate: new Date(Date.now() - 10 * 86400000),
      completionDate: new Date(Date.now() - 3 * 86400000),
      proposalText: 'Two coats premium paint, all prep and cleanup included.',
    },
  });
  await prisma.project.update({ where: { id: completed.id }, data: { acceptedBidId: winningBid.id } });
  await prisma.review.create({
    data: {
      projectId: completed.id,
      reviewerId: homeowner.id,
      revieweeId: contractor2.id,
      rating: 5,
      comment: 'Fantastic work — punctual, tidy, and the room looks great.',
    },
  });

  console.log('✅  Seed complete.\n');
  console.log('Demo accounts (password for all: ' + PASSWORD + ')');
  console.log('  Admin:       admin@homepro.local');
  console.log('  Homeowner:   homeowner@homepro.local');
  console.log('  Contractor:  contractor@homepro.local');
  console.log('  Contractor:  contractor2@homepro.local');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
