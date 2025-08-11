"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, TrendingUp, TrendingDown, DollarSign, Package } from "lucide-react";
import { Sale, Laptop, Client, Expense, Commission } from "@/lib/data";
import * as XLSX from 'xlsx';
import { toast } from "sonner";

export default function ReportsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [laptops, setLaptops] = useState<Laptop[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [salesRes, laptopsRes, clientsRes, expensesRes, commissionsRes] = await Promise.all([
        fetch("/api/sales"),
        fetch("/api/laptops"),
        fetch("/api/clients"),
        fetch("/api/expenses"),
        fetch("/api/commissions"),
      ]);

      if (!salesRes.ok || !laptopsRes.ok || !clientsRes.ok || !expensesRes.ok || !commissionsRes.ok) {
        if (salesRes.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch data");
      }

      const [salesData, laptopsData, clientsData, expensesData, commissionsData] = await Promise.all([
        salesRes.json(),
        laptopsRes.json(),
        clientsRes.json(),
        expensesRes.json(),
        commissionsRes.json(),
      ]);

      setSales(Array.isArray(salesData) ? salesData : []);
      setLaptops(Array.isArray(laptopsData) ? laptopsData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setExpenses(Array.isArray(expensesData) ? expensesData : []);
      setCommissions(Array.isArray(commissionsData) ? commissionsData : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const generateReport = () => {
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.salePrice, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalCommissions = commissions.reduce((sum, commission) => sum + commission.amount, 0);
    const netProfit = totalRevenue - totalExpenses - totalCommissions;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const thisMonthSales = sales.filter(sale => {
      const saleDate = new Date(sale.saleDate);
      return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
    });

    const thisMonthRevenue = thisMonthSales.reduce((sum, sale) => sum + sale.salePrice, 0);
    const thisMonthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    }).reduce((sum, expense) => sum + expense.amount, 0);

    const availableStock = laptops.filter(l => l.status === 'available').reduce((sum, l) => sum + l.quantity, 0);
    const soldLaptops = laptops.filter(l => l.status === 'sold').length;

    return {
      totalRevenue,
      totalExpenses,
      totalCommissions,
      netProfit,
      thisMonthRevenue,
      thisMonthExpenses,
      thisMonthSales: thisMonthSales.length,
      availableStock,
      soldLaptops,
      totalClients: clients.length,
      pendingCommissions: commissions.filter(c => c.paymentStatus === 'pending').length,
    };
  };

  const exportFullReport = () => {
    const report = generateReport();
    
    // Summary sheet
    const summaryData = [
      { Metric: 'Total Revenue', Value: report.totalRevenue },
      { Metric: 'Total Expenses', Value: report.totalExpenses },
      { Metric: 'Total Commissions', Value: report.totalCommissions },
      { Metric: 'Net Profit', Value: report.netProfit },
      { Metric: 'This Month Revenue', Value: report.thisMonthRevenue },
      { Metric: 'This Month Expenses', Value: report.thisMonthExpenses },
      { Metric: 'This Month Sales', Value: report.thisMonthSales },
      { Metric: 'Available Stock', Value: report.availableStock },
      { Metric: 'Sold Laptops', Value: report.soldLaptops },
      { Metric: 'Total Clients', Value: report.totalClients },
      { Metric: 'Pending Commissions', Value: report.pendingCommissions },
    ];

    // Sales data
    const salesData = sales.map(sale => {
      const laptop = laptops.find(l => l.id === sale.laptopId);
      const client = clients.find(c => c.id === sale.clientId);
      return {
        'Sale ID': sale.id,
        'Date': sale.saleDate,
        'Laptop': laptop ? `${laptop.corporateBrand} ${laptop.productBrand} ${laptop.sku}` : 'Unknown',
        'Client': client ? client.name : 'Unknown',
        'Sale Price': sale.salePrice,
        'Payment Status': sale.paymentStatus,
        'Payment Method': sale.paymentMethod,
      };
    });

    // Expenses data
    const expensesData = expenses.map(expense => ({
      'Date': expense.date,
      'Category': expense.category,
      'Description': expense.description,
      'Amount': expense.amount,
      'Trip Batch': expense.tripBatch || '',
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();
    
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");
    
    const salesWs = XLSX.utils.json_to_sheet(salesData);
    XLSX.utils.book_append_sheet(wb, salesWs, "Sales");
    
    const expensesWs = XLSX.utils.json_to_sheet(expensesData);
    XLSX.utils.book_append_sheet(wb, expensesWs, "Expenses");

    XLSX.writeFile(wb, `business_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Full business report exported successfully");
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">Loading...</div>
    );
  }

  const report = generateReport();

  const stats = [
    {
      title: 'Total Revenue',
      value: `R${report.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Expenses',
      value: `R${report.totalExpenses.toLocaleString()}`,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Net Profit',
      value: `R${report.netProfit.toLocaleString()}`,
      icon: TrendingUp,
      color: report.netProfit >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: report.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'
    },
    {
      title: 'This Month Revenue',
      value: `R${report.thisMonthRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'This Month Sales',
      value: report.thisMonthSales.toString(),
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Available Stock',
      value: report.availableStock.toString(),
      icon: Package,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Business Reports" description="Comprehensive business analytics and reports">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportFullReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Full Report
          </Button>
        </div>
      </Header>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Total Clients</span>
                <span className="font-semibold">{report.totalClients}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Laptops Sold</span>
                <span className="font-semibold">{report.soldLaptops}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Pending Commissions</span>
                <span className="font-semibold">{report.pendingCommissions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Commission Amount</span>
                <span className="font-semibold">R{report.totalCommissions.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Average Sale Price</span>
                <span className="font-semibold">
                  R{sales.length > 0 ? Math.round(report.totalRevenue / sales.length).toLocaleString() : '0'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Profit Margin</span>
                <span className="font-semibold">
                  {report.totalRevenue > 0 ? Math.round((report.netProfit / report.totalRevenue) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>This Month Profit</span>
                <span className="font-semibold">
                  R{(report.thisMonthRevenue - report.thisMonthExpenses).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Stock Turnover</span>
                <span className="font-semibold">
                  {laptops.length > 0 ? Math.round((report.soldLaptops / laptops.length) * 100) : 0}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}