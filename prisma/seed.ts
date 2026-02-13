// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ----- USERS -----
  const users = [
    {
      email: "mike@example.com",
      firstName: "Mike",
      lastName: "Delez",
      dateOfBirth: new Date("1993-10-10"),
      shoeSize: 42,
      instructor: false,
      admin: true,
    },
    {
      email: "bettina@example.com",
      firstName: "Bettina",
      lastName: "Tetz",
      dateOfBirth: new Date("1990-05-17"),
      shoeSize: 38,
      instructor: true,
      admin: true,
    },
    {
      email: "bob@example.com",
      firstName: "Bob",
      lastName: "Smith",
      dateOfBirth: new Date("1990-03-20"),
      shoeSize: 40,
      instructor: false,
      admin: false,
    },
  ];

  // create users and capture them
  const createdUsers: Record<string, typeof users[0] & { id: string }> = {};

  for (const u of users) {
    const user = await prisma.user.create({ data: u });
    createdUsers[u.firstName.toLowerCase()] = user; // store by firstName
  }

  console.log("✅ Users created");

  const bettinaId = createdUsers['bettina'].id;

  // ----- STUDIOS -----
  const studio1 = await prisma.studio.create({
    data: { studioNumber: 1, name: "Cyclo Basel" },
  });

  const studio2 = await prisma.studio.create({
    data: { studioNumber: 2, name: "Cyclo Oerlikon" },
  });

  console.log("✅ Studios created");

  // ----- BIKES -----
  const bikesPerStudio = 25;
  for (let i = 1; i <= bikesPerStudio; i++) {
    await prisma.bike.create({
      data: { studioId: studio1.id, bikeNumber: i },
    });
    await prisma.bike.create({
      data: { studioId: studio2.id, bikeNumber: i },
    });
  }

  console.log("✅ Bikes created");

  // ----- SESSIONS -----
  const session1Start = new Date(2026, 7, 5, 19);
  const session1End = new Date(2026, 7, 5, 19, 50);
  const session2Start = new Date(2026, 7, 6, 18);
  const session2End = new Date(2026, 7, 6, 18, 50);

  await prisma.session.create({
    data: {
      studioId: studio1.id,
      startAt: session1Start,
      endAt: session1End,
      instructorId: bettinaId,
      name: '90s ride',
      description: 'best ride of your life'
    },
  });

  await prisma.session.create({
    data: {
      studioId: studio2.id,
      startAt: session2Start,
      endAt: session2End,
      instructorId: bettinaId,
      name: '80s ride',
      description: 'ride or die'
    },
  });

  console.log("✅ Sessions created");
}

main()
  .catch((e) => {
    console.error(e);
    // fuck this figure it out later
    // eslint-disable-next-line no-undef
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
