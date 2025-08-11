import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Laptop, 
  DollarSign, 
  Users, 
  TrendingUp,
  Package,
  Receipt,
  AlertCircle
} from 'lucide-react';
import { getLaptops, getSales, getClients, getExpenses, getCommissions } from '@/lib/data';

async function getDashboardData() {
  const [laptops, sales, clients, expenses, commissions] = await Promise.all([
    getLaptops(),
    getSales(),
    getClients(),
    getExpenses(), 
    getCommissions()
  ]);

  const availableStock = laptops.filter(l => l.status === 'available').reduce((sum, l) => sum + l.quantity, 0);
  const soldThisMonth = sales.filter(s => {
    const saleDate = new Date(s.saleDate);
    const now = new Date();
    return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
  }).length;

  const totalRevenue = sales.reduce((sum, s) => sum + s.salePrice, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  
  const outstandingCommissions = commissions
    .filter(c => c.paymentStatus === 'pending')
    .reduce((sum, c) => sum + c.amount, 0);

  return {
    availableStock,
    soldThisMonth,
    totalClients: clients.length,
    netProfit,
    outstandingCommissions,
    lowStockItems: laptops.filter(l => l.quantity <= 2 && l.status === 'available').length
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  const stats = [
    {
      title: 'Available Stock',
      value: data.availableStock.toString(),
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Sold This Month',
      value: data.soldThisMonth.toString(),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Clients',
      value: data.totalClients.toString(),
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Net Profit',
      value: `R${data.netProfit.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Outstanding Commissions',
      value: `R${data.outstandingCommissions.toLocaleString()}`,
      icon: Receipt,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Low Stock Alerts',
      value: data.lowStockItems.toString(),
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  return (
    <div className="flex-1 overflow-auto">
      <Header 
        title="Dashboard" 
        description="Overview of your laptop business operations"
      />
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <a 
                href="/stock"
                className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Laptop className="h-5 w-5 text-blue-600 mr-3" />
                <span>Add New Laptop</span>
              </a>
              <a 
                href="/sales"
                className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <DollarSign className="h-5 w-5 text-green-600 mr-3" />
                <span>Record Sale</span>
              </a>
              <a 
                href="/expenses"
                className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Receipt className="h-5 w-5 text-red-600 mr-3" />
                <span>Add Expense</span>
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center text-gray-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  System initialized and ready for use
                </div>
                <div className="flex items-center text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Dashboard loaded successfully
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}