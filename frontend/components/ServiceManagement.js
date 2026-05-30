import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Clock, DollarSign, Save, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { apiFetch } from "./utils/api";

export default function ServiceManagement() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteServiceId, setDeleteServiceId] = useState(null);
  const [editingService, setEditingService] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    duration: "",
    category: "Grooming & Haircut",
  });

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await apiFetch("/services");
      if (res.success) {
        const mapped = res.data.map((item) => ({
          id: item.id_service.toString(),
          name: item.service_name,
          price: parseFloat(item.price),
          duration: item.est_duration,
          category: item.service_name.toLowerCase().includes("cuci") || item.service_name.toLowerCase().includes("smooth") 
            ? "Premium Treatment" 
            : "Haircut & Shaving"
        }));
        setServices(mapped);
      } else {
        setError(res.message || "Gagal memuat layanan.");
      }
    } catch (err) {
      setError("Gagal terhubung ke backend server (localhost:5000).");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleAddService = async () => {
    if (!formData.name || !formData.price || !formData.duration) {
      alert("Semua field harus diisi!");
      return;
    }

    try {
      setError("");
      const res = await apiFetch("/services", {
        method: "POST",
        body: JSON.stringify({
          service_name: formData.name,
          price: parseFloat(formData.price),
          est_duration: parseInt(formData.duration, 10)
        })
      });

      if (res.success) {
        fetchServices();
        setFormData({ name: "", price: "", duration: "", category: "Grooming & Haircut" });
        setIsAddDialogOpen(false);
      } else {
        setError(res.message || "Gagal menyimpan layanan.");
      }
    } catch (err) {
      setError("Gagal menghubungi server untuk menambah layanan.");
    }
  };

  const handleEditService = async () => {
    if (!editingService) return;
    if (!formData.name || !formData.price || !formData.duration) {
      alert("Semua field harus diisi!");
      return;
    }

    try {
      setError("");
      const res = await apiFetch(`/services/${editingService.id}`, {
        method: "PUT",
        body: JSON.stringify({
          service_name: formData.name,
          price: parseFloat(formData.price),
          est_duration: parseInt(formData.duration, 10)
        })
      });

      if (res.success) {
        fetchServices();
        setFormData({ name: "", price: "", duration: "", category: "Grooming & Haircut" });
        setEditingService(null);
        setIsEditDialogOpen(false);
      } else {
        setError(res.message || "Gagal mengubah layanan.");
      }
    } catch (err) {
      setError("Gagal menghubungi server untuk mengupdate layanan.");
    }
  };

  const handleDeleteService = async (id) => {
    try {
      setError("");
      const res = await apiFetch(`/services/${id}`, {
        method: "DELETE"
      });

      if (res.success) {
        fetchServices();
      } else {
        setError(res.message || "Gagal menghapus layanan.");
      }
    } catch (err) {
      setError("Gagal menghubungi server untuk menghapus layanan.");
    } finally {
      setDeleteServiceId(null);
    }
  };

  const openEditDialog = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      price: service.price.toString(),
      duration: service.duration.toString(),
      category: service.category,
    });
    setIsEditDialogOpen(true);
  };

  const categories = Array.from(new Set(services.map((s) => s.category)));

  if (loading && services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-gray-400">Memuat katalog layanan salon...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manajemen Layanan</h1>
          <p className="text-muted-foreground">Kelola daftar layanan salon Anda</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-black font-bold hover:bg-primary/80">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Layanan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Layanan Baru</DialogTitle>
              <DialogDescription>Tambahkan layanan baru ke daftar salon</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="add-name">Nama Layanan</Label>
                <Input
                  id="add-name"
                  placeholder="Contoh: Potong Rambut Pria"
                  className="bg-secondary border-primary/20 text-white"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-price">Harga (Rp)</Label>
                  <Input
                    id="add-price"
                    type="number"
                    placeholder="50000"
                    className="bg-secondary border-primary/20 text-white"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-duration">Durasi (menit)</Label>
                  <Input
                    id="add-duration"
                    type="number"
                    placeholder="30"
                    className="bg-secondary border-primary/20 text-white"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 border-primary/30" onClick={() => setIsAddDialogOpen(false)}>
                <X className="mr-2 h-4 w-4" />
                Batal
              </Button>
              <Button className="flex-1 bg-primary text-black font-bold hover:bg-primary/80" onClick={handleAddService}>
                <Save className="mr-2 h-4 w-4" />
                Simpan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/50">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Layanan</CardDescription>
            <CardTitle className="text-3xl">{services.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Kategori Layanan</CardDescription>
            <CardTitle className="text-3xl">{categories.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Harga Rata-rata</CardDescription>
            <CardTitle className="text-3xl text-primary">
              Rp {services.length > 0 ? Math.round(services.reduce((acc, s) => acc + s.price, 0) / services.length).toLocaleString("id-ID") : "0"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Services by Category */}
      {categories.map((category) => {
        const categoryServices = services.filter((s) => s.category === category);
        return (
          <Card key={category} className="bg-card/80 backdrop-blur-sm border-primary/20">
            <CardHeader className="border-b border-primary/10">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl text-primary">{category}</CardTitle>
                  <CardDescription className="text-gray-400">{categoryServices.length} layanan</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {categoryServices.map((service, index) => (
                  <div key={service.id}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg text-white">{service.name}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-primary" />
                            <span>Rp {service.price.toLocaleString("id-ID")}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-primary" />
                            <span>{service.duration} menit</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-primary/20 hover:bg-primary/10 hover:text-primary"
                          onClick={() => openEditDialog(service)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-primary/20 hover:bg-destructive/10 text-red-500 hover:text-red-400"
                          onClick={() => setDeleteServiceId(service.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {index < categoryServices.length - 1 && <Separator className="mt-4 bg-primary/10" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Layanan</DialogTitle>
            <DialogDescription>Update informasi layanan</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nama Layanan</Label>
              <Input
                id="edit-name"
                className="bg-secondary border-primary/20 text-white"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price">Harga (Rp)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  className="bg-secondary border-primary/20 text-white"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-duration">Durasi (menit)</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  className="bg-secondary border-primary/20 text-white"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-primary/30"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingService(null);
              }}
            >
              <X className="mr-2 h-4 w-4" />
              Batal
            </Button>
            <Button className="flex-1 bg-primary text-black font-bold hover:bg-primary/80" onClick={handleEditService}>
              <Save className="mr-2 h-4 w-4" />
              Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteServiceId !== null} onOpenChange={() => setDeleteServiceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Layanan?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Layanan akan dihapus secara permanen dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-primary/20">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteServiceId && handleDeleteService(deleteServiceId)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
