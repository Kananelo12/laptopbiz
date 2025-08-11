"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Download, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Expense } from "@/lib/data";
import * as XLSX from 'xlsx';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "Transport" as "Transport" | "Food" | "Replacement parts" | "Misc",
    description: "",
    amount: "",
    tripBatch: "",
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await fetch("/api/expenses");
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to fetch expenses");
        setExpenses([]);
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        return;
      }

      setExpenses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Failed to fetch expenses");
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount);
    if (isNaN(amount)) {
      toast.error("Amount must be a valid number");
      return;
    }

    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount,
          tripBatch: formData.tripBatch || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to add expense");
        return;
      }

      toast.success("Expense added successfully");
      setIsAddDialogOpen(false);
      setFormData({
        date: new Date().toISOString().split("T")[0],
        category: "Transport",
        description: "",
        amount: "",
        tripBatch: "",
      });
      fetchExpenses();
    } catch (error) {
      console.error("Error adding expense:", error);
      toast.error("Failed to add expense");
    }
  };

  const exportToExcel = () => {
    const exportData = expenses.map(expense => ({
      'Date': expense.date,
      'Category': expense.category,
      'Description': expense.description,
      'Amount': expense.amount,
      'Trip Batch': expense.tripBatch || '',
      'Created Date': new Date(expense.createdAt).toLocaleDateString(),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, `expenses_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Expenses data exported successfully");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        for (const row of jsonData as any[]) {
          if (row.Date && row.Category && row.Description && row.Amount) {
            await fetch("/api/expenses", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                date: row.Date,
                category: row.Category,
                description: row.Description,
                amount: parseFloat(row.Amount),
                tripBatch: row['Trip Batch'] || "",
              }),
            });
          }
        }

        toast.success("Expenses imported successfully");
        fetchExpenses();
      } catch (error) {
        console.error("Import error:", error);
        toast.error("Failed to import expenses");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const filteredExpenses = expenses.filter(expense =>
    expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (expense.tripBatch && expense.tripBatch.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getCategoryBadge = (category: string) => {
    const colors = {
      Transport: "bg-blue-100 text-blue-800",
      Food: "bg-green-100 text-green-800",
      "Replacement parts": "bg-orange-100 text-orange-800",
      Misc: "bg-gray-100 text-gray-800",
    };
    return (
      <Badge className={colors[category as keyof typeof colors] || colors.Misc}>
        {category}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">Loading...</div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Expense Management" description="Track business expenses">
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImport}
            className="hidden"
            id="import-expenses"
          />
          <Button variant="outline" size="sm" onClick={() => document.getElementById('import-expenses')?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="amount">Amount (R)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: "Transport" | "Food" | "Replacement parts" | "Misc") =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Transport">Transport</SelectItem>
                      <SelectItem value="Food">Food</SelectItem>
                      <SelectItem value="Replacement parts">Replacement parts</SelectItem>
                      <SelectItem value="Misc">Misc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Expense description"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="tripBatch">Trip Batch</Label>
                  <Input
                    id="tripBatch"
                    value={formData.tripBatch}
                    onChange={(e) =>
                      setFormData({ ...formData, tripBatch: e.target.value })
                    }
                    placeholder="Optional trip batch identifier"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Add Expense</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </Header>

      <div className="p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              className="pl-10"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExpenses.map((expense) => (
            <Card key={expense.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">
                    R{expense.amount.toLocaleString()}
                  </CardTitle>
                  {getCategoryBadge(expense.category)}
                </div>
                <p className="text-sm text-gray-600">
                  {new Date(expense.date).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">{expense.description}</p>
                  {expense.tripBatch && (
                    <div className="text-xs text-gray-500">
                      Trip Batch: {expense.tripBatch}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 pt-2 border-t">
                    Added {new Date(expense.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredExpenses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No expenses found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}