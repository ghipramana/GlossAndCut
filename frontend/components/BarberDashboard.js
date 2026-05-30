import { useState, useEffect } from "react";
import { Play, CheckCircle, XCircle, Clock, User, Phone, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { apiFetch, getSocket } from "./utils/api";

export default function BarberDashboard({ user = {} }) {
  const [selectedBarber, setSelectedBarber] = useState("all");
  const [stylists, setStylists] = useState([]);
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const [stylistsRes, queuesRes] = await Promise.all([
        apiFetch("/stylists"),
        apiFetch("/queues") // Fetch all queues for today (active + completed)
      ]);

      if (stylistsRes.success) {
        setStylists(stylistsRes.data);
      }
      if (queuesRes.success) {
        const mapped = queuesRes.data.map((item) => ({
          id: item.id_queue,
          queueNumber: item.queue_number.toString().padStart(3, "0"),
          customerName: item.customer_name || item.user.name,
          phone: item.customer_phone || ("0812345678" + (item.id_user % 100).toString().padStart(2, "0")),
          service: item.service.service_name,
          stylist: item.stylist.name,
          id_stylist: item.id_stylist,
          stylistUserId: item.stylist.id_user,
          status: item.status,
          duration: item.service.est_duration,
          startTime: item.status === "IN_PROGRESS" ? new Date(item.created_at) : undefined
        }));
        setQueues(mapped);
      }
    } catch (err) {
      console.error("Barber Dashboard load error:", err);
      setError("Gagal terhubung ke backend server (localhost:5000).");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Setup Socket.io for live updates
    const socket = getSocket();

    socket.on("NEW_QUEUE", () => {
      console.log("WebSocket event: NEW_QUEUE received on Barber Dashboard.");
      loadData();
    });

    socket.on("QUEUE_STATUS_UPDATED", () => {
      console.log("WebSocket event: QUEUE_STATUS_UPDATED received on Barber Dashboard.");
      loadData();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      setError("");
      const res = await apiFetch(`/queues/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });

      if (res.success) {
        loadData();
      } else {
        setError(res.message || `Gagal mengubah status antrean menjadi ${status}.`);
      }
    } catch (err) {
      setError("Gagal menghubungi server backend.");
    }
  };

  // Filter queues based on stylist name selected
  const activeStylist = stylists.find(s => s.id_stylist.toString() === selectedBarber);
  const myQueues = queues.filter((q) => selectedBarber === "all" || q.stylist === activeStylist?.name);

  const waitingQueues = myQueues.filter((q) => q.status === "PENDING");
  const inProgressQueues = myQueues.filter((q) => q.status === "IN_PROGRESS");
  const completedQueues = myQueues.filter((q) => q.status === "COMPLETED");

  const totalAntreanCount = waitingQueues.length + inProgressQueues.length + completedQueues.length;

  const getElapsedTime = (startTime) => {
    if (!startTime) return "0";
    const elapsed = Math.floor((Date.now() - startTime.getTime()) / 60000);
    return Math.max(0, elapsed).toString();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-gray-400">Memuat dashboard antrean barber...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Kelola Antrean dan Layanan</h1>
          <p className="text-muted-foreground">Kelola antrean dan layanan pelanggan Anda</p>
        </div>
        <div className="w-full md:w-64">
          <Select value={selectedBarber} onValueChange={setSelectedBarber}>
            <SelectTrigger className="border-primary/20 bg-secondary/50 text-white">
              <SelectValue placeholder="Pilih Barber" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-primary/20 text-white">
              <SelectItem value="all">Semua Barber/Stylist</SelectItem>
              {stylists.map((barber) => (
                <SelectItem key={barber.id_stylist} value={barber.id_stylist.toString()}>
                  {barber.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/50">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-400">Total Antrean</CardDescription>
            <CardTitle className="text-4xl font-bold text-primary">{totalAntreanCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/30">
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-400">Menunggu</CardDescription>
            <CardTitle className="text-4xl font-bold text-yellow-400">{waitingQueues.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/30">
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-400">Sedang Dikerjakan</CardDescription>
            <CardTitle className="text-4xl font-bold text-blue-400">{inProgressQueues.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30">
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-400">Selesai</CardDescription>
            <CardTitle className="text-4xl font-bold text-green-400">{completedQueues.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="waiting" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-secondary/30 border border-primary/10 p-1.5 rounded-lg h-auto">
          <TabsTrigger value="waiting" className="data-[state=active]:bg-primary data-[state=active]:text-black text-gray-400 py-3 font-bold transition-all">
            Menunggu
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-gray-400 py-3 font-bold transition-all">
            Sedang Dikerjakan
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-400 py-3 font-bold transition-all">
            Selesai
          </TabsTrigger>
        </TabsList>

        {/* Tab Menunggu */}
        <TabsContent value="waiting" className="space-y-4 mt-6">
          {waitingQueues.length > 0 ? (
            waitingQueues.map((queue) => (
              <Card key={queue.id} className="bg-card/80 backdrop-blur-sm border-primary/20 shadow-xl">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-3xl font-bold text-primary">#{queue.queueNumber}</CardTitle>
                        <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                          Menunggu
                        </Badge>
                      </div>
                      <CardTitle className="text-xl font-bold text-white">{queue.customerName}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Phone className="h-4 w-4 text-primary" />
                        <span>{queue.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <User className="h-4 w-4 text-primary" />
                        <span>{queue.service} ({queue.stylist})</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Clock className="h-4 w-4 text-primary" />
                        <span>Durasi: {queue.duration} menit</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 w-full md:w-auto">
                      <Button
                        className="w-full md:w-auto bg-primary text-black font-bold hover:bg-primary/90 h-11 px-8 rounded-md transition-all shadow-lg shadow-primary/10 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:border-zinc-700 disabled:shadow-none"
                        onClick={() => handleUpdateStatus(queue.id, "IN_PROGRESS")}
                        disabled={queue.stylistUserId !== parseInt(user.id, 10) && user.role !== 'owner'}
                      >
                        <Play className="mr-2 h-4 w-4 fill-black disabled:fill-zinc-500" />
                        Mulai Layanan
                      </Button>
                      {queue.stylistUserId !== parseInt(user.id, 10) && user.role !== 'owner' && (
                        <span className="text-[11px] text-zinc-500 italic">Antrean Stylist Lain</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-card/40 border-primary/10">
              <CardContent className="py-12 text-center text-muted-foreground">
                Tidak ada antrean yang menunggu
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Sedang Dikerjakan */}
        <TabsContent value="in-progress" className="space-y-4 mt-6">
          {inProgressQueues.length > 0 ? (
            inProgressQueues.map((queue) => (
              <Card key={queue.id} className="border-blue-500/50 bg-gradient-to-br from-blue-950/10 to-transparent backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-3xl font-bold text-blue-400">#{queue.queueNumber}</CardTitle>
                        <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          Sedang Dikerjakan
                        </Badge>
                      </div>
                      <CardTitle className="text-xl font-bold text-white">{queue.customerName}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="bg-blue-950/40 border-blue-900/50 text-blue-200">
                    <Clock className="h-4 w-4 text-blue-400" />
                    <AlertDescription className="w-full">
                      <div className="flex justify-between items-center text-sm font-semibold">
                        <span>Waktu berjalan: {getElapsedTime(queue.startTime)} menit</span>
                        <span className="text-gray-400">Target: {queue.duration} menit</span>
                      </div>
                    </AlertDescription>
                  </Alert>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Phone className="h-4 w-4 text-blue-400" />
                        <span>{queue.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <User className="h-4 w-4 text-blue-400" />
                        <span>{queue.service} ({queue.stylist})</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 w-full md:w-auto">
                      <div className="flex items-center gap-3 w-full justify-end">
                        <Button
                          variant="outline"
                          className="flex-1 md:flex-none border-destructive text-destructive hover:bg-destructive/10 h-11 px-6 font-bold disabled:border-zinc-800 disabled:text-zinc-600 disabled:hover:bg-transparent"
                          onClick={() => handleUpdateStatus(queue.id, "CANCELLED")}
                          disabled={queue.stylistUserId !== parseInt(user.id, 10) && user.role !== 'owner'}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Batalkan
                        </Button>
                        <Button
                          className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white font-bold h-11 px-8 disabled:bg-zinc-800 disabled:text-zinc-500"
                          onClick={() => handleUpdateStatus(queue.id, "COMPLETED")}
                          disabled={queue.stylistUserId !== parseInt(user.id, 10) && user.role !== 'owner'}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Selesai
                        </Button>
                      </div>
                      {queue.stylistUserId !== parseInt(user.id, 10) && user.role !== 'owner' && (
                        <span className="text-[11px] text-zinc-500 italic mt-1">Antrean Stylist Lain</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-card/40 border-primary/10">
              <CardContent className="py-12 text-center text-muted-foreground">
                Tidak ada layanan yang sedang dikerjakan
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Selesai (Daftar Vertikal ke Bawah) */}
        <TabsContent value="completed" className="space-y-4 mt-6">
          {completedQueues.length > 0 ? (
            completedQueues.map((queue) => (
              <Card key={queue.id} className="border-green-500/30 bg-gradient-to-br from-green-950/5 to-transparent backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-3xl font-bold text-green-400">#{queue.queueNumber}</CardTitle>
                        <Badge className="bg-green-600/20 text-green-400 border border-green-600/30">
                          Selesai
                        </Badge>
                      </div>
                      <CardTitle className="text-xl font-bold text-white">{queue.customerName}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-green-400" />
                        <span>{queue.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-green-400" />
                        <span>{queue.service} ({queue.stylist})</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end text-green-400 font-bold text-base">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span>Layanan Telah Selesai</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-card/40 border-primary/10">
              <CardContent className="py-12 text-center text-muted-foreground">
                Belum ada layanan yang selesai hari ini
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
