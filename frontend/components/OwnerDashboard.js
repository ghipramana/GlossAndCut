import { useState, useEffect } from "react";
import { TrendingUp, Users, DollarSign, Clock, Award, Calendar, Loader2, Plus, Edit, Trash2, Save, X, RefreshCw, Scissors, ToggleLeft, ToggleRight, CheckCircle, AlertTriangle, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { apiFetch } from "./utils/api";
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

export default function OwnerDashboard() {
  const [activeSubTab, setActiveSubTab] = useState("services");
  const [activeMainTab, setActiveMainTab] = useState("laporan");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Report Stats
  const [stats, setStats] = useState({
    weeklyRevenue: 0,
    totalReservations: 0,
    completedReservations: 0,
    bestService: "Belum ada layanan",
    servicePopularity: [],
    stylistPerformance: []
  });

  // Master Data State
  const [services, setServices] = useState([]);
  const [stylists, setStylists] = useState([]);

  // Service Forms Dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteServiceId, setDeleteServiceId] = useState(null);
  const [editingService, setEditingService] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    duration: ""
  });

  const [opHours, setOpHours] = useState({
    operational_start: "08:00",
    operational_end: "22:00"
  });
  const [isSavingOpHours, setIsSavingOpHours] = useState(false);

  // Premium Charts Mock Data for Visuals
  const weeklyData = [
    { day: "Sen", customers: 35, revenue: 2450000 },
    { day: "Sel", customers: 42, revenue: 2980000 },
    { day: "Rab", customers: 38, revenue: 2650000 },
    { day: "Kam", customers: 45, revenue: 3100000 },
    { day: "Jum", customers: 52, revenue: 3680000 },
    { day: "Sab", customers: 68, revenue: 4850000 },
    { day: "Min", customers: 47, revenue: 3250000 },
  ];

  const peakHours = [
    { time: "08:00", customers: 3 },
    { time: "10:00", customers: 8 },
    { time: "12:00", customers: 10 },
    { time: "14:00", customers: 9 },
    { time: "16:00", customers: 14 },
    { time: "18:00", customers: 13 },
    { time: "20:00", customers: 4 },
  ];

  const fetchReports = async () => {
    try {
      setError("");
      const res = await apiFetch("/queues/reports?period=weekly");
      if (res.success) {
        setStats({
          weeklyRevenue: res.data.weeklyRevenue || 0,
          totalReservations: res.data.totalReservations || 0,
          completedReservations: res.data.completedReservations || 0,
          bestService: res.data.bestService || "Belum ada layanan",
          servicePopularity: res.data.servicePopularity || [],
          stylistPerformance: res.data.stylistPerformance || []
        });
      } else {
        setError(res.message || "Gagal memuat analitik laporan.");
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Gagal terhubung ke server backend untuk laporan.");
    }
  };

  const fetchServices = async () => {
    try {
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
      }
    } catch (err) {
      console.error("Error fetching services:", err);
    }
  };

  const fetchStylists = async () => {
    try {
      const res = await apiFetch("/stylists");
      if (res.success) {
        setStylists(res.data);
      }
    } catch (err) {
      console.error("Error fetching stylists:", err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await apiFetch("/settings");
      if (res.success) {
        setOpHours({
          operational_start: res.data.operational_start || "08:00",
          operational_end: res.data.operational_end || "22:00"
        });
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([fetchReports(), fetchServices(), fetchStylists(), fetchSettings()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleToggleStylistStatus = async (id_stylist, currentStatus) => {
    try {
      const newStatus = currentStatus === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";
      const res = await apiFetch(`/stylists/${id_stylist}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus })
      });
      if (res.success) {
        await Promise.all([fetchStylists(), fetchReports()]);
      } else {
        alert(res.message || "Gagal memperbarui status stylist.");
      }
    } catch (err) {
      console.error("Error toggling stylist status:", err);
      alert("Gagal menghubungi server untuk update status.");
    }
  };

  const handleAddService = async () => {
    if (!formData.name || !formData.price || !formData.duration) {
      alert("Semua field harus diisi!");
      return;
    }

    try {
      const res = await apiFetch("/services", {
        method: "POST",
        body: JSON.stringify({
          service_name: formData.name,
          price: parseFloat(formData.price),
          est_duration: parseInt(formData.duration, 10)
        })
      });

      if (res.success) {
        await fetchServices();
        setFormData({ name: "", price: "", duration: "" });
        setIsAddDialogOpen(false);
      } else {
        alert(res.message || "Gagal menambahkan layanan.");
      }
    } catch (err) {
      console.error("Error adding service:", err);
    }
  };

  const handleEditService = async () => {
    if (!editingService) return;
    if (!formData.name || !formData.price || !formData.duration) {
      alert("Semua field harus diisi!");
      return;
    }

    try {
      const res = await apiFetch(`/services/${editingService.id}`, {
        method: "PUT",
        body: JSON.stringify({
          service_name: formData.name,
          price: parseFloat(formData.price),
          est_duration: parseInt(formData.duration, 10)
        })
      });

      if (res.success) {
        await fetchServices();
        setFormData({ name: "", price: "", duration: "" });
        setEditingService(null);
        setIsEditDialogOpen(false);
      } else {
        alert(res.message || "Gagal mengubah layanan.");
      }
    } catch (err) {
      console.error("Error editing service:", err);
    }
  };

  const handleDeleteService = async (id) => {
    try {
      const res = await apiFetch(`/services/${id}`, {
        method: "DELETE"
      });

      if (res.success) {
        await fetchServices();
      } else {
        alert(res.message || "Gagal menghapus layanan.");
      }
    } catch (err) {
      console.error("Error deleting service:", err);
    } finally {
      setDeleteServiceId(null);
    }
  };

  const openEditDialog = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      price: service.price.toString(),
      duration: service.duration.toString()
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveOpHours = async () => {
    setIsSavingOpHours(true);
    try {
      const res = await apiFetch("/settings", {
        method: "PUT",
        body: JSON.stringify(opHours)
      });
      if (res.success) {
        alert("Jam operasional berhasil disimpan.");
      } else {
        alert("Gagal menyimpan jam operasional.");
      }
    } catch (err) {
      alert("Error saat menyimpan jam operasional.");
    } finally {
      setIsSavingOpHours(false);
    }
  };

  const categories = Array.from(new Set(services.map((s) => s.category)));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-gray-400">Menyusun laporan analitik & master data...</p>
      </div>
    );
  }

  // Calculate completion rate percentage
  const completionRate = stats.completionRate !== undefined
    ? stats.completionRate
    : (stats.totalReservations > 0 
        ? Math.round((stats.completedReservations / stats.totalReservations) * 100)
        : 0);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-white">Laporan dan Data Master</h1>
          <p className="text-muted-foreground">Kelola data master dan pantau performa salon per minggu</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-primary/20 text-gray-300 hover:bg-secondary" onClick={loadAllData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/40 px-3 py-1.5 rounded-lg border border-primary/10">
            <Calendar className="h-4 w-4 text-primary" />
            <span>Periode: {(() => { const now = new Date(); const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay() + 1); const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6); const fmt = (d) => d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }); return `${fmt(startOfWeek)} - ${fmt(endOfWeek)} ${now.getFullYear()}`; })()}</span>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/50">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-secondary/80 border border-primary/20 p-1 mb-8 max-w-md mx-auto relative z-10 cursor-pointer pointer-events-auto">
          <TabsTrigger value="laporan" className="data-[state=active]:bg-primary data-[state=active]:text-black font-bold cursor-pointer">
            Laporan Mingguan
          </TabsTrigger>
          <TabsTrigger value="datamaster" className="data-[state=active]:bg-primary data-[state=active]:text-black font-bold cursor-pointer">
            Kelola Data Master
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Real-Time Reports */}
        <TabsContent value="laporan" className="space-y-8">
          {/* Summary Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30 flex flex-col justify-between">
              <CardHeader className="pb-3">
                <CardDescription className="text-gray-400">Pendapatan Minggu Ini</CardDescription>
                <CardTitle className="text-3xl text-green-400 font-bold">
                  Rp {stats.weeklyRevenue.toLocaleString("id-ID")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-green-500">
                  <TrendingUp className="h-4 w-4" />
                  <span>Omset minggu ini dari antrean selesai</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 flex flex-col justify-between">
              <CardHeader className="pb-3">
                <CardDescription className="text-gray-400">Total Antrean Minggu Ini</CardDescription>
                <CardTitle className="text-3xl text-primary font-bold">{stats.totalReservations} Antrean</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-primary">
                  <CheckCircle className="h-4 w-4" />
                  <span>{stats.completedReservations} selesai diproses</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/30 flex flex-col justify-between">
              <CardHeader className="pb-3">
                <CardDescription className="text-gray-400">Layanan Terlaris</CardDescription>
                <CardTitle className="text-2xl text-blue-400 font-bold truncate" title={stats.bestService}>
                  {stats.bestService}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-blue-400">
                  <Award className="h-4 w-4" />
                  <span>Favorit pelanggan minggu ini</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/30 flex flex-col justify-between">
              <CardHeader className="pb-3">
                <CardDescription className="text-gray-400">Tingkat Penyelesaian</CardDescription>
                <CardTitle className="text-3xl text-yellow-400 font-bold">{completionRate}%</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-yellow-400">
                  <Activity className="h-4 w-4" />
                  <span>Rasio pengerjaan antrean</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Reports Grid */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Service Popularity */}
            <Card className="bg-card/85 border-primary/20">
              <CardHeader>
                <CardTitle className="text-white text-xl">Tingkat Kepopuleran Layanan</CardTitle>
                <CardDescription className="text-gray-400">Daftar peringkat layanan berdasarkan jumlah booking minggu ini</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  {stats.servicePopularity.length > 0 ? (
                    stats.servicePopularity.map((service, index) => {
                      const totalCount = stats.servicePopularity.reduce((acc, s) => acc + s.count, 0);
                      const percent = totalCount > 0 ? Math.round((service.count / totalCount) * 100) : 0;
                      
                      let barColor = "bg-primary";
                      if (index === 0) barColor = "bg-primary";
                      else if (index === 1) barColor = "bg-blue-500";
                      else if (index === 2) barColor = "bg-green-500";
                      else barColor = "bg-gray-600";

                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-secondary text-primary font-bold border border-primary/10">{index + 1}</Badge>
                              <span className="font-medium text-white">{service.name}</span>
                            </div>
                            <span className="text-gray-400">{service.count} booking ({percent}%)</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${barColor}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      Belum ada pemesanan layanan minggu ini.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Barber Productivity */}
            <Card className="bg-card/85 border-primary/20">
              <CardHeader>
                <CardTitle className="text-white text-xl">Produktivitas Staff Barber</CardTitle>
                <CardDescription className="text-gray-400">Total pelanggan dan omset masing-masing stylist minggu ini</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {stats.stylistPerformance.length > 0 ? (
                    stats.stylistPerformance.map((stylist, index) => {
                      const efficiencyPercent = stylist.totalTasks > 0
                        ? Math.round((stylist.completedTasks / stylist.totalTasks) * 100)
                        : 0;

                      return (
                        <div key={index} className="p-4 rounded-lg bg-secondary/30 border border-primary/10 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-white text-base">{stylist.name}</h4>
                              <p className="text-xs text-gray-400">{stylist.specialty} • <span className={stylist.status === "AVAILABLE" ? "text-green-400" : "text-red-400 font-semibold"}>{stylist.status === "AVAILABLE" ? "Aktif" : "Sibuk/Nonaktif"}</span></p>
                            </div>
                            <Badge className="bg-primary/20 text-primary border-primary/30 font-bold">
                              Total Pelanggan: {stylist.completedTasks}
                            </Badge>
                          </div>

                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Omset Kontribusi</span>
                            <span className="font-semibold text-green-400">Rp {stylist.revenue.toLocaleString("id-ID")}</span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-400">Efisiensi Kerja</span>
                              <span className="font-semibold text-primary">{efficiencyPercent}%</span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${efficiencyPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      Belum ada aktivitas barber minggu ini.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Master Data Management */}
        <TabsContent value="datamaster" className="space-y-6">
          {/* Sub Navigation */}
          <div className="flex gap-4 border-b border-primary/10 pb-4 flex-wrap">
            <Button
              variant={activeSubTab === "services" ? "default" : "outline"}
              className={activeSubTab === "services" ? "bg-primary text-black font-bold" : "border-primary/20 text-gray-300"}
              onClick={() => setActiveSubTab("services")}
            >
              <Scissors className="h-4 w-4 mr-2" />
              Katalog Layanan
            </Button>
            <Button
              variant={activeSubTab === "stylists" ? "default" : "outline"}
              className={activeSubTab === "stylists" ? "bg-primary text-black font-bold" : "border-primary/20 text-gray-300"}
              onClick={() => setActiveSubTab("stylists")}
            >
              <Users className="h-4 w-4 mr-2" />
              Kelola Status Stylist
            </Button>
            <Button
              variant={activeSubTab === "settings" ? "default" : "outline"}
              className={activeSubTab === "settings" ? "bg-primary text-black font-bold" : "border-primary/20 text-gray-300"}
              onClick={() => setActiveSubTab("settings")}
            >
              <Clock className="h-4 w-4 mr-2" />
              Jam Operasional
            </Button>
          </div>

          {/* Sub Content 1: Katalog Layanan */}
          {activeSubTab === "services" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">Katalog Layanan</h3>
                  <p className="text-sm text-gray-400">Total {services.length} layanan terdaftar dalam database</p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary text-black font-bold hover:bg-primary/80">
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Layanan
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card text-white border border-primary/20">
                    <DialogHeader>
                      <DialogTitle>Tambah Layanan Baru</DialogTitle>
                      <DialogDescription className="text-gray-400">Tambahkan perawatan baru ke dalam catalog salon</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="add-name">Nama Layanan</Label>
                        <Input
                          id="add-name"
                          placeholder="Contoh: Hair Wash Premium"
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

              {/* Service List Grid */}
              <div className="grid gap-6">
                <Card className="bg-secondary/20 border-primary/10">
                  <CardHeader className="border-b border-primary/10 py-4">
                    <CardTitle className="text-lg text-primary">Daftar Layanan</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="divide-y divide-primary/10">
                      {services.length > 0 ? (
                        services.map((service) => (
                          <div key={service.id} className="flex items-center justify-between py-3">
                            <div className="space-y-1">
                              <h4 className="font-semibold text-white">{service.name}</h4>
                              <div className="flex gap-4 text-xs text-gray-400">
                                <span>Rp {service.price.toLocaleString("id-ID")}</span>
                                <span>•</span>
                                <span>{service.duration} menit</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
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
                        ))
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          Belum ada katalog layanan terdaftar.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Sub Content 2: Kelola Status Stylist */}
          {activeSubTab === "stylists" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white">Kelola Status Stylist</h3>
                <p className="text-sm text-gray-400">Monitor barber aktif dan ubah status operasional mereka</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {stylists.length > 0 ? (
                  stylists.map((stylist) => {
                    const isAvailable = stylist.status?.toUpperCase() === "AVAILABLE";
                    return (
                      <Card key={stylist.id_stylist} className="bg-secondary/20 border-primary/15 hover:border-primary/30 transition-all">
                        <CardContent className="p-6 flex justify-between items-center">
                          <div className="space-y-2">
                            <div>
                              <h4 className="font-bold text-white text-lg">{stylist.name}</h4>
                              <p className="text-sm text-gray-400">{stylist.specialty}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={isAvailable ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}>
                                {isAvailable ? "AKTIF MELAYANI" : "SIBUK / NONAKTIF"}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <span className="text-xs text-gray-500 uppercase tracking-wider">Ubah Status</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-12 w-12 text-primary hover:bg-primary/10 rounded-full"
                              onClick={() => handleToggleStylistStatus(stylist.id_stylist, stylist.status)}
                            >
                              {isAvailable ? (
                                <ToggleRight className="h-10 w-10 text-green-400" />
                              ) : (
                                <ToggleLeft className="h-10 w-10 text-gray-500" />
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <div className="col-span-2 text-center py-12 text-gray-500 bg-secondary/15 rounded-lg border border-primary/10">
                    Tidak ada staff barber terdaftar dalam sistem.
                  </div>
                )}
              </div>

              {/* Alert Warning for Real-time constraint */}
              <Alert className="bg-yellow-500/10 border-yellow-500/20 w-full text-yellow-500">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                <AlertDescription className="text-sm text-gray-300">
                  <strong className="text-yellow-500">Catatan Penting:</strong> Mengubah status ketersediaan barber ke <span className="font-semibold text-red-400">SIBUK/NONAKTIF (UNAVAILABLE)</span> secara otomatis menyembunyikan barber dari formulir reservasi pelanggan agar tidak terjadi tabrakan pemesanan.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Sub Content 3: Jam Operasional */}
          {activeSubTab === "settings" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white">Pengaturan Jam Operasional</h3>
                <p className="text-sm text-gray-400">Tentukan jam buka dan tutup salon. Booking pelanggan hanya dapat dilakukan di rentang waktu ini.</p>
              </div>

              <Card className="bg-secondary/20 border-primary/10 max-w-2xl">
                <CardContent className="p-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="op-start" className="text-gray-300">Jam Buka</Label>
                      <div className="relative">
                        <Input
                          id="op-start"
                          type="time"
                          className="bg-secondary border-primary/20 focus:border-primary text-white h-12 pl-10"
                          value={opHours.operational_start}
                          onChange={(e) => setOpHours({ ...opHours, operational_start: e.target.value })}
                        />
                        <Clock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="op-end" className="text-gray-300">Jam Tutup</Label>
                      <div className="relative">
                        <Input
                          id="op-end"
                          type="time"
                          className="bg-secondary border-primary/20 focus:border-primary text-white h-12 pl-10"
                          value={opHours.operational_end}
                          onChange={(e) => setOpHours({ ...opHours, operational_end: e.target.value })}
                        />
                        <Clock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-primary/10 flex justify-end">
                    <Button 
                      className="bg-primary hover:bg-primary/90 text-black font-bold px-8" 
                      onClick={handleSaveOpHours}
                      disabled={isSavingOpHours}
                    >
                      {isSavingOpHours ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Simpan Jam Operasional
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Service Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card text-white border border-primary/20">
          <DialogHeader>
            <DialogTitle>Edit Layanan</DialogTitle>
            <DialogDescription className="text-gray-400">Update informasi layanan catalog</DialogDescription>
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
        <AlertDialogContent className="bg-card text-white border border-primary/20">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Layanan?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Tindakan ini tidak dapat dibatalkan. Layanan akan dihapus secara permanen dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-primary/20 hover:bg-secondary">Batal</AlertDialogCancel>
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
