
import { User } from '../types';
import { mockUsers } from '../data/mockData';

let users: User[] = [...mockUsers];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const userService = {
  async getAllUsers(): Promise<User[]> {
    await delay(500);
    return users;
  },

  async getUserById(id: string): Promise<User | undefined> {
    await delay(300);
    return users.find(u => u.id === id);
  },

  async getUserBySlug(slug: string): Promise<User | undefined> {
    await delay(300);
    return users.find(u => u.slug === slug);
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    await delay(800);
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    users[userIndex] = { ...users[userIndex], ...updates };
    return users[userIndex];
  },
};