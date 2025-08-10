import fs from 'fs/promises';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');

export interface User {
  id: string;
  username: string;
  name: string;
  password: string;
  createdAt: string;
}

export interface Laptop {
  id: string;
  corporateBrand: string;
  productBrand: string;
  performanceTier: 'i3' | 'i5' | 'i7';
  generation: string;
  sku: string;
  purchasePrice: number;
  conditionNotes: string;
  quantity: number;
  status: 'available' | 'sold' | 'reserved';
  purchaseDate: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  date: string;
  category: 'Transport' | 'Food' | 'Replacement parts' | 'Misc';
  description: string;
  amount: number;
  tripBatch?: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  laptopId: string;
  clientId: string;
  salePrice: number;
  paymentStatus: 'pending' | 'partial' | 'paid';
  paymentMethod: 'cash' | 'transfer' | 'card';
  saleDate: string;
  commissionEarner?: string;
  commissionAmount?: number;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  referralSource?: string;
  purchaseHistory: string[];
  supportTickets: string[];
  createdAt: string;
}

export interface Commission {
  id: string;
  saleId: string;
  earnerName: string;
  earnerContact: string;
  amount: number;
  paymentStatus: 'pending' | 'paid';
  payoutDate?: string;
  createdAt: string;
}

async function readJSONFile<T>(filename: string): Promise<T[]> {
  try {
    const filePath = path.join(dataDir, filename);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeJSONFile<T>(filename: string, data: T[]): Promise<void> {
  const filePath = path.join(dataDir, filename);
  const tempFilePath = `${filePath}.tmp`;
  
  try {
    await fs.writeFile(tempFilePath, JSON.stringify(data, null, 2));
    await fs.rename(tempFilePath, filePath);
  } catch (error) {
    // Clean up temp file if it exists
    try {
      await fs.unlink(tempFilePath);
    } catch {}
    throw error;
  }
}

// Data access functions
export const getUsers = () => readJSONFile<User>('users.json');
export const getLaptops = () => readJSONFile<Laptop>('laptops.json');
export const getExpenses = () => readJSONFile<Expense>('expenses.json');
export const getSales = () => readJSONFile<Sale>('sales.json');
export const getClients = () => readJSONFile<Client>('clients.json');
export const getCommissions = () => readJSONFile<Commission>('commissions.json');

export const saveLaptops = (data: Laptop[]) => writeJSONFile('laptops.json', data);
export const saveExpenses = (data: Expense[]) => writeJSONFile('expenses.json', data);
export const saveSales = (data: Sale[]) => writeJSONFile('sales.json', data);
export const saveClients = (data: Client[]) => writeJSONFile('clients.json', data);
export const saveCommissions = (data: Commission[]) => writeJSONFile('commissions.json', data);