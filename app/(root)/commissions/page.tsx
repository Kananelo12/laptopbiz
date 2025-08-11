"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Download, Upload, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Commission, Sale, Laptop, Client } from "@/lib/data";
import * as XLSX from 'xlsx';

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [laptops, setLaptops] = useState<Laptop[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [formData, setFormData] = useState({
    saleId: "",
    earnerName: "",
    earnerContact: "",
    amount: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [commissionsRes, salesRes, laptopsRes, clientsRes] = await Promise.all([
        fetch("/api/commissions"),
        fetch("/api/sales"),
        fetch("/api/laptops"),
        fetch("/api/clients"),
      ]);

      if (!commissionsRes.ok || !salesRes.ok || !laptopsRes.ok || !clientsRes.ok) {
        if (commissionsRes.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch data");
      }

      const [commissionsData, salesData, laptopsData, clientsData] = await Promise.all([
        commissionsRes.json(),
        salesRes.json(),
        laptopsRes.json(),
        clientsRes.json(),
      ]);

      setCommissions(Array.isArray(commissionsData) ? commissionsData : []);
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

    const amount = parseFloat(formData.amount);
    if (isNaN(amount)) {
      toast.error("Amount must be a valid number");
      return;
    }

    try {
      const response = await fetch("/api/commissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to add commission");
        return;
      }

      toast.success("Commission added successfully");
      setIsAddDialogOpen(false);
      setFormData({
        saleId: "",
        earnerName: "",
        earnerContact: "",
        amount: "",
      });
      fetchData();
    } catch (error) {
      console.error("Error adding commission:", error);
      toast.error("Failed to add commission");
    }
  };

  const markAsPaid = async (commissionId: string) => {
    try {
      const response = await fetch(`/api/commissions/${commissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentStatus: "paid",
          payoutDate: new Date().toISOString().split("T")[0],
        }),
      });

      if (!response.ok) {
        toast.error("Failed to mark commission as paid");
        return;
      }

      toast.success("Commission marked as paid");
      fetchData();
    } catch (error) {
      console.error("Error updating commission:", error);
      toast.error("Failed to update commission");
    }
  };

  const exportToExcel = () => {
    const exportData = commissions.map(commission => {
      const sale = sales.find(s => s.id === commission.saleId);
      const laptop = sale ? laptops.find(l => l.id === sale.laptopId) : null;
      const client = sale ? clients.find(c => c.id === sale.clientId) : null;
      
      return {
        'Commission ID': commission.id,
        'Sale ID': commission.saleId,
        'Laptop': laptop ? `${laptop.corporateBrand} ${laptop.productBrand} ${laptop.sku}` : 'Unknown',
        'Client': client ? client.name : 'Unknown',
        'Earner Name': commission.earnerName,
        'Earner Contact': commission.earnerContact,
        'Amount': commission.amount,
        'Payment Status': commission.paymentStatus,
        'Payout Date': commission.payoutDate || '',
        'Created Date': new Date(commission.createdAt).toLocaleDateString(),
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Commissions");
    XLSX.writeFile(wb, `commissions_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Commissions data exported successfully");
  };

  const filteredCommissions = commissions.filter(commission => {
    const sale = sales.find(s => s.id === commission.saleId);
    const laptop = sale ? laptops.find(l => l.id === sale.laptopId) : null;
    const client = sale ? clients.find(c => c.id === sale.clientId) : null;
    const searchLower = searchTerm.toLowerCase();
    
    return (
      commission.earnerName.toLowerCase().includes(searchLower) ||
      commission.earnerContact.toLowerCase().includes(searchLower) ||
      (laptop && (laptop.corporateBrand.toLowerCase().includes(searchLower) || 
                  laptop.productBrand.toLowerCase().includes(searchLower))) ||
      (client && client.name.toLowerCase().includes(searchLower))
    );
  });

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default">Paid</Badge>;
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
      <Header title="Commission Management" description="Track and manage sales commissions">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Commission
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Commission</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="saleId">Related Sale</Label>
                  <select
                    id="saleId"
                    value={formData.saleId}
                    onChange={(e) =>
                      setFormData({ ...formData, saleId: e.target.value })
                    }
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="">Select a sale</option>
                    {sales.map((sale) => {
                      const laptop = laptops.find(l => l.id === sale.laptopId);
                      const client = clients.find(c => c.id === sale.clientId);
                      return (
                        <option key={sale.id} value={sale.id}>
                          Sale #{sale.id.slice(-6)} - {laptop ? `${laptop.corporateBrand} ${laptop.productBrand}` : 'Unknown'} - {client ? client.name : 'Unknown'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <Label htmlFor="earnerName">Earner Name</Label>
                  <Input
                    id="earnerName"
                    value={formData.earnerName}
                    onChange={(e) =>
                      setFormData({ ...formData, earnerName: e.target.value })
                    }
                    placeholder="Commission earner name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="earnerContact">Earner Contact</Label>
                  <Input
                    id="earnerContact"
                    value={formData.earnerContact}
                    onChange={(e) =>
                      setFormData({ ...formData, earnerContact: e.target.value })
                    }
                    placeholder="Phone or email"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="amount">Commission Amount (R)</Label>
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

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Add Commission</Button>
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
              placeholder="Search commissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommissions.map((commission) => {
            const sale = sales.find(s => s.id === commission.saleId);
            const laptop = sale ? laptops.find(l => l.id === sale.laptopId) : null;
            const client = sale ? clients.find(c => c.id === sale.clientId) : null;
            
            return (
              <Card key={commission.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">
                      R{commission.amount.toLocaleString()}
                    </CardTitle>
                    {getPaymentStatusBadge(commission.paymentStatus)}
                  </div>
                  <p className="text-sm text-gray-600">
                    {commission.earnerName}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Contact:</span>
                      <span className="font-medium">{commission.earnerContact}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sale:</span>
                      <span className="font-medium">#{commission.saleId.slice(-6)}</span>
                    </div>
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
                    {commission.payoutDate && (
                      <div className="flex justify-between">
                        <span>Paid Date:</span>
                        <span className="font-medium">
                          {new Date(commission.payoutDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  {commission.paymentStatus === 'pending' && (
                    <Button
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => markAsPaid(commission.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Paid
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredCommissions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No commissions found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}