
import { storage } from './storage';
import { hashPassword } from './auth';

export async function seedAdmin() {
  try {
    const adminData = {
      username: "admin",
      password: "admin123",
      name: "Administrador",
      orgName: "ServiceDesk Pro",
      orgDomain: "servicedesk.com"
    };

    // Check if admin user already exists
    const existingUser = await storage.getUserByUsername(adminData.username);
    if (existingUser) {
      console.log("Admin user already exists");
      return existingUser;
    }

    // Check if organization exists
    let org = await storage.getOrganizationByDomain(adminData.orgDomain);
    if (!org) {
      // Create organization
      org = await storage.createOrganization({
        name: adminData.orgName,
        domain: adminData.orgDomain,
        isActive: true,
      });
      console.log("Organization created:", org.name);
    }

    // Create admin user
    const hashedPassword = await hashPassword(adminData.password);
    const user = await storage.createUser({
      orgId: org.id,
      username: adminData.username,
      name: adminData.name,
      password: hashedPassword,
      mfaSecret: null,
      locale: "pt-BR",
      timeZone: "America/Sao_Paulo",
      isActive: true,
    });

    // Check if team exists
    const teams = await storage.getTeamsByOrg(org.id);
    let team = teams.find(t => t.name === "Suporte Geral");

    if (!team) {
      // Create default team
      team = await storage.createTeam({
        orgId: org.id,
        departmentId: null,
        name: "Suporte Geral",
        description: "Equipe de suporte geral",
        isActive: true,
      });
      console.log("Default team created:", team.name);
    }

    // Add user as admin
    await storage.createMembership({
      userId: user.id,
      teamId: team.id,
      roles: ["ADMIN"],
      isActive: true,
    });

    console.log("Admin user created successfully");
    console.log("Credentials:", {
      username: adminData.username,
      password: adminData.password
    });

    return user;
  } catch (error) {
    console.error("Error seeding admin:", error);
    throw error;
  }
}
