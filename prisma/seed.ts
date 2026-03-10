// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const UUIDs = {
  users: {
    mike: "7c9a1e4f-5e1d-4b6a-b6e4-9c2c3f8a1111",
    bettina: "9f4b2d73-8c6e-4c1f-9b5a-2a7d8e4f2222",
    jerry: "97300dee-fd8d-455a-adad-2d6d323edfad",
    bob: "3a8d5f62-1e4c-4c9d-a7b1-6f3e9d5c3333",
    jane: "d50abfa3-b975-472b-9f50-6c4b59e113be",
    todd: "5b38f289-e5ec-4e22-9010-fd8be54b5b31",
    sarah: "7f97ac21-97f7-4bb0-9806-bcf703b5914d",
    david: "e0392b4a-ca11-44f1-a9a9-1f9b87cadd02"
  },
  studios: {
    basel: "2d7e4c91-3b5f-4a8a-8d1e-1f2a3b4c4444",
    oerlikon: "6a3f9b28-4e1c-4d7b-b9c2-5e6f7a8b5555",
  },
  rides: {
    normal: "3a4d1734-04ba-4065-8697-51d8325c0666",
    intro: "cc15f3bb-d984-4ae0-b73c-afe2e743569c",
    event: "e6278218-5cb0-4b27-9d63-933f51b5343b",
    ride90s: "5b8e1c7a-2d4f-4c9b-a6e3-8d7f1a2b6666",
    ride80s: "8e2c6d4f-7a1b-4c5d-b9f3-2d6a7c8e7777",
  },
  bikes: {
    basel: [
      "10100000-0000-4000-8000-000000000001",
      "10200000-0000-4000-8000-000000000002",
      "10300000-0000-4000-8000-000000000003",
      "10400000-0000-4000-8000-000000000004",
      "10500000-0000-4000-8000-000000000005",
      "10600000-0000-4000-8000-000000000006",
      "10700000-0000-4000-8000-000000000007",
      "10800000-0000-4000-8000-000000000008",
      "10900000-0000-4000-8000-000000000009",
      "11000000-0000-4000-8000-000000000010",
      "11100000-0000-4000-8000-000000000011",
      "11200000-0000-4000-8000-000000000012",
      "11300000-0000-4000-8000-000000000013",
      "11400000-0000-4000-8000-000000000014",
      "11500000-0000-4000-8000-000000000015",
      "11600000-0000-4000-8000-000000000016",
      "11700000-0000-4000-8000-000000000017",
      "11800000-0000-4000-8000-000000000018",
      "11900000-0000-4000-8000-000000000019",
      "12000000-0000-4000-8000-000000000020",
      "12100000-0000-4000-8000-000000000021",
      "12200000-0000-4000-8000-000000000022",
      "12300000-0000-4000-8000-000000000023",
      "12400000-0000-4000-8000-000000000024",
      "12500000-0000-4000-8000-000000000025",
    ],
    oerlikon: [
      "20100000-0000-4000-8000-000000000001",
      "20200000-0000-4000-8000-000000000002",
      "20300000-0000-4000-8000-000000000003",
      "20400000-0000-4000-8000-000000000004",
      "20500000-0000-4000-8000-000000000005",
      "20600000-0000-4000-8000-000000000006",
      "20700000-0000-4000-8000-000000000007",
      "20800000-0000-4000-8000-000000000008",
      "20900000-0000-4000-8000-000000000009",
      "21000000-0000-4000-8000-000000000010",
      "21100000-0000-4000-8000-000000000011",
      "21200000-0000-4000-8000-000000000012",
      "21300000-0000-4000-8000-000000000013",
      "21400000-0000-4000-8000-000000000014",
      "21500000-0000-4000-8000-000000000015",
      "21600000-0000-4000-8000-000000000016",
      "21700000-0000-4000-8000-000000000017",
      "21800000-0000-4000-8000-000000000018",
      "21900000-0000-4000-8000-000000000019",
      "22000000-0000-4000-8000-000000000020",
      "22100000-0000-4000-8000-000000000021",
      "22200000-0000-4000-8000-000000000022",
      "22300000-0000-4000-8000-000000000023",
      "22400000-0000-4000-8000-000000000024",
      "22500000-0000-4000-8000-000000000025",
    ]
  }
};

async function main() {
  // ----- USERS -----
  await prisma.user.upsert({
    where: { id: UUIDs.users.mike },
    update: {},
    create: {
      id: UUIDs.users.mike,
      email: "mike@example.com",
      firstName: "Mike",
      lastName: "Delez",
      dateOfBirth: new Date("1993-10-10"),
      shoeSize: 42,
      role: 'ADMIN'
    },
  });

  await prisma.user.upsert({
    where: { id: UUIDs.users.bettina },
    update: {},
    create: {
      id: UUIDs.users.bettina,
      email: "bettina@example.com",
      firstName: "Bettina",
      lastName: "Tetz",
      dateOfBirth: new Date("1990-05-17"),
      shoeSize: 38,
      role: 'INSTRUCTOR'
    },
  });

  await prisma.user.upsert({
    where: { id: UUIDs.users.jerry },
    update: {},
    create: {
      id: UUIDs.users.jerry,
      email: "jerry@example.com",
      firstName: "Jerry",
      lastName: "Kerry",
      dateOfBirth: new Date("1980-08-14"),
      shoeSize: 43,
      role: 'INSTRUCTOR'
    },
  });

  await prisma.user.upsert({
    where: { id: UUIDs.users.bob },
    update: {},
    create: {
      id: UUIDs.users.bob,
      email: "bob@example.com",
      firstName: "Bob",
      lastName: "Smith",
      dateOfBirth: new Date("1990-03-20"),
      shoeSize: 40,
      role: 'USER'
    },
  });

  await prisma.user.upsert({
    where: { id: UUIDs.users.jane },
    update: {},
    create: {
      id: UUIDs.users.jane,
      email: "jane@example.com",
      firstName: "Jane",
      lastName: "Miller",
      dateOfBirth: new Date("1992-07-14"),
      shoeSize: 38,
      role: "USER"
    },
  });

  await prisma.user.upsert({
    where: { id: UUIDs.users.todd },
    update: {},
    create: {
      id: UUIDs.users.todd,
      email: "todd@example.com",
      firstName: "Todd",
      lastName: "Johnson",
      dateOfBirth: new Date("1988-11-02"),
      shoeSize: 42,
      role: "USER"
    },
  });

  await prisma.user.upsert({
    where: { id: UUIDs.users.sarah },
    update: {},
    create: {
      id: UUIDs.users.sarah,
      email: "sarah@example.com",
      firstName: "Sarah",
      lastName: "Williams",
      dateOfBirth: new Date("1995-01-27"),
      shoeSize: 37,
      role: "USER"
    },
  });

  await prisma.user.upsert({
    where: { id: UUIDs.users.david },
    update: {},
    create: {
      id: UUIDs.users.david,
      email: "david@example.com",
      firstName: "David",
      lastName: "Brown",
      dateOfBirth: new Date("1985-09-10"),
      shoeSize: 43,
      role: "USER"
    },
  });

  console.log("✅ Users seeded");

  // ----- STUDIOS -----
  await prisma.studio.upsert({
    where: { id: UUIDs.studios.basel },
    update: {},
    create: {
      id: UUIDs.studios.basel,
      studioNumber: 1,
      name: "Cyclo Basel",
    },
  });

  await prisma.studio.upsert({
    where: { id: UUIDs.studios.oerlikon },
    update: {},
    create: {
      id: UUIDs.studios.oerlikon,
      studioNumber: 2,
      name: "Cyclo Oerlikon",
    },
  });

  console.log("✅ Studios seeded");

  // ----- BIKES -----
  for (let i = 0; i < 25; i++) {
    await prisma.bike.upsert({
      where: { id: UUIDs.bikes.basel[i] },
      update: {},
      create: {
        id: UUIDs.bikes.basel[i],
        studioId: UUIDs.studios.basel,
        bikeNumber: i + 1,
      },
    });

    await prisma.bike.upsert({
      where: { id: UUIDs.bikes.oerlikon[i] },
      update: {},
      create: {
        id: UUIDs.bikes.oerlikon[i],
        studioId: UUIDs.studios.oerlikon,
        bikeNumber: i + 1,
      },
    });
  }

  console.log("✅ Bikes seeded");

  // ----- rideS -----
  await prisma.ride.upsert({
    where: { id: UUIDs.rides.normal },
    update: {},
    create: {
      id: UUIDs.rides.normal,
      studioId: UUIDs.studios.basel,
      instructorId: UUIDs.users.bettina,
      startAt: new Date(2026, 7, 9, 19),
      endAt: new Date(2026, 7, 9, 19, 50),
      rideType: "NORMAL",
      tokenPrice: 1.0
    },
  });

  await prisma.ride.upsert({
    where: { id: UUIDs.rides.intro },
    update: {},
    create: {
      id: UUIDs.rides.intro,
      studioId: UUIDs.studios.oerlikon,
      instructorId: UUIDs.users.jerry,
      startAt: new Date(2026, 7, 6, 20),
      endAt: new Date(2026, 7, 6, 20, 50),
      rideType: "INTRO",
      tokenPrice: 1.0,
    },
  });

  await prisma.ride.upsert({
    where: { id: UUIDs.rides.event },
    update: {},
    create: {
      id: UUIDs.rides.event,
      studioId: UUIDs.studios.basel,
      instructorId: UUIDs.users.bettina,
      startAt: new Date(2026, 9, 6, 19),
      endAt: new Date(2026, 9, 6, 19, 50),
      rideType: "EVENT",
      tokenPrice: 2.0
    },
  });

  await prisma.ride.upsert({
    where: { id: UUIDs.rides.ride90s },
    update: {},
    create: {
      id: UUIDs.rides.ride90s,
      studioId: UUIDs.studios.basel,
      instructorId: UUIDs.users.jerry,
      startAt: new Date(2026, 7, 5, 19),
      endAt: new Date(2026, 7, 5, 19, 50),
      theme: "90s ride",
      description: "best ride of your life",
      rideType: "NORMAL",
      tokenPrice: 1.0
    },
  });

  await prisma.ride.upsert({
    where: { id: UUIDs.rides.ride80s },
    update: {},
    create: {
      id: UUIDs.rides.ride80s,
      studioId: UUIDs.studios.oerlikon,
      instructorId: UUIDs.users.bettina,
      startAt: new Date(2026, 7, 6, 18),
      endAt: new Date(2026, 7, 6, 18, 50),
      theme: "80s ride",
      description: "ride or die",
      rideType: "NORMAL",
      tokenPrice: 1.0
    },
  });

  console.log("✅ Rides seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
