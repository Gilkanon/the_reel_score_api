import { MediaType, Role } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const salt = process.env.SALT ? Number(process.env.SALT) : 10;

async function main() {
  console.log('Start seeding');

  console.log(`User ${salt} rounds for hashing`);
  const userPassword = await bcrypt.hash('userPassword', salt);
  const adminPassword = await bcrypt.hash('adminPassword', salt);
  console.log('Passwords is hashed');

  const user = await prisma.user.upsert({
    where: { username: 'user' },
    update: { password: userPassword },
    create: {
      username: 'user',
      email: 'user@example.com',
      password: userPassword,
      role: Role.USER,
    },
  });

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: adminPassword },
    create: {
      username: 'admin',
      email: 'admin@example.com',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  console.log(
    `Created/updated users: ${user.username} (ID: ${user.id}), ${admin.username} (ID: ${admin.id})`,
  );

  const fightClub = await prisma.media.upsert({
    where: { id: 550 },
    update: {},
    create: {
      id: 550,
      type: MediaType.Movie,
      title: 'Fight Club',
      releaseDate: '1999-10-15',
      posterPath: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    },
  });

  const breakingBad = await prisma.media.upsert({
    where: { id: 1396 },
    update: {},
    create: {
      id: 1396,
      type: MediaType.TV,
      title: 'Breaking Bad',
      releaseDate: '2013-09-29',
      posterPath: '/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg',
    },
  });

  console.log(
    `Created/updated media: ${fightClub.title} (ID: ${fightClub.id}), ${breakingBad.title} (ID: ${breakingBad.id})`,
  );

  const review1 = await prisma.review.upsert({
    where: {
      reviews_user_id_media_id_key: {
        userId: user.id,
        mediaId: fightClub.id,
      },
    },
    update: {
      text: 'Great Movie (updated)',
      rating: 10,
    },
    create: {
      text: 'Great Movie (e2e-seed)',
      rating: 10,
      userId: user.id,
      username: user.username,
      mediaId: fightClub.id,
    },
  });

  const review2 = await prisma.review.upsert({
    where: {
      reviews_user_id_media_id_key: {
        userId: admin.id,
        mediaId: breakingBad.id,
      },
    },
    update: {
      text: 'Great TV Show (updated)',
      rating: 9,
    },
    create: {
      text: 'Great TV Show (e2e-seed)',
      rating: 9,
      userId: admin.id,
      username: admin.username,
      mediaId: breakingBad.id,
    },
  });

  console.log(
    `Created/updated reviews: ${review1.text} (ID: ${review1.id}), ${review2.text} (ID: ${review2.id})`,
  );

  console.log('End seeding');

  return { user, admin, fightClub, breakingBad, review1, review2 };
}

export async function runSeed() {
  return await main();
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
