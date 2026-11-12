// DEPRECATED — One-time migration script (Projects → APIs). Already completed.
// Kept for historical reference only. Do not run again — references old schema columns
// (projectId on Rule/RequestLog) that no longer exist.
//
// Migration script to convert existing projects to use APIs
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function migrate() {
  console.log('Starting migration: Projects → APIs...');

  try {
    // Get all projects
    const projects = await prisma.project.findMany();
    console.log(`Found ${projects.length} projects`);

    for (const project of projects) {
      console.log(`\nMigrating project: ${project.name} (${project.id})`);

      // Check if project already has APIs
      const existingApis = await prisma.api.findMany({
        where: { projectId: project.id },
      });

      if (existingApis.length > 0) {
        console.log(`  ✓ Project already has ${existingApis.length} API(s), skipping`);
        continue;
      }

      // Create default API for this project
      const apiId = 'api_' + crypto.randomBytes(4).toString('hex');
      
      // Check if project has targetUrl in old schema (shouldn't, but just in case)
      const defaultTargetUrl = project.targetUrl || `https://example.com/api`;

      const api = await prisma.api.create({
        data: {
          id: apiId,
          projectId: project.id,
          name: `${project.name} API`,
          targetUrl: defaultTargetUrl,
          description: 'Default API migrated from project',
          status: 'active',
        },
      });

      console.log(`  ✓ Created API: ${api.name} (${api.id})`);

      // Migrate rules to this API
      const rules = await prisma.rule.findMany({
        where: { projectId: project.id },
      });

      if (rules.length > 0) {
        await prisma.rule.updateMany({
          where: { projectId: project.id },
          data: { apiId: api.id },
        });
        console.log(`  ✓ Migrated ${rules.length} rule(s) to new API`);
      }

      // Migrate request logs to this API
      const logCount = await prisma.requestLog.count({
        where: { projectId: project.id },
      });

      if (logCount > 0) {
        await prisma.requestLog.updateMany({
          where: { projectId: project.id },
          data: { apiId: api.id },
        });
        console.log(`  ✓ Migrated ${logCount} request log(s) to new API`);
      }
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
