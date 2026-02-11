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
      dateOfBirth: new Date("1985-05-15"),
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

  for (const u of users) {
    await prisma.user.create({ data: u });
  }
  console.log("✅ Users created");

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
  // Example: 5 sessions per studio, 1 hour apart starting tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0); // 9:00 AM

  const sessionDurationMs = 60 * 60 * 1000; // 1 hour

  for (let s = 0; s < 5; s++) {
    const start = new Date(tomorrow.getTime() + s * sessionDurationMs);
    const end = new Date(start.getTime() + sessionDurationMs);

    await prisma.session.create({
      data: {
        studioId: studio1.id,
        startAt: start,
        endAt: end,
      },
    });

    await prisma.session.create({
      data: {
        studioId: studio2.id,
        startAt: start,
        endAt: end,
      },
    });
  }

  console.log("✅ Sessions created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
