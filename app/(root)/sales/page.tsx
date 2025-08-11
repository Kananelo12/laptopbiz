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
import { toast } from "sonner";
import { Sale, Laptop, Client } from "@/lib/data";
import * as XLSX from 'xlsx';

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [laptops, setLaptops] = useState<Laptop[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [formData, setFormData] = useState({
    laptopId: "",
    clientId: "",
    salePrice: "",
    paymentStatus: "pending" as "pending" | "partial" | "paid",
    paymentMethod: "cash" as "cash" | "transfer" | "card",
    saleDate: new Date().toISOString().split("T")[0],
    commissionEarner: "",
    commissionAmount: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [salesRes, laptopsRes, clientsRes] = await Promise.all([
        fetch("/api/sales"),
        fetch("/api/laptops"),
        fetch("/api/clients"),
      ]);

      if (!salesRes.ok || !laptopsRes.ok || !clientsRes.ok) {
        if (salesRes.status === 401 || laptopsRes.status === 401 || clientsRes.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch data");
      }

      const [salesData, laptopsData, clientsData] = await Promise.all([
        salesRes.json(),
        laptopsRes.json(),
        clientsRes.json(),
      ]);

      setSales(Array.isArray(salesData) ? salesData : []);
      setLaptops(Array.isArray(laptopsData) ? laptopsData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const price = parseFloat(formData.salePrice);
    const commissionAmt = formData.commissionAmount ? parseFloat(formData.commissionAmount) : 0;
    
    if (isNaN(price)) {
      toast.error("Sale price must be a valid number");
      return;
    }

    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          salePrice: price,
          commissionAmount: commissionAmt || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to add sale");
        return;
      }

      toast.success("Sale recorded successfully");
      setIsAddDialogOpen(false);
      setFormData({
        laptopId: "",
        clientId: "",
        salePrice: "",
        paymentStatus: "pending",
        paymentMethod: "cash",
        saleDate: new Date().toISOString().split("T")[0],
        commissionEarner: "",
        commissionAmount: "",
      });
      fetchData();
    } catch (error) {
      console.error("Error adding sale:", error);
      toast.error("Failed to add sale");
    }
  };

  const exportToExcel = () => {
    const exportData = sales.map(sale => {
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
        'Commission Earner': sale.commissionEarner || '',
        'Commission Amount': sale.commissionAmount || 0,
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales");
    XLSX.writeFile(wb, `sales_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Sales data exported successfully");
  };

  const filteredSales = sales.filter(sale => {
    const laptop = laptops.find(l => l.id === sale.laptopId);
    const client = clients.find(c => c.id === sale.clientId);
    const searchLower = searchTerm.toLowerCase();
    
    return (
      sale.id.toLowerCase().includes(searchLower) ||
      (laptop && (laptop.corporateBrand.toLowerCase().includes(searchLower) || 
                  laptop.productBrand.toLowerCase().includes(searchLower) ||
                  laptop.sku.toLowerCase().includes(searchLower))) ||
      (client && client.name.toLowerCase().includes(searchLower))
    );
  });

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default">Paid</Badge>;
      case "partial":
        return <Badge variant="outline">Partial</Badge>;
      case "pending":
        return <Badge variant="destructive">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">Loading...</div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Sales Management" description="Track and manage sales">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Record Sale
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Record New Sale</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="laptopId">Laptop</Label>
                  <Select
                    value={formData.laptopId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, laptopId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select laptop" />
                    </SelectTrigger>
                    <SelectContent>
                      {laptops
                        .filter(l => l.status === 'available' && l.quantity > 0)
                        .map((laptop) => (
                        <SelectItem key={laptop.id} value={laptop.id}>
                          {laptop.corporateBrand} {laptop.productBrand} - {laptop.sku}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="clientId">Client</Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, clientId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} - {client.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="salePrice">Sale Price (R)</Label>
                    <Input
                      id="salePrice"
                      type="number"
                      value={formData.salePrice}
                      onChange={(e) =>
                        setFormData({ ...formData, salePrice: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="saleDate">Sale Date</Label>
                    <Input
                      id="saleDate"
                      type="date"
                      value={formData.saleDate}
                      onChange={(e) =>
                        setFormData({ ...formData, saleDate: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="paymentStatus">Payment Status</Label>
                    <Select
                      value={formData.paymentStatus}
                      onValueChange={(value: "pending" | "partial" | "paid") =>
                        setFormData({ ...formData, paymentStatus: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value: "cash" | "transfer" | "card") =>
                        setFormData({ ...formData, paymentMethod: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="commissionEarner">Commission Earner</Label>
                    <Input
                      id="commissionEarner"
                      value={formData.commissionEarner}
                      onChange={(e) =>
                        setFormData({ ...formData, commissionEarner: e.target.value })
                      }
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <Label htmlFor="commissionAmount">Commission Amount (R)</Label>
                    <Input
                      id="commissionAmount"
                      type="number"
                      value={formData.commissionAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, commissionAmount: e.target.value })
                      }
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Record Sale</Button>
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
              placeholder="Search sales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSales.map((sale) => {
            const laptop = laptops.find(l => l.id === sale.laptopId);
            const client = clients.find(c => c.id === sale.clientId);
            
            return (
              <Card key={sale.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">
                      Sale #{sale.id.slice(-6)}
                    </CardTitle>
                    {getPaymentStatusBadge(sale.paymentStatus)}
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(sale.saleDate).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Laptop:</span>
                      <span className="font-medium">
                        {laptop ? `${laptop.corporateBrand} ${laptop.productBrand}` : 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Client:</span>
                      <span className="font-medium">
                        {client ? client.name : 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sale Price:</span>
                      <span className="font-medium text-green-600">
                        R{sale.salePrice.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment:</span>
                      <span className="font-medium capitalize">
                        {sale.paymentMethod}
                      </span>
                    </div>
                    {sale.commissionEarner && (
                      <div className="flex justify-between">
                        <span>Commission:</span>
                        <span className="font-medium">
                          {sale.commissionEarner} - R{sale.commissionAmount?.toLocaleString() || 0}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredSales.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No sales found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}