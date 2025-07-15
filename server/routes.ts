import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  loginSchema, 
  insertTaskSchema, 
  insertTeamSchema, 
  updateUserSchema,
  type User 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication middleware
  const requireAuth = (req: Request, res: Response, next: any) => {
    console.log('Session debug:', {
      sessionId: req.sessionID,
      userId: req.session?.userId,
      sessionExists: !!req.session,
      cookies: req.headers.cookie,
      path: req.path
    });
    
    if (!req.session.userId) {
      console.log('Authentication failed - no session or userId');
      return res.status(401).json({ error: "Authentication required" });
    }
    console.log('Authentication successful for user:', req.session.userId);
    next();
  };

  // Register endpoint
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      console.log("Registration attempt:", { email: req.body?.email, hasPassword: !!req.body?.password });
      
      const validationResult = insertUserSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.log("Registration validation failed:", validationResult.error.errors);
        const firstError = validationResult.error.errors[0];
        return res.status(400).json({ 
          error: firstError.message || "Données invalides",
          details: validationResult.error.errors 
        });
      }
      
      const { email, password, full_name } = validationResult.data;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Un utilisateur avec cet email existe déjà" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        full_name: full_name || null,
      });

      // Set session
      req.session.userId = user.id;
      
      console.log("Registration successful for user:", email);
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      console.log("Login attempt:", { email: req.body?.email, hasPassword: !!req.body?.password });
      
      const validationResult = loginSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.log("Validation failed:", validationResult.error.errors);
        const firstError = validationResult.error.errors[0];
        return res.status(400).json({ 
          error: firstError.message || "Données invalides",
          details: validationResult.error.errors 
        });
      }
      
      const { email, password } = validationResult.data;
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log("User not found for email:", email);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      console.log("User found, checking password...");
      
      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        console.log("Invalid password for user:", email);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      console.log("Password valid, setting session...");
      
      // Set session
      req.session.userId = user.id;
      
      console.log("Login successful for user:", email);
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/auth/me", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update user profile
  app.put("/api/auth/profile", requireAuth, async (req: Request, res: Response) => {
    try {
      const updates = updateUserSchema.parse(req.body);
      const user = await storage.updateUser(req.session.userId!, updates);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(400).json({ error: "Invalid input" });
    }
  });

  // Get user stats
  app.get("/api/stats", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const [activeTasksCount, completedTasksCount, teamCount] = await Promise.all([
        storage.getUserActiveTasksCount(userId),
        storage.getUserCompletedTasksCount(userId),
        storage.getUserTeamCount(userId)
      ]);

      res.json({
        activeTasksCount,
        completedTasksCount,
        teamCount
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Task routes
  app.post("/api/tasks", requireAuth, async (req: Request, res: Response) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask({
        ...taskData,
        created_by: req.session.userId!
      });
      
      // Create notification for task creation
      await storage.createNotification({
        user_id: req.session.userId!,
        title: "Tâche créée",
        message: `Vous avez créé une nouvelle tâche : "${task.title}"`,
        type: "success",
        related_task_id: task.id,
      });
      
      // If task is assigned to someone else, notify them
      if (task.assigned_to && task.assigned_to !== req.session.userId!) {
        await storage.createNotification({
          user_id: task.assigned_to,
          title: "Nouvelle tâche assignée",
          message: `Une nouvelle tâche vous a été assignée : "${task.title}"`,
          type: "info",
          related_task_id: task.id,
        });
      }
      
      res.json({ task });
    } catch (error) {
      res.status(400).json({ error: "Invalid input" });
    }
  });

  app.get("/api/tasks", requireAuth, async (req: Request, res: Response) => {
    try {
      const { team_id } = req.query;
      
      if (team_id) {
        // Get team tasks
        const teamId = parseInt(team_id as string);
        const tasks = await storage.getTeamTasks(teamId);
        res.json({ tasks });
      } else {
        // Get user tasks
        const tasks = await storage.getTasks(req.session.userId!);
        res.json({ tasks });
      }
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/tasks/:id/status", requireAuth, async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!['todo', 'in_progress', 'completed'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const task = await storage.updateTaskStatus(taskId, status);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      res.json({ task });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/tasks/:id/priority", requireAuth, async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      const { priority } = req.body;
      
      if (!['low', 'medium', 'high'].includes(priority)) {
        return res.status(400).json({ error: "Invalid priority" });
      }

      const task = await storage.updateTaskPriority(taskId, priority);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      res.json({ task });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/tasks/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      const updates = req.body;
      
      const task = await storage.updateTask(taskId, updates);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      res.json({ task });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/tasks/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      const success = await storage.deleteTask(taskId);
      
      if (!success) {
        return res.status(404).json({ error: "Task not found" });
      }

      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Team routes
  app.post("/api/teams", requireAuth, async (req: Request, res: Response) => {
    try {
      const teamData = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam({
        ...teamData,
        created_by: req.session.userId!
      });
      res.json({ team });
    } catch (error) {
      res.status(400).json({ error: "Invalid input" });
    }
  });

  app.get("/api/teams", requireAuth, async (req: Request, res: Response) => {
    try {
      const teams = await storage.getUserTeams(req.session.userId!);
      res.json({ teams });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/teams/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.id);
      const team = await storage.getTeamById(teamId);
      
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      // Check if user is a member of this team
      const isMember = await storage.isTeamMember(teamId, req.session.userId!);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied" });
      }

      const members = await storage.getTeamMembers(teamId);
      const tasks = await storage.getTeamTasks(teamId);
      
      res.json({ team, members, tasks });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/teams/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.id);
      const updates = req.body;
      
      // Check if user is admin of this team
      const members = await storage.getTeamMembers(teamId);
      const userMember = members.find(m => m.user_id === req.session.userId!);
      
      if (!userMember || userMember.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const team = await storage.updateTeam(teamId, updates);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      res.json({ team });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/teams/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.id);
      
      // Check if user is admin of this team
      const members = await storage.getTeamMembers(teamId);
      const userMember = members.find(m => m.user_id === req.session.userId!);
      
      if (!userMember || userMember.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const success = await storage.deleteTeam(teamId);
      if (!success) {
        return res.status(404).json({ error: "Team not found" });
      }

      res.json({ message: "Team deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/users", requireAuth, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json({ users: safeUsers });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Notification routes
  app.get("/api/notifications", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any).userId;
      const limit = parseInt(req.query.limit as string) || 20;
      const notifications = await storage.getUserNotifications(userId, limit);
      res.json({ notifications });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/notifications/unread-count", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any).userId;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/notifications/:id/read", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.markNotificationAsRead(id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Notification not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/notifications/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteNotification(id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Notification not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Team member routes
  app.post("/api/teams/:teamId/members", requireAuth, async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const { userId, role } = req.body;
      
      const member = await storage.addTeamMember(teamId, userId, role);
      
      // Create notification for the new team member
      await storage.createNotification({
        user_id: userId,
        title: "Ajouté à une équipe",
        message: "Vous avez été ajouté à une nouvelle équipe",
        type: "info",
        related_team_id: teamId,
      });
      
      res.json({ member });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/teams/:teamId/members", requireAuth, async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      
      // Check if user is a member of this team
      const isMember = await storage.isTeamMember(teamId, req.session.userId!);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const members = await storage.getTeamMembers(teamId);
      
      // Get user details for each member
      const membersWithDetails = await Promise.all(
        members.map(async (member) => {
          const user = await storage.getUser(member.user_id);
          return {
            ...member,
            user: user ? { 
              id: user.id, 
              email: user.email, 
              full_name: user.full_name,
              avatar_url: user.avatar_url
            } : null
          };
        })
      );
      
      res.json({ members: membersWithDetails });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/teams/:teamId/members/:userId", requireAuth, async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const userId = parseInt(req.params.userId);
      const { role } = req.body;
      
      // Check if current user is admin of this team
      const members = await storage.getTeamMembers(teamId);
      const currentUserMember = members.find(m => m.user_id === req.session.userId!);
      
      if (!currentUserMember || currentUserMember.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const member = await storage.updateTeamMemberRole(teamId, userId, role);
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }
      
      res.json({ member });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/teams/:teamId/members/:userId", requireAuth, async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const userId = parseInt(req.params.userId);
      
      // Check if current user is admin of this team or removing themselves
      const members = await storage.getTeamMembers(teamId);
      const currentUserMember = members.find(m => m.user_id === req.session.userId!);
      
      if (!currentUserMember || (currentUserMember.role !== 'admin' && userId !== req.session.userId!)) {
        return res.status(403).json({ error: "Permission denied" });
      }
      
      const success = await storage.removeTeamMember(teamId, userId);
      if (!success) {
        return res.status(404).json({ error: "Member not found" });
      }
      
      res.json({ message: "Member removed successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Debug endpoint to view database contents
  app.get("/api/debug/tables", async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const teams = await storage.getUserTeams(1); // Get teams for user 1 as example
      const tasks = await storage.getTasks(1); // Get tasks for user 1 as example
      
      // Remove passwords from users for security
      const safeUsers = users.map(({ password, ...user }) => user);
      
      const debugData = {
        users: safeUsers,
        teams,
        tasks,
        userCount: users.length,
        teamCount: teams.length,
        taskCount: tasks.length
      };
      
      res.json(debugData);
    } catch (error) {
      console.error("Debug endpoint error:", error);
      res.status(500).json({ error: "Failed to fetch debug data" });
    }
  });

  // Comments routes
  app.get("/api/tasks/:taskId/comments", requireAuth, async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const task = await storage.getTaskById(taskId);
      if (!task) return res.status(404).json({ error: "Task not found" });
      // Optionnel: vérifier que l'utilisateur est membre de l'équipe si la tâche est liée à une équipe
      if (task.team_id) {
        const isMember = await storage.isTeamMember(task.team_id, req.session.userId!);
        if (!isMember) return res.status(403).json({ error: "Access denied" });
      }
      const comments = await storage.getCommentsForTask(taskId);
      res.json({ comments });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/tasks/:taskId/comments", requireAuth, async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const task = await storage.getTaskById(taskId);
      if (!task) return res.status(404).json({ error: "Task not found" });
      if (task.team_id) {
        const isMember = await storage.isTeamMember(task.team_id, req.session.userId!);
        if (!isMember) return res.status(403).json({ error: "Access denied" });
      }
      const { content } = req.body;
      if (!content || typeof content !== "string" || !content.trim()) {
        return res.status(400).json({ error: "Le commentaire ne peut pas être vide" });
      }
      const comment = await storage.createComment({
        content: content.trim(),
        task_id: taskId,
        user_id: req.session.userId!,
      });
      res.status(201).json({ comment });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/comments/:commentId", requireAuth, async (req: Request, res: Response) => {
    try {
      const commentId = parseInt(req.params.commentId);
      const success = await storage.deleteComment(commentId, req.session.userId!);
      if (!success) return res.status(403).json({ error: "Suppression non autorisée ou commentaire introuvable" });
      res.json({ message: "Commentaire supprimé" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
