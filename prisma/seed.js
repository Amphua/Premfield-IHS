const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('Start seeding...');

  // Create users
  const adminPasswordHash = await bcrypt.hash('password', 10);
  const teacherPasswordHash = await bcrypt.hash('password', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@school.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
    },
  });

  const teacher1 = await prisma.user.upsert({
    where: { username: 'teacher1' },
    update: {},
    create: {
      username: 'teacher1',
      email: 'teacher1@school.com',
      passwordHash: teacherPasswordHash,
      role: 'teacher',
    },
  });

  console.log('Users created:', { admin, teacher1 });

  // Create students
  const john = await prisma.student.upsert({
    where: { id: 1 },
    update: {},
    create: {
      fullName: 'John Doe',
      dateOfBirth: new Date('2005-03-15'),
      class: '10A',
      status: 'active',
    },
  });

  const jane = await prisma.student.upsert({
    where: { id: 2 },
    update: {},
    create: {
      fullName: 'Jane Smith',
      dateOfBirth: new Date('2005-07-22'),
      class: '10A',
      status: 'active',
    },
  });

  const mike = await prisma.student.upsert({
    where: { id: 3 },
    update: {},
    create: {
      fullName: 'Mike Johnson',
      dateOfBirth: new Date('2005-11-08'),
      class: '10B',
      status: 'active',
    },
  });

  const sarah = await prisma.student.upsert({
    where: { id: 4 },
    update: {},
    create: {
      fullName: 'Sarah Williams',
      dateOfBirth: new Date('2005-01-30'),
      class: '10B',
      status: 'inactive',
    },
  });

  console.log('Students created:', { john, jane, mike, sarah });

  // Create student terms
  await prisma.studentTerm.upsert({
    where: {
      studentId_termNumber: {
        studentId: 1,
        termNumber: 1
      }
    },
    update: {
      attendance: 95,
      academicScore: 88,
      remarks: 'Excellent performance'
    },
    create: {
      studentId: 1,
      termNumber: 1,
      attendance: 95,
      academicScore: 88,
      remarks: 'Excellent performance'
    },
  });

  await prisma.studentTerm.upsert({
    where: {
      studentId_termNumber: {
        studentId: 1,
        termNumber: 2
      }
    },
    update: {
      attendance: 92,
      academicScore: 85,
      remarks: 'Consistent progress'
    },
    create: {
      studentId: 1,
      termNumber: 2,
      attendance: 92,
      academicScore: 85,
      remarks: 'Consistent progress'
    },
  });

  await prisma.studentTerm.upsert({
    where: {
      studentId_termNumber: {
        studentId: 1,
        termNumber: 3
      }
    },
    update: {
      attendance: 94,
      academicScore: 90,
      remarks: 'Outstanding results'
    },
    create: {
      studentId: 1,
      termNumber: 3,
      attendance: 94,
      academicScore: 90,
      remarks: 'Outstanding results'
    },
  });

  await prisma.studentTerm.upsert({
    where: {
      studentId_termNumber: {
        studentId: 2,
        termNumber: 1
      }
    },
    update: {
      attendance: 88,
      academicScore: 92,
      remarks: 'Very good academic performance'
    },
    create: {
      studentId: 2,
      termNumber: 1,
      attendance: 88,
      academicScore: 92,
      remarks: 'Very good academic performance'
    },
  });

  await prisma.studentTerm.upsert({
    where: {
      studentId_termNumber: {
        studentId: 2,
        termNumber: 2
      }
    },
    update: {
      attendance: 90,
      academicScore: 89,
      remarks: 'Maintaining good standards'
    },
    create: {
      studentId: 2,
      termNumber: 2,
      attendance: 90,
      academicScore: 89,
      remarks: 'Maintaining good standards'
    },
  });

  await prisma.studentTerm.upsert({
    where: {
      studentId_termNumber: {
        studentId: 3,
        termNumber: 1
      }
    },
    update: {
      attendance: 85,
      academicScore: 78,
      remarks: 'Needs improvement in attendance'
    },
    create: {
      studentId: 3,
      termNumber: 1,
      attendance: 85,
      academicScore: 78,
      remarks: 'Needs improvement in attendance'
    },
  });

  await prisma.studentTerm.upsert({
    where: {
      studentId_termNumber: {
        studentId: 4,
        termNumber: 1
      }
    },
    update: {
      attendance: 78,
      academicScore: 82,
      remarks: 'Fair performance, room for growth'
    },
    create: {
      studentId: 4,
      termNumber: 1,
      attendance: 78,
      academicScore: 82,
      remarks: 'Fair performance, room for growth'
    },
  });

  console.log('Student terms created');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
