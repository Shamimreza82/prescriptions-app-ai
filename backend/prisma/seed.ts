import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@presmanage.com' },
    update: {},
    create: {
      email: 'admin@presmanage.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      isVerified: true,
      isActive: true,
    },
  });

  console.log('Super admin created:', admin.email);

  // Seed default plans
  const freePlan = await prisma.plan.upsert({
    where: { name: 'Free' },
    update: {
      description: 'Basic plan for getting started',
      price: 0,
      patientLimit: 50,
      prescriptionLimit: 100,
      duration: 0,
    },
    create: {
      name: 'Free',
      description: 'Basic plan for getting started',
      price: 0,
      patientLimit: 50,
      prescriptionLimit: 100,
      duration: 0,
    },
  });

  const basicPlan = await prisma.plan.upsert({
    where: { name: 'Basic' },
    update: {
      description: 'Essential features for small clinics',
      price: 1500,
      patientLimit: 200,
      prescriptionLimit: 500,
      duration: 30,
    },
    create: {
      name: 'Basic',
      description: 'Essential features for small clinics',
      price: 1500,
      patientLimit: 200,
      prescriptionLimit: 500,
      duration: 30,
    },
  });

  const premiumPlan = await prisma.plan.upsert({
    where: { name: 'Premium' },
    update: {
      description: 'Full access for busy practices',
      price: 2000,
      patientLimit: 1000,
      prescriptionLimit: 5000,
      duration: 30,
    },
    create: {
      name: 'Premium',
      description: 'Full access for busy practices',
      price: 2000,
      patientLimit: 1000,
      prescriptionLimit: 5000,
      duration: 30,
    },
  });

  const yearlyPlan = await prisma.plan.upsert({
    where: { name: 'Yearly' },
    update: {
      description: 'Best value — full year of premium features',
      price: 3000,
      patientLimit: 999999,
      prescriptionLimit: 999999,
      duration: 365,
    },
    create: {
      name: 'Yearly',
      description: 'Best value — full year of premium features',
      price: 3000,
      patientLimit: 999999,
      prescriptionLimit: 999999,
      duration: 365,
    },
  });

  console.log('Plans seeded: Free, Basic, Premium, Yearly');

  const doctorPassword = await bcrypt.hash('doctor123', 12);
  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor@example.com' },
    update: {},
    create: {
      email: 'doctor@example.com',
      password: doctorPassword,
      role: 'DOCTOR',
      isVerified: true,
      isActive: true,
      doctor: {
        create: {
          fullName: 'Dr. John Doe',
          degree: ['MBBS', 'FCPS (Medicine)'],
          specialization: ['Cardiology'],
          bmdcRegNo: 'BMDC-12345',
          clinicName: 'WellCare Medical Center',
          clinicAddress: '123 Healthcare Avenue, Dhaka',
          phone: '+8801700000000',
          isProfileComplete: true,
        },
      },
    },
    include: { doctor: true },
  });

  if (doctorUser.doctor) {
    await prisma.subscription.upsert({
      where: { doctorId: doctorUser.doctor.id },
      update: {},
      create: {
        doctorId: doctorUser.doctor.id,
        planId: freePlan.id,
        status: 'ACTIVE',
        patientLimit: freePlan.patientLimit,
        prescriptionLimit: freePlan.prescriptionLimit,
      },
    });
  }

  console.log('Doctor created:', doctorUser.email);

  const patient = await prisma.patient.upsert({
    where: { patientId: 'PAT-000001' },
    update: {},
    create: {
      patientId: 'PAT-000001',
      doctorId: doctorUser.doctor!.id,
      fullName: 'Jane Smith',
      age: 35,
      gender: 'FEMALE',
      bloodGroup: 'A_POSITIVE',
      weight: 65,
      height: 165,
      phone: '+8801700000001',
      address: '456 Patient Road, Dhaka',
    },
  });

  console.log('Patient created:', patient.fullName);

  const existingRx = await prisma.prescription.findUnique({ where: { prescriptionNo: 'RX-20240101-A1B2' } });
  if (existingRx) {
    await prisma.medicine.deleteMany({ where: { prescriptionId: existingRx.id } });
    await prisma.investigation.deleteMany({ where: { prescriptionId: existingRx.id } });
    await prisma.prescription.delete({ where: { id: existingRx.id } });
  }

  const rx = await prisma.prescription.create({
    data: {
      prescriptionNo: 'RX-20240101-A1B2',
      doctorId: doctorUser.doctor!.id,
      patientId: patient.id,
      symptoms: 'Fever, headache, body ache for 3 days',
      chiefComplaint: 'High fever with chills',
      diagnosis: 'Viral Fever',
      diagnosisNotes: 'Keep hydrated and monitor temperature',
      bloodPressure: '120/80',
      pulseRate: '78/min',
      temperature: '101.2°F',
      oxygenSaturation: '98%',
      advice: 'Take adequate rest. Drink plenty of fluids.',
      foodAdvice: 'Light and easily digestible food. Avoid oily food.',
      followUpDate: new Date('2024-02-01'),
      medicines: {
        create: [
          {
            name: 'Napa',
            strength: '500mg',
            dosage: '1+0+1',
            frequency: 'After meal',
            duration: '5 Days',
            instructions: 'Take with warm water',
          },
          {
            name: 'Azithromycin',
            strength: '500mg',
            dosage: '1+0+0',
            frequency: 'After meal',
            duration: '3 Days',
            instructions: 'Complete the course',
          },
        ],
      },
      investigations: {
        create: [
          { name: 'CBC (Complete Blood Count)', notes: 'Check WBC count' },
          { name: 'Blood Sugar Fasting', notes: '' },
        ],
      },
    },
  });

  console.log('Prescription created:', rx.prescriptionNo);

  const mrPassword = await bcrypt.hash('mr123456', 12);
  const mrUser = await prisma.user.upsert({
    where: { email: 'mr@example.com' },
    update: {},
    create: {
      email: 'mr@example.com',
      password: mrPassword,
      role: 'MEDICAL_REPRESENTATIVE',
      isVerified: true,
      isActive: true,
      mr: {
        create: {
          fullName: 'Md. Rahim Uddin',
          phone: '+8801700000002',
          company: 'PharmaCare Ltd.',
        },
      },
    },
    include: { mr: true },
  });

  if (mrUser.mr && doctorUser.doctor) {
    await prisma.doctorMrAssignment.upsert({
      where: { doctorId_mrId: { doctorId: doctorUser.doctor.id, mrId: mrUser.mr.id } },
      update: {},
      create: {
        doctorId: doctorUser.doctor.id,
        mrId: mrUser.mr.id,
      },
    });
  }

  console.log('MR created:', mrUser.email);

  const recPassword = await bcrypt.hash('rec123', 12);
  const recUser = await prisma.user.upsert({
    where: { email: 'receptionist@example.com' },
    update: {},
    create: {
      email: 'receptionist@example.com',
      password: recPassword,
      role: 'RECEPTIONIST',
      isVerified: true,
      isActive: true,
      receptionist: {
        create: {
          fullName: 'Sarah Johnson',
          phone: '+8801700000003',
          doctorId: doctorUser.doctor!.id,
        },
      },
    },
  });

  console.log('Receptionist created:', recUser.email);
  console.log('Seeding complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
