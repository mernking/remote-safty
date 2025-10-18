const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create demo users with different roles
  const hashedAdminPassword = await bcrypt.hash('admin123', 12);
  const hashedManagerPassword = await bcrypt.hash('manager123', 12);
  const hashedSupervisorPassword = await bcrypt.hash('supervisor123', 12);
  const hashedWorkerPassword = await bcrypt.hash('worker123', 12);

  const users = await Promise.all([
    // Admin user
    prisma.user.upsert({
      where: { email: 'admin@safety.com' },
      update: {},
      create: {
        id: uuidv4(),
        email: 'admin@safety.com',
        name: 'Safety Admin',
        password: hashedAdminPassword,
        role: 'ADMIN',
        apiKey: generateApiKey(),
        keyEnabled: true,
      },
    }),

    // Safety Manager
    prisma.user.upsert({
      where: { email: 'manager@safety.com' },
      update: {},
      create: {
        id: uuidv4(),
        email: 'manager@safety.com',
        name: 'Safety Manager',
        password: hashedManagerPassword,
        role: 'SAFETY_MANAGER',
        apiKey: generateApiKey(),
        keyEnabled: true,
      },
    }),

    // Supervisor
    prisma.user.upsert({
      where: { email: 'supervisor@safety.com' },
      update: {},
      create: {
        id: uuidv4(),
        email: 'supervisor@safety.com',
        name: 'Site Supervisor',
        password: hashedSupervisorPassword,
        role: 'SUPERVISOR',
        apiKey: generateApiKey(),
        keyEnabled: true,
      },
    }),

    // Worker
    prisma.user.upsert({
      where: { email: 'worker@safety.com' },
      update: {},
      create: {
        id: uuidv4(),
        email: 'worker@safety.com',
        name: 'Field Worker',
        password: hashedWorkerPassword,
        role: 'WORKER',
        apiKey: generateApiKey(),
        keyEnabled: true,
      },
    }),
  ]);

  console.log('✅ Created demo users');

  // Create demo sites
  const sites = await Promise.all([
    prisma.site.upsert({
      where: { id: 'site-1' },
      update: {},
      create: {
        id: 'site-1',
        name: 'Downtown Construction Site',
        address: '123 Main St, Downtown',
        lat: 40.7128,
        lng: -74.0060,
        meta: JSON.stringify({
          projectType: 'Commercial Building',
          startDate: '2024-01-15',
          estimatedCompletion: '2024-12-31',
          crewSize: 25,
          safetyOfficer: users[1].id // Safety Manager
        }),
      },
    }),

    prisma.site.upsert({
      where: { id: 'site-2' },
      update: {},
      create: {
        id: 'site-2',
        name: 'Industrial Park Project',
        address: '456 Industrial Blvd, Industrial Park',
        lat: 40.7589,
        lng: -73.9851,
        meta: JSON.stringify({
          projectType: 'Manufacturing Facility',
          startDate: '2024-03-01',
          estimatedCompletion: '2025-06-30',
          crewSize: 40,
          safetyOfficer: users[1].id
        }),
      },
    }),

    prisma.site.upsert({
      where: { id: 'site-3' },
      update: {},
      create: {
        id: 'site-3',
        name: 'Residential Complex',
        address: '789 Residential Ave, Suburb',
        lat: 40.7505,
        lng: -73.9934,
        meta: JSON.stringify({
          projectType: 'Residential Tower',
          startDate: '2024-06-01',
          estimatedCompletion: '2025-03-31',
          crewSize: 60,
          safetyOfficer: users[1].id
        }),
      },
    }),
  ]);

  console.log('✅ Created demo sites');

  // Create demo inspections
  const inspections = await Promise.all([
    prisma.inspection.upsert({
      where: { id: 'inspection-1' },
      update: {},
      create: {
        id: 'inspection-1',
        siteId: sites[0].id,
        createdById: users[2].id, // Supervisor
        checklist: JSON.stringify({
          ppe: { checked: true, notes: 'All workers wearing helmets and vests' },
          ladders: { checked: true, notes: 'Ladders secured properly' },
          electrical: { checked: false, notes: 'Extension cords need inspection' },
          scaffolding: { checked: true, notes: 'Scaffolding properly anchored' },
          emergency: { checked: true, notes: 'First aid kit available' }
        }),
        status: 'completed',
      },
    }),

    prisma.inspection.upsert({
      where: { id: 'inspection-2' },
      update: {},
      create: {
        id: 'inspection-2',
        siteId: sites[1].id,
        createdById: users[2].id,
        checklist: JSON.stringify({
          machinery: { checked: true, notes: 'All machines have guards' },
          ventilation: { checked: false, notes: 'Ventilation system needs cleaning' },
          chemicals: { checked: true, notes: 'Chemical storage proper' },
          lighting: { checked: true, notes: 'Adequate lighting in work areas' },
          exits: { checked: true, notes: 'Emergency exits clear' }
        }),
        status: 'draft',
      },
    }),
  ]);

  console.log('✅ Created demo inspections');

  // Create demo incidents
  const incidents = await Promise.all([
    prisma.incident.upsert({
      where: { id: 'incident-1' },
      update: {},
      create: {
        id: 'incident-1',
        siteId: sites[0].id,
        reportedById: users[3].id, // Worker
        type: 'Near Miss',
        severity: 2,
        description: 'Worker almost slipped on wet floor. Area was not properly marked.',
        location: JSON.stringify({
          type: 'point',
          coordinates: [40.7128, -74.0060],
          description: 'Main entrance area'
        }),
      },
    }),

    prisma.incident.upsert({
      where: { id: 'incident-2' },
      update: {},
      create: {
        id: 'incident-2',
        siteId: sites[1].id,
        reportedById: users[2].id, // Supervisor
        type: 'Equipment Malfunction',
        severity: 4,
        description: 'Forklift hydraulic system failure. Worker required medical attention for minor injury.',
        location: JSON.stringify({
          type: 'point',
          coordinates: [40.7589, -73.9851],
          description: 'Loading dock area'
        }),
      },
    }),
  ]);

  console.log('✅ Created demo incidents');

  // Create demo toolbox talks
  const toolboxTalks = await Promise.all([
    prisma.toolboxTalk.upsert({
      where: { id: 'talk-1' },
      update: {},
      create: {
        id: 'talk-1',
        siteId: sites[0].id,
        createdById: users[2].id,
        title: 'Fall Protection Safety Talk',
        agenda: 'Discussion on proper fall protection equipment usage, inspection procedures, and emergency response protocols.',
        attendees: JSON.stringify([
          'John Smith',
          'Sarah Johnson',
          'Mike Davis',
          'Lisa Wilson',
          'David Brown'
        ]),
        status: 'completed',
        completedAt: new Date(),
      },
    }),

    prisma.toolboxTalk.upsert({
      where: { id: 'talk-2' },
      update: {},
      create: {
        id: 'talk-2',
        siteId: sites[1].id,
        createdById: users[2].id,
        title: 'Chemical Handling Procedures',
        agenda: 'Review of proper chemical storage, handling procedures, and spill response protocols.',
        attendees: JSON.stringify([
          'Robert Taylor',
          'Jennifer Garcia',
          'Kevin Martinez',
          'Amanda Anderson'
        ]),
        status: 'scheduled',
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    }),
  ]);

  console.log('✅ Created demo toolbox talks');

  // Create demo notifications
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: users[1].id, // Safety Manager
        type: 'safety_alert',
        title: 'Critical Incident Reported',
        message: 'A severity 4 incident has been reported at Industrial Park Project requiring immediate attention.',
        priority: 'high',
        data: JSON.stringify({ incidentId: incidents[1].id, siteId: sites[1].id }),
        relatedEntity: 'Incident',
        relatedId: incidents[1].id,
      },
    }),

    prisma.notification.create({
      data: {
        userId: users[2].id, // Supervisor
        type: 'inspection_due',
        title: 'Inspection Reminder',
        message: 'Weekly safety inspection is due for Downtown Construction Site.',
        priority: 'normal',
        data: JSON.stringify({ siteId: sites[0].id }),
        relatedEntity: 'Site',
        relatedId: sites[0].id,
      },
    }),
  ]);

  console.log('✅ Created demo notifications');

  // Create demo reminders
  await Promise.all([
    prisma.reminder.create({
      data: {
        type: 'inspection',
        entityId: sites[0].id,
        entityType: 'Site',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        assignedTo: users[2].id,
      },
    }),

    prisma.reminder.create({
      data: {
        type: 'toolbox_talk',
        entityId: toolboxTalks[1].id,
        entityType: 'ToolboxTalk',
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        assignedTo: users[2].id,
      },
    }),
  ]);

  console.log('✅ Created demo reminders');

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📋 Demo Accounts:');
  console.log('Admin: admin@safety.com / admin123');
  console.log('Safety Manager: manager@safety.com / manager123');
  console.log('Supervisor: supervisor@safety.com / supervisor123');
  console.log('Worker: worker@safety.com / worker123');
}

function generateApiKey() {
  return uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });