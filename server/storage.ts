import { 
  users, teams, tasks, teamMembers,
  type User, type InsertUser, type UpdateUser,
  type Team, type InsertTeam,
  type Task, type InsertTask,
  type TeamMember
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: UpdateUser): Promise<User | undefined>;
  
  // Task methods
  createTask(task: InsertTask & { created_by: number }): Promise<Task>;
  getTasks(userId: number): Promise<Task[]>;
  getTaskById(id: number): Promise<Task | undefined>;
  updateTaskStatus(id: number, status: string, completedAt?: Date): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Team methods
  createTeam(team: InsertTeam & { created_by: number }): Promise<Team>;
  getUserTeams(userId: number): Promise<Team[]>;
  getTeamById(id: number): Promise<Team | undefined>;
  
  // Team member methods
  addTeamMember(teamId: number, userId: number, role?: string): Promise<TeamMember>;
  getUserTeamCount(userId: number): Promise<number>;
  
  // Stats methods
  getUserCompletedTasksCount(userId: number): Promise<number>;
  getUserActiveTasksCount(userId: number): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tasks: Map<number, Task>;
  private teams: Map<number, Team>;
  private teamMembers: Map<number, TeamMember>;
  private currentUserId: number;
  private currentTaskId: number;
  private currentTeamId: number;
  private currentTeamMemberId: number;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.teams = new Map();
    this.teamMembers = new Map();
    this.currentUserId = 1;
    this.currentTaskId = 1;
    this.currentTeamId = 1;
    this.currentTeamMemberId = 1;
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
}

export const storage = new MemStorage();
