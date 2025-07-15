import { 
  users, teams, tasks, teamMembers, notifications, comments,
  type User, type InsertUser, type UpdateUser,
  type Team, type InsertTeam,
  type Task, type InsertTask,
  type TeamMember,
  type Notification, type InsertNotification,
  type Comment, type InsertComment
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: UpdateUser): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Task methods
  createTask(task: InsertTask & { created_by: number }): Promise<Task>;
  getTasks(userId: number): Promise<Task[]>;
  getTaskById(id: number): Promise<Task | undefined>;
  updateTaskStatus(id: number, status: string, completedAt?: Date): Promise<Task | undefined>;
  updateTaskPriority(id: number, priority: string): Promise<Task | undefined>;
  updateTask(id: number, updates: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  getTeamTasks(teamId: number): Promise<Task[]>;
  
  // Team methods
  createTeam(team: InsertTeam & { created_by: number }): Promise<Team>;
  getUserTeams(userId: number): Promise<Team[]>;
  getTeamById(id: number): Promise<Team | undefined>;
  updateTeam(id: number, updates: Partial<InsertTeam>): Promise<Team | undefined>;
  deleteTeam(id: number): Promise<boolean>;
  
  // Team member methods
  addTeamMember(teamId: number, userId: number, role?: string): Promise<TeamMember>;
  getTeamMembers(teamId: number): Promise<TeamMember[]>;
  removeTeamMember(teamId: number, userId: number): Promise<boolean>;
  updateTeamMemberRole(teamId: number, userId: number, role: string): Promise<TeamMember | undefined>;
  getUserTeamCount(userId: number): Promise<number>;
  isTeamMember(teamId: number, userId: number): Promise<boolean>;
  
  // Stats methods
  getUserCompletedTasksCount(userId: number): Promise<number>;
  getUserActiveTasksCount(userId: number): Promise<number>;
  
  // Notification methods
  createNotification(notification: InsertNotification & { user_id: number }): Promise<Notification>;
  getUserNotifications(userId: number, limit?: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<boolean>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  deleteNotification(id: number): Promise<boolean>;

  // Comment methods
  createComment(comment: InsertComment & { user_id: number }): Promise<Comment>;
  getCommentsForTask(taskId: number): Promise<Comment[]>;
  deleteComment(commentId: number, userId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tasks: Map<number, Task>;
  private teams: Map<number, Team>;
  private teamMembers: Map<number, TeamMember>;
  private notifications: Map<number, Notification>;
  private comments: Map<number, Comment> = new Map();
  private currentUserId: number;
  private currentTaskId: number;
  private currentTeamId: number;
  private currentTeamMemberId: number;
  private currentNotificationId: number;
  private currentCommentId: number;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.teams = new Map();
    this.teamMembers = new Map();
    this.notifications = new Map();
    this.currentUserId = 1;
    this.currentTaskId = 1;
    this.currentTeamId = 1;
    this.currentTeamMemberId = 1;
    this.currentNotificationId = 1;
    this.currentCommentId = 1;
    
    // Create a test user for debugging
    this.createTestUser();
  }

  private async createTestUser() {
    try {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const testUser: User = {
        id: this.currentUserId++,
        email: 'test@example.com',
        password: hashedPassword,
        full_name: 'Utilisateur Test',
        avatar_url: null,
        created_at: new Date(),
        updated_at: new Date(),
      };
      
      this.users.set(testUser.id, testUser);
      console.log('Test user created: test@example.com / password123');
    } catch (error) {
      console.error('Failed to create test user:', error);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      full_name: insertUser.full_name || null,
      avatar_url: null,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: UpdateUser): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      ...updates,
      updated_at: new Date()
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Task methods
  async createTask(task: InsertTask & { created_by: number }): Promise<Task> {
    const id = this.currentTaskId++;
    const newTask: Task = {
      ...task,
      id,
      description: task.description || null,
      assigned_to: task.assigned_to || null,
      team_id: task.team_id || null,
      due_date: task.due_date || null,
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      completed_at: null,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.tasks.set(id, newTask);
    return newTask;
  }

  async getTasks(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.created_by === userId || task.assigned_to === userId
    );
  }

  async getTaskById(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async updateTaskStatus(id: number, status: string, completedAt?: Date): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updatedTask: Task = {
      ...task,
      status,
      completed_at: status === 'completed' ? (completedAt || new Date()) : null,
      updated_at: new Date()
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async updateTaskPriority(id: number, priority: string): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updatedTask: Task = {
      ...task,
      priority,
      updated_at: new Date()
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updatedTask: Task = {
      ...task,
      ...updates,
      updated_at: new Date()
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async getTeamTasks(teamId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.team_id === teamId
    );
  }

  // Team methods
  async createTeam(team: InsertTeam & { created_by: number }): Promise<Team> {
    const id = this.currentTeamId++;
    const newTeam: Team = {
      ...team,
      id,
      description: team.description || null,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.teams.set(id, newTeam);

    // Add creator as admin
    await this.addTeamMember(id, team.created_by, 'admin');
    
    return newTeam;
  }

  async getUserTeams(userId: number): Promise<Team[]> {
    const userTeamIds = Array.from(this.teamMembers.values())
      .filter(member => member.user_id === userId)
      .map(member => member.team_id);
    
    return Array.from(this.teams.values()).filter(team => 
      userTeamIds.includes(team.id)
    );
  }

  async getTeamById(id: number): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  // Team member methods
  async addTeamMember(teamId: number, userId: number, role: string = 'member'): Promise<TeamMember> {
    const id = this.currentTeamMemberId++;
    const member: TeamMember = {
      id,
      team_id: teamId,
      user_id: userId,
      role,
      joined_at: new Date()
    };
    this.teamMembers.set(id, member);
    return member;
  }

  async getUserTeamCount(userId: number): Promise<number> {
    return Array.from(this.teamMembers.values())
      .filter(member => member.user_id === userId).length;
  }

  async updateTeam(id: number, updates: Partial<InsertTeam>): Promise<Team | undefined> {
    const team = this.teams.get(id);
    if (!team) return undefined;

    const updatedTeam: Team = {
      ...team,
      ...updates,
      updated_at: new Date()
    };
    this.teams.set(id, updatedTeam);
    return updatedTeam;
  }

  async deleteTeam(id: number): Promise<boolean> {
    // Remove all team members first
    const teamMembers = Array.from(this.teamMembers.values())
      .filter(member => member.team_id === id);
    
    teamMembers.forEach(member => this.teamMembers.delete(member.id));
    
    // Remove team tasks
    const teamTasks = Array.from(this.tasks.values())
      .filter(task => task.team_id === id);
    
    teamTasks.forEach(task => this.tasks.delete(task.id));
    
    // Remove team
    return this.teams.delete(id);
  }

  async getTeamMembers(teamId: number): Promise<TeamMember[]> {
    return Array.from(this.teamMembers.values()).filter(
      (member) => member.team_id === teamId
    );
  }

  async removeTeamMember(teamId: number, userId: number): Promise<boolean> {
    const member = Array.from(this.teamMembers.values())
      .find(m => m.team_id === teamId && m.user_id === userId);
    
    if (!member) return false;
    
    return this.teamMembers.delete(member.id);
  }

  async updateTeamMemberRole(teamId: number, userId: number, role: string): Promise<TeamMember | undefined> {
    const member = Array.from(this.teamMembers.values())
      .find(m => m.team_id === teamId && m.user_id === userId);
    
    if (!member) return undefined;

    const updatedMember: TeamMember = {
      ...member,
      role
    };
    
    this.teamMembers.set(member.id, updatedMember);
    return updatedMember;
  }

  async isTeamMember(teamId: number, userId: number): Promise<boolean> {
    return Array.from(this.teamMembers.values())
      .some(member => member.team_id === teamId && member.user_id === userId);
  }

  // Stats methods
  async getUserCompletedTasksCount(userId: number): Promise<number> {
    return Array.from(this.tasks.values())
      .filter(task => 
        (task.created_by === userId || task.assigned_to === userId) && 
        task.status === 'completed'
      ).length;
  }

  async getUserActiveTasksCount(userId: number): Promise<number> {
    return Array.from(this.tasks.values())
      .filter(task => 
        (task.created_by === userId || task.assigned_to === userId) && 
        task.status !== 'completed'
      ).length;
  }

  // Notification methods
  async createNotification(notification: InsertNotification & { user_id: number }): Promise<Notification> {
    const newNotification: Notification = {
      id: this.currentNotificationId++,
      user_id: notification.user_id,
      title: notification.title,
      message: notification.message,
      type: notification.type || 'info',
      is_read: false,
      related_task_id: notification.related_task_id || null,
      related_team_id: notification.related_team_id || null,
      created_at: new Date(),
    };
    
    this.notifications.set(newNotification.id, newNotification);
    return newNotification;
  }

  async getUserNotifications(userId: number, limit: number = 20): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification) return false;
    
    const updatedNotification: Notification = {
      ...notification,
      is_read: true,
    };
    
    this.notifications.set(id, updatedNotification);
    return true;
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.user_id === userId && !notification.is_read)
      .length;
  }

  async deleteNotification(id: number): Promise<boolean> {
    return this.notifications.delete(id);
  }

  // Comment methods
  async createComment(comment: InsertComment & { user_id: number }): Promise<Comment> {
    const id = this.currentCommentId++;
    const newComment: Comment = {
      ...comment,
      id,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.comments.set(id, newComment);
    return newComment;
  }

  async getCommentsForTask(taskId: number): Promise<Comment[]> {
    return Array.from(this.comments.values()).filter(c => c.task_id === taskId);
  }

  async deleteComment(commentId: number, userId: number): Promise<boolean> {
    const comment = this.comments.get(commentId);
    if (!comment) return false;
    // Only author can delete (admin logic could be added)
    if (comment.user_id !== userId) return false;
    return this.comments.delete(commentId);
  }
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  async updateUser(id: number, updates: UpdateUser): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updated_at: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Task methods
  async createTask(task: InsertTask & { created_by: number }): Promise<Task> {
    const [newTask] = await db
      .insert(tasks)
      .values(task)
      .returning();
    return newTask;
  }

  async getTasks(userId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.created_by, userId));
  }

  async getTaskById(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async updateTaskStatus(id: number, status: string, completedAt?: Date): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set({
        status,
        completed_at: completedAt || null,
        updated_at: new Date(),
      })
      .where(eq(tasks.id, id))
      .returning();
    return task || undefined;
  }

  async updateTaskPriority(id: number, priority: string): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set({
        priority,
        updated_at: new Date(),
      })
      .where(eq(tasks.id, id))
      .returning();
    return task || undefined;
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set({
        ...updates,
        updated_at: new Date(),
      })
      .where(eq(tasks.id, id))
      .returning();
    return task || undefined;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return result.rowCount > 0;
  }

  async getTeamTasks(teamId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.team_id, teamId));
  }

  // Team methods
  async createTeam(team: InsertTeam & { created_by: number }): Promise<Team> {
    const [newTeam] = await db
      .insert(teams)
      .values(team)
      .returning();
    
    // Add the creator as an admin member
    await db.insert(teamMembers).values({
      team_id: newTeam.id,
      user_id: team.created_by,
      role: "admin",
    });
    
    return newTeam;
  }

  async getUserTeams(userId: number): Promise<Team[]> {
    return await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        created_by: teams.created_by,
        created_at: teams.created_at,
        updated_at: teams.updated_at,
      })
      .from(teams)
      .innerJoin(teamMembers, eq(teams.id, teamMembers.team_id))
      .where(eq(teamMembers.user_id, userId));
  }

  async getTeamById(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team || undefined;
  }

  async updateTeam(id: number, updates: Partial<InsertTeam>): Promise<Team | undefined> {
    const [team] = await db
      .update(teams)
      .set({
        ...updates,
        updated_at: new Date(),
      })
      .where(eq(teams.id, id))
      .returning();
    return team || undefined;
  }

  async deleteTeam(id: number): Promise<boolean> {
    const result = await db.delete(teams).where(eq(teams.id, id));
    return result.rowCount > 0;
  }

  // Team member methods
  async addTeamMember(teamId: number, userId: number, role: string = 'member'): Promise<TeamMember> {
    const [member] = await db
      .insert(teamMembers)
      .values({
        team_id: teamId,
        user_id: userId,
        role,
      })
      .returning();
    return member;
  }

  async getTeamMembers(teamId: number): Promise<TeamMember[]> {
    return await db
      .select({
        id: teamMembers.id,
        team_id: teamMembers.team_id,
        user_id: teamMembers.user_id,
        role: teamMembers.role,
        joined_at: teamMembers.joined_at,
        user: {
          id: users.id,
          email: users.email,
          full_name: users.full_name,
          avatar_url: users.avatar_url,
        },
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.user_id, users.id))
      .where(eq(teamMembers.team_id, teamId));
  }

  async removeTeamMember(teamId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(teamMembers)
      .where(and(eq(teamMembers.team_id, teamId), eq(teamMembers.user_id, userId)));
    return result.rowCount > 0;
  }

  async updateTeamMemberRole(teamId: number, userId: number, role: string): Promise<TeamMember | undefined> {
    const [member] = await db
      .update(teamMembers)
      .set({ role })
      .where(and(eq(teamMembers.team_id, teamId), eq(teamMembers.user_id, userId)))
      .returning();
    return member || undefined;
  }

  async getUserTeamCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(teamMembers)
      .where(eq(teamMembers.user_id, userId));
    return result[0]?.count || 0;
  }

  async isTeamMember(teamId: number, userId: number): Promise<boolean> {
    const [member] = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.team_id, teamId), eq(teamMembers.user_id, userId)));
    return !!member;
  }

  // Stats methods
  async getUserCompletedTasksCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(tasks)
      .where(and(eq(tasks.created_by, userId), eq(tasks.status, 'completed')));
    return result[0]?.count || 0;
  }

  async getUserActiveTasksCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(tasks)
      .where(and(eq(tasks.created_by, userId), sql`${tasks.status} != 'completed'`));
    return result[0]?.count || 0;
  }

  // Notification methods
  async createNotification(notification: InsertNotification & { user_id: number }): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async getUserNotifications(userId: number, limit: number = 20): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.user_id, userId))
      .orderBy(desc(notifications.created_at))
      .limit(limit);
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ is_read: true })
      .where(eq(notifications.id, id));
    return result.rowCount > 0;
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.user_id, userId), eq(notifications.is_read, false)));
    return result[0]?.count || 0;
  }

  async deleteNotification(id: number): Promise<boolean> {
    const result = await db.delete(notifications).where(eq(notifications.id, id));
    return result.rowCount > 0;
  }

  // Comment methods
  async createComment(comment: InsertComment & { user_id: number }): Promise<Comment> {
    const [newComment] = await db
      .insert(comments)
      .values(comment)
      .returning();
    return newComment;
  }

  async getCommentsForTask(taskId: number): Promise<Comment[]> {
    return await db
      .select({
        id: comments.id,
        content: comments.content,
        task_id: comments.task_id,
        user_id: comments.user_id,
        created_at: comments.created_at,
        updated_at: comments.updated_at,
        user: {
          id: users.id,
          email: users.email,
          full_name: users.full_name,
          avatar_url: users.avatar_url,
        },
      })
      .from(comments)
      .innerJoin(users, eq(comments.user_id, users.id))
      .where(eq(comments.task_id, taskId))
      .orderBy(desc(comments.created_at));
  }

  async deleteComment(commentId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(comments)
      .where(and(eq(comments.id, commentId), eq(comments.user_id, userId)));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
