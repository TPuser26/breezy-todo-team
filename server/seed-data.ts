
import bcrypt from "bcryptjs";
import { storage } from "./storage";

export async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

    // Create sample users
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    const users = [
      {
        email: "alice@example.com",
        password: hashedPassword,
        full_name: "Alice Johnson",
      },
      {
        email: "bob@example.com", 
        password: hashedPassword,
        full_name: "Bob Smith",
      },
      {
        email: "charlie@example.com",
        password: hashedPassword,
        full_name: "Charlie Brown",
      },
      {
        email: "diana@example.com",
        password: hashedPassword,
        full_name: "Diana Prince",
      }
    ];

    const createdUsers = [];
    for (const userData of users) {
      try {
        const existingUser = await storage.getUserByEmail(userData.email);
        if (!existingUser) {
          const user = await storage.createUser(userData);
          createdUsers.push(user);
          console.log(`Created user: ${user.email}`);
        } else {
          createdUsers.push(existingUser);
          console.log(`User already exists: ${userData.email}`);
        }
      } catch (error) {
        console.log(`User ${userData.email} already exists or error occurred`);
      }
    }

    if (createdUsers.length === 0) {
      console.log("No users created, likely they already exist");
      return;
    }

    // Create sample teams
    const teams = [
      {
        name: "Équipe Frontend",
        description: "Équipe responsable du développement de l'interface utilisateur",
        created_by: createdUsers[0].id,
      },
      {
        name: "Équipe Backend", 
        description: "Équipe responsable du développement côté serveur",
        created_by: createdUsers[1].id,
      },
      {
        name: "Équipe DevOps",
        description: "Équipe responsable de l'infrastructure et des déploiements",
        created_by: createdUsers[0].id,
      }
    ];

    const createdTeams = [];
    for (const teamData of teams) {
      const team = await storage.createTeam(teamData);
      createdTeams.push(team);
      console.log(`Created team: ${team.name}`);
    }

    // Add team members
    await storage.addTeamMember(createdTeams[0].id, createdUsers[1].id, "member");
    await storage.addTeamMember(createdTeams[0].id, createdUsers[2].id, "member");
    await storage.addTeamMember(createdTeams[1].id, createdUsers[0].id, "member");
    await storage.addTeamMember(createdTeams[1].id, createdUsers[3].id, "admin");
    await storage.addTeamMember(createdTeams[2].id, createdUsers[2].id, "admin");
    await storage.addTeamMember(createdTeams[2].id, createdUsers[3].id, "member");

    console.log("Added team members");

    // Create sample tasks
    const tasks = [
      {
        title: "Implémenter l'authentification",
        description: "Créer le système de connexion et d'inscription des utilisateurs",
        status: "completed" as const,
        priority: "high" as const,
        assigned_to: createdUsers[0].id,
        created_by: createdUsers[1].id,
        team_id: createdTeams[1].id,
        due_date: new Date("2024-01-15"),
      },
      {
        title: "Créer le design de la page d'accueil",
        description: "Concevoir une interface utilisateur moderne et intuitive",
        status: "in_progress" as const,
        priority: "medium" as const,
        assigned_to: createdUsers[1].id,
        created_by: createdUsers[0].id,
        team_id: createdTeams[0].id,
        due_date: new Date("2024-02-01"),
      },
      {
        title: "Configurer le pipeline CI/CD",
        description: "Mettre en place l'intégration et le déploiement continus",
        status: "todo" as const,
        priority: "high" as const,
        assigned_to: createdUsers[2].id,
        created_by: createdUsers[3].id,
        team_id: createdTeams[2].id,
        due_date: new Date("2024-01-30"),
      },
      {
        title: "Optimiser les performances de l'API",
        description: "Améliorer les temps de réponse des endpoints critiques",
        status: "todo" as const,
        priority: "medium" as const,
        assigned_to: createdUsers[3].id,
        created_by: createdUsers[1].id,
        team_id: createdTeams[1].id,
        due_date: new Date("2024-02-15"),
      },
      {
        title: "Tests unitaires pour les composants React",
        description: "Écrire des tests pour assurer la qualité du code frontend",
        status: "todo" as const,
        priority: "low" as const,
        assigned_to: createdUsers[1].id,
        created_by: createdUsers[0].id,
        team_id: createdTeams[0].id,
        due_date: new Date("2024-02-20"),
      },
      {
        title: "Documentation de l'API",
        description: "Créer une documentation complète pour tous les endpoints",
        status: "in_progress" as const,
        priority: "medium" as const,
        assigned_to: createdUsers[0].id,
        created_by: createdUsers[3].id,
        team_id: createdTeams[1].id,
        due_date: new Date("2024-01-25"),
      }
    ];

    const createdTasks = [];
    for (const taskData of tasks) {
      const task = await storage.createTask(taskData);
      createdTasks.push(task);
      console.log(`Created task: ${task.title}`);
    }

    // Create sample notifications
    const notifications = [
      {
        user_id: createdUsers[0].id,
        title: "Tâche assignée",
        message: "Une nouvelle tâche vous a été assignée : Implémenter l'authentification",
        type: "info" as const,
        related_task_id: createdTasks[0].id,
      },
      {
        user_id: createdUsers[1].id,
        title: "Tâche créée",
        message: "Vous avez créé une nouvelle tâche : Créer le design de la page d'accueil",
        type: "success" as const,
        related_task_id: createdTasks[1].id,
      },
      {
        user_id: createdUsers[2].id,
        title: "Ajouté à une équipe",
        message: "Vous avez été ajouté à l'équipe DevOps",
        type: "info" as const,
        related_team_id: createdTeams[2].id,
      },
      {
        user_id: createdUsers[3].id,
        title: "Échéance proche",
        message: "La tâche 'Configurer le pipeline CI/CD' est due dans 3 jours",
        type: "warning" as const,
        related_task_id: createdTasks[2].id,
      }
    ];

    for (const notificationData of notifications) {
      await storage.createNotification(notificationData);
    }

    console.log("Created notifications");

    // Create sample comments
    const comments = [
      {
        content: "J'ai commencé à travailler sur cette tâche. J'aurai besoin de plus d'informations sur les exigences.",
        task_id: createdTasks[1].id,
        user_id: createdUsers[1].id,
      },
      {
        content: "Parfait ! J'ai ajouté plus de détails dans la description.",
        task_id: createdTasks[1].id,
        user_id: createdUsers[0].id,
      },
      {
        content: "Cette tâche est terminée. Prêt pour la revue de code.",
        task_id: createdTasks[0].id,
        user_id: createdUsers[0].id,
      },
      {
        content: "Je vais avoir besoin d'aide pour la configuration Docker.",
        task_id: createdTasks[2].id,
        user_id: createdUsers[2].id,
      }
    ];

    for (const commentData of comments) {
      await storage.createComment(commentData);
    }

    console.log("Created comments");

    console.log("Database seeding completed successfully!");
    console.log(`Created ${createdUsers.length} users, ${createdTeams.length} teams, ${createdTasks.length} tasks`);
    
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
