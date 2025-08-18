
import { storage } from './storage';
import { hashPassword } from './auth';

export async function seedDefaultUsers() {
  try {
    console.log('🌱 Seeding default users...');

    // Get or create organization
    let org = await storage.getOrganizationByDomain("servicedesk.com");
    if (!org) {
      org = await storage.createOrganization({
        name: "ServiceDesk Pro",
        domain: "servicedesk.com",
        isActive: true,
      });
      console.log('✅ Organization created');
    }

    // Create admin user if doesn't exist
    const existingAdmin = await storage.getUserByUsername("admin");
    if (!existingAdmin) {
      const hashedPassword = await hashPassword("admin123");
      const adminUser = await storage.createUser({
        orgId: org.id,
        username: "admin",
        name: "Administrador",
        password: hashedPassword,
        mfaSecret: null,
        locale: "pt-BR",
        timeZone: "America/Sao_Paulo",
        isActive: true,
      });

      // Get or create admin team
      const teams = await storage.getTeamsByOrg(org.id);
      let adminTeam = teams.find(t => t.name === "Administradores");
      if (!adminTeam) {
        adminTeam = await storage.createTeam({
          orgId: org.id,
          departmentId: null,
          name: "Administradores",
          description: "Equipe de administradores do sistema",
          isActive: true,
        });
      }

      await storage.createMembership({
        userId: adminUser.id,
        teamId: adminTeam.id,
        roles: ["ADMIN"],
        isActive: true,
      });

      console.log('✅ Admin user created - username: admin, password: admin123');
    }

    // Create conventional user if doesn't exist
    const existingUser = await storage.getUserByUsername("usuario");
    if (!existingUser) {
      const hashedPassword = await hashPassword("123456");
      const conventionalUser = await storage.createUser({
        orgId: org.id,
        username: "usuario",
        name: "Usuário Convencional",
        password: hashedPassword,
        mfaSecret: null,
        locale: "pt-BR",
        timeZone: "America/Sao_Paulo",
        isActive: true,
      });

      // Get or create users team
      const teams = await storage.getTeamsByOrg(org.id);
      let usersTeam = teams.find(t => t.name === "Usuários");
      if (!usersTeam) {
        usersTeam = await storage.createTeam({
          orgId: org.id,
          departmentId: null,
          name: "Usuários",
          description: "Usuários convencionais do sistema",
          isActive: true,
        });
      }

      await storage.createMembership({
        userId: conventionalUser.id,
        teamId: usersTeam.id,
        roles: ["REQUESTER"],
        isActive: true,
      });

      console.log('✅ Conventional user created - username: usuario, password: 123456');
    }

    console.log('🎉 Default users seeded successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error seeding default users:', error);
    return false;
  }
}
