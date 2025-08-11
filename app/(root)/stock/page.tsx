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
import { Laptop } from "@/lib/data";

export default function StockPage() {
  const [laptops, setLaptops] = useState<Laptop[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [formData, setFormData] = useState({
    corporateBrand: "",
    productBrand: "",
    performanceTier: "i5" as "i3" | "i5" | "i7",
    generation: "",
    sku: "",
    purchasePrice: "",
    conditionNotes: "",
    quantity: "1",
    purchaseDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchLaptops();
  }, []);

  const fetchLaptops = async () => {
    try {
      const response = await fetch("/api/laptops");
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to fetch laptops");
        setLaptops([]);
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        return;
      }

      setLaptops(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching laptops:", error);
      toast.error("Failed to fetch laptops");
      setLaptops([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const price = parseFloat(formData.purchasePrice);
    const qty = parseInt(formData.quantity, 10);
    if (isNaN(price) || isNaN(qty)) {
      toast.error("Price and Quantity must be valid numbers");
      return;
    }

    try {
      const response = await fetch("/api/laptops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          purchasePrice: price,
          quantity: qty,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to add laptop");
        return;
      }

      toast.success("Laptop added successfully");
      setIsAddDialogOpen(false);
      setFormData({
        corporateBrand: "",
        productBrand: "",
        performanceTier: "i5",
        generation: "",
        sku: "",
        purchasePrice: "",
        conditionNotes: "",
        quantity: "1",
        purchaseDate: new Date().toISOString().split("T")[0],
      });
      fetchLaptops();
    } catch (error) {
      console.error("Error adding laptop:", error);
      toast.error("Failed to add laptop");
    }
  };

  const filteredLaptops = laptops.filter(
    (laptop) =>
      laptop.corporateBrand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      laptop.productBrand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      laptop.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string, quantity: number) => {
    if (status === "sold") return <Badge variant="secondary">Sold</Badge>;
    if (status === "reserved") return <Badge variant="outline">Reserved</Badge>;
    if (quantity <= 2) return <Badge variant="destructive">Low Stock</Badge>;
    return <Badge variant="default">Available</Badge>;
  };

  const getSuggestedPrice = (tier: string) => {
    switch (tier) {
      case "i3":
        return 4500;
      case "i5":
        return 5800;
      case "i7":
        return 6500;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">Loading...</div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <Header
        title="Stock Management"
        description="Manage your laptop inventory"
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Laptop
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Laptop</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="corporateBrand">Corporate Brand</Label>
                  <Input
                    id="corporateBrand"
                    value={formData.corporateBrand}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        corporateBrand: e.target.value,
                      })
                    }
                    placeholder="e.g., Dell, HP, Lenovo"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="productBrand">Product Brand</Label>
                  <Input
                    id="productBrand"
                    value={formData.productBrand}
                    onChange={(e) =>
                      setFormData({ ...formData, productBrand: e.target.value })
                    }
                    placeholder="e.g., ThinkPad, Latitude"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="performanceTier">Performance Tier</Label>
                  <Select
                    value={formData.performanceTier}
                    onValueChange={(value: "i3" | "i5" | "i7") =>
                      setFormData({ ...formData, performanceTier: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="i3">i3</SelectItem>
                      <SelectItem value="i5">i5</SelectItem>
                      <SelectItem value="i7">i7</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="generation">Generation</Label>
                    <Input
                      id="generation"
                      value={formData.generation}
                      onChange={(e) =>
                        setFormData({ ...formData, generation: e.target.value })
                      }
                      placeholder="e.g., 8th Gen"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) =>
                        setFormData({ ...formData, sku: e.target.value })
                      }
                      placeholder="Product SKU"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="purchasePrice">Purchase Price (R)</Label>
                    <Input
                      id="purchasePrice"
                      type="number"
                      value={formData.purchasePrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          purchasePrice: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) =>
                      setFormData({ ...formData, purchaseDate: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="conditionNotes">Condition Notes</Label>
                  <Textarea
                    id="conditionNotes"
                    value={formData.conditionNotes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        conditionNotes: e.target.value,
                      })
                    }
                    placeholder="Any condition notes or issues"
                  />
                </div>

                <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded">
                  Suggested selling price: R
                  {getSuggestedPrice(formData.performanceTier).toLocaleString()}
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Add Laptop</Button>
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
              placeholder="Search laptops..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLaptops.map((laptop) => (
            <Card key={laptop.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">
                    {laptop.corporateBrand} {laptop.productBrand}
                  </CardTitle>
                  {getStatusBadge(laptop.status, laptop.quantity)}
                </div>
                <p className="text-sm text-gray-600">
                  {laptop.performanceTier} • {laptop.generation}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>SKU:</span>
                    <span className="font-medium">{laptop.sku}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Purchase Price:</span>
                    <span className="font-medium">
                      R{laptop.purchasePrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quantity:</span>
                    <span className="font-medium">{laptop.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Suggested Price:</span>
                    <span className="font-medium text-green-600">
                      R
                      {getSuggestedPrice(
                        laptop.performanceTier
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
                {laptop.conditionNotes && (
                  <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                    {laptop.conditionNotes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredLaptops.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No laptops found matching your search.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
