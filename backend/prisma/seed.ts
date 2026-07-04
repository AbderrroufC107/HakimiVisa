import {
  AppointmentType,
  EntryType,
  NotificationType,
  PrismaClient,
  UserRole,
  VisaStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@hakimivisa.com';
const ADMIN_PASSWORD = 'Admin123!';
const SEED_DATE = new Date('2026-06-01T09:00:00.000Z');

function addDays(days: number) {
  const date = new Date(SEED_DATE);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

async function upsertUser(
  email: string,
  firstName: string,
  lastName: string,
  role: UserRole,
  password: string,
) {
  return prisma.user.upsert({
    where: { email },
    update: {
      firstName,
      lastName,
      role,
      isActive: true,
    },
    create: {
      email,
      password,
      firstName,
      lastName,
      role,
      isActive: true,
    },
  });
}

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const admin = await upsertUser(ADMIN_EMAIL, 'Admin', 'Hakimi', UserRole.ADMIN, hashedPassword);
  const manager = await upsertUser('manager@hakimivisa.com', 'Sarah', 'Mansouri', UserRole.MANAGER, hashedPassword);
  const agent = await upsertUser('agent@hakimivisa.com', 'Karim', 'Bensaid', UserRole.AGENT, hashedPassword);

  await prisma.agencySettings.upsert({
    where: { id: 'seed-agency-settings' },
    update: {
      agencyName: 'Hakimi Visa Services',
      agencyAddress: '42 Rue Didouche Mourad, Algiers, Algeria',
      agencyPhone: '+213 21 63 10 10',
      agencyEmail: 'contact@hakimivisa.com',
      agencyWebsite: 'https://hakimivisa.com',
      defaultCountry: 'France',
      defaultVisaType: 'Schengen',
      pdfFooterText: 'Hakimi Visa Services - Professional visa assistance',
      pdfPrimaryColor: '#1a73e8',
      appointmentCenter: 'TLS Contact Algiers',
    },
    create: {
      id: 'seed-agency-settings',
      agencyName: 'Hakimi Visa Services',
      agencyAddress: '42 Rue Didouche Mourad, Algiers, Algeria',
      agencyPhone: '+213 21 63 10 10',
      agencyEmail: 'contact@hakimivisa.com',
      agencyWebsite: 'https://hakimivisa.com',
      defaultCountry: 'France',
      defaultVisaType: 'Schengen',
      pdfFooterText: 'Hakimi Visa Services - Professional visa assistance',
      pdfPrimaryColor: '#1a73e8',
      appointmentCenter: 'TLS Contact Algiers',
    },
  });

  await prisma.backupSettings.upsert({
    where: { id: 'seed-backup-settings' },
    update: {},
    create: {
      id: 'seed-backup-settings',
      enabled: true,
      frequency: 'daily',
      time: '02:00',
      retentionDays: 30,
      maxBackups: 10,
    },
  });

  const sampleClients = [
    ['Mohammed Benali', '+213555100100', '+213555100100', 'mohammed.benali@example.com', 'HV-A10001', 'Algeria'],
    ['Fatima Zohra Haddad', '+213555200200', '+213555200201', 'fatima.haddad@example.com', 'HV-A10002', 'Algeria'],
    ['Ahmed Khelifi', '+213555300300', '+213555300300', 'ahmed.khelifi@example.com', 'HV-A10003', 'Algeria'],
    ['Nadia Mansouri', '+213555400400', '+213555400400', 'nadia.mansouri@example.com', 'HV-A10004', 'Algeria'],
    ['Youssef Amrani', '+213555500500', '+213555500500', 'youssef.amrani@example.com', 'HV-A10005', 'Morocco'],
    ['Leila Saadi', '+213555600600', '+213555600600', 'leila.saadi@example.com', 'HV-A10006', 'Algeria'],
    ['Omar Bouzid', '+213555700700', '+213555700700', 'omar.bouzid@example.com', 'HV-A10007', 'Algeria'],
    ['Samira Touati', '+213555800800', '+213555800800', 'samira.touati@example.com', 'HV-A10008', 'Algeria'],
    ['Rachid Hamdi', '+213555900900', '+213555900900', 'rachid.hamdi@example.com', 'HV-A10009', 'Tunisia'],
    ['Amina Belkacem', '+213555101010', '+213555101010', 'amina.belkacem@example.com', 'HV-A10010', 'Algeria'],
    ['Mourad Slimani', '+213555111111', '+213555111111', 'mourad.slimani@example.com', 'HV-A10011', 'Algeria'],
    ['Dalia Ferhat', '+213555121212', '+213555121212', 'dalia.ferhat@example.com', 'HV-A10012', 'Algeria'],
    ['Sofiane Rahmani', '+213555131313', '+213555131313', 'sofiane.rahmani@example.com', 'HV-A10013', 'Algeria'],
    ['Imane Cherif', '+213555141414', '+213555141414', 'imane.cherif@example.com', 'HV-A10014', 'Algeria'],
    ['Walid Meziane', '+213555151515', '+213555151515', 'walid.meziane@example.com', 'HV-A10015', 'Algeria'],
    ['Kenza Boudiaf', '+213555161616', '+213555161616', 'kenza.boudiaf@example.com', 'HV-A10016', 'Algeria'],
    ['Nassim Ait Ali', '+213555171717', '+213555171717', 'nassim.aitali@example.com', 'HV-A10017', 'Algeria'],
    ['Meriem Sahel', '+213555181818', '+213555181818', 'meriem.sahel@example.com', 'HV-A10018', 'Algeria'],
    ['Tarek Bensalem', '+213555191919', '+213555191919', 'tarek.bensalem@example.com', 'HV-A10019', 'Algeria'],
    ['Hana Yacine', '+213555202020', '+213555202020', 'hana.yacine@example.com', 'HV-A10020', 'Algeria'],
    ['Kamel Derrar', '+213555212121', '+213555212121', 'kamel.derrar@example.com', 'HV-A10021', 'Algeria'],
    ['Sabrina Medjkane', '+213555222222', '+213555222222', 'sabrina.medjkane@example.com', 'HV-A10022', 'Algeria'],
    ['Ilyes Farhi', '+213555232323', '+213555232323', 'ilyes.farhi@example.com', 'HV-A10023', 'Algeria'],
    ['Lina Arab', '+213555242424', '+213555242424', 'lina.arab@example.com', 'HV-A10024', 'Algeria'],
    ['Adel Saoudi', '+213555252525', '+213555252525', 'adel.saoudi@example.com', 'HV-A10025', 'Algeria'],
  ];

  const clients = [];
  for (const [fullName, phoneNumber, whatsappNumber, email, passportNumber, nationality] of sampleClients) {
    const client = await prisma.client.upsert({
      where: { passportNumber },
      update: {
        fullName,
        phoneNumber,
        whatsappNumber,
        email,
        nationality,
        notes: 'Seed sample client used by automated tests.',
      },
      create: {
        fullName,
        phoneNumber,
        whatsappNumber,
        email,
        passportNumber,
        nationality,
        notes: 'Seed sample client used by automated tests.',
        createdBy: admin.id,
      },
    });
    clients.push(client);

    await prisma.note.upsert({
      where: { id: `seed-note-${passportNumber}` },
      update: { content: `Initial consultation completed for ${fullName}.` },
      create: {
        id: `seed-note-${passportNumber}`,
        content: `Initial consultation completed for ${fullName}.`,
        clientId: client.id,
        createdBy: agent.id,
      },
    });
  }

  const caseConfigs = [
    [0, VisaStatus.EN_ATTENTE, 'France', 'Schengen Tourism'],
    [1, VisaStatus.EN_TRAITEMENT, 'France', 'Long Stay Student'],
    [2, VisaStatus.RDV_OK, 'Spain', 'Schengen Business'],
    [3, VisaStatus.VISA_OK, 'Canada', 'Visitor Visa'],
    [4, VisaStatus.VISA_REFUSEE, 'United States', 'B1/B2'],
    [5, VisaStatus.EN_ATTENTE, 'Italy', 'Schengen Tourism'],
    [6, VisaStatus.EN_TRAITEMENT, 'Germany', 'Work Visa'],
    [7, VisaStatus.RDV_OK, 'Netherlands', 'Schengen Family Visit'],
    [8, VisaStatus.VISA_OK, 'United Kingdom', 'Standard Visitor'],
    [9, VisaStatus.VISA_REFUSEE, 'France', 'Schengen Tourism'],
  ] as const;

  const cases = [];
  for (let i = 0; i < caseConfigs.length; i += 1) {
    const [clientIndex, currentStatus, visaCountry, visaType] = caseConfigs[i];
    const client = clients[clientIndex];
    const caseNumber = `E2E-2026-${String(i + 1).padStart(4, '0')}`;
    const visaCase = await prisma.visaCase.upsert({
      where: { caseNumber },
      update: {
        clientId: client.id,
        visaCountry,
        visaType,
        currentStatus,
        archived: false,
        openingDate: addDays(-20 + i),
        notes: `Seeded ${visaType} application for ${visaCountry}.`,
      },
      create: {
        caseNumber,
        clientId: client.id,
        visaCountry,
        visaType,
        currentStatus,
        archived: false,
        openingDate: addDays(-20 + i),
        notes: `Seeded ${visaType} application for ${visaCountry}.`,
        createdBy: manager.id,
      },
    });
    cases.push(visaCase);

    await prisma.statusHistory.upsert({
      where: { id: `seed-history-opened-${caseNumber}` },
      update: {
        oldStatus: VisaStatus.EN_ATTENTE,
        newStatus: currentStatus,
        changedBy: admin.id,
        changedAt: addDays(-10 + i),
      },
      create: {
        id: `seed-history-opened-${caseNumber}`,
        visaCaseId: visaCase.id,
        oldStatus: VisaStatus.EN_ATTENTE,
        newStatus: currentStatus,
        changedBy: admin.id,
        changedAt: addDays(-10 + i),
      },
    });

    await prisma.appointment.upsert({
      where: { id: `seed-appointment-${caseNumber}` },
      update: {
        visaCaseId: visaCase.id,
        appointmentDate: addDays(i + 1),
        appointmentTime: `${String(9 + (i % 7)).padStart(2, '0')}:30`,
        appointmentCenter: i % 2 === 0 ? 'TLS Contact Algiers' : 'VFS Global Algiers',
        appointmentType: i % 2 === 0 ? AppointmentType.TLS : AppointmentType.VFS,
        notes: `Appointment for ${caseNumber}`,
        userId: agent.id,
      },
      create: {
        id: `seed-appointment-${caseNumber}`,
        visaCaseId: visaCase.id,
        appointmentDate: addDays(i + 1),
        appointmentTime: `${String(9 + (i % 7)).padStart(2, '0')}:30`,
        appointmentCenter: i % 2 === 0 ? 'TLS Contact Algiers' : 'VFS Global Algiers',
        appointmentType: i % 2 === 0 ? AppointmentType.TLS : AppointmentType.VFS,
        notes: `Appointment for ${caseNumber}`,
        userId: agent.id,
      },
    });

    if (currentStatus === VisaStatus.VISA_OK) {
      await prisma.visaDetails.upsert({
        where: { visaCaseId: visaCase.id },
        update: {
          validFrom: addDays(15),
          validUntil: addDays(105),
          durationDays: 90,
          entryType: EntryType.MULTIPLE,
          visaNumber: `HV-${caseNumber}`,
          notes: 'Approved sample visa.',
        },
        create: {
          visaCaseId: visaCase.id,
          validFrom: addDays(15),
          validUntil: addDays(105),
          durationDays: 90,
          entryType: EntryType.MULTIPLE,
          visaNumber: `HV-${caseNumber}`,
          notes: 'Approved sample visa.',
        },
      });
    }
  }

  const notifications = [
    [NotificationType.INFO, 'Welcome to Hakimi Visa', 'Your dashboard is ready.', false],
    [NotificationType.APPOINTMENT_REMINDER, 'Appointment tomorrow', 'TLS appointment scheduled for Mohammed Benali.', false],
    [NotificationType.STATUS_CHANGE, 'Case status updated', 'E2E-2026-0002 moved to processing.', true],
    [NotificationType.SUCCESS, 'Visa approved', 'Nadia Mansouri visa has been approved.', false],
    [NotificationType.WARNING, 'Documents required', 'Additional bank statements are required.', true],
  ] as const;

  for (let i = 0; i < notifications.length; i += 1) {
    const [type, title, message, read] = notifications[i];
    await prisma.notification.upsert({
      where: { id: `seed-notification-${i + 1}` },
      update: { type, title, message, read, userId: admin.id },
      create: {
        id: `seed-notification-${i + 1}`,
        type,
        title,
        message,
        read,
        userId: admin.id,
        link: i === 1 ? '/appointments' : null,
      },
    });
  }

  console.log(`Seed completed: ${clients.length} clients, ${cases.length} visa cases.`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
