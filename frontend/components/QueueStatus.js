import { useState, useEffect } from "react";
import { Users, Clock, User, Loader2, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Progress } from "./ui/progress";
import { apiFetch, getSocket } from "./utils/api";

export default function QueueStatus() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQueues = async () => {
    try {
      const res = await apiFetch("/queues/active");
      if (res.success) {
        const mapped = res.data.map((item) => {
          return {
            id: item.id_queue,
            queueNumber: item.queue_number.toString().padStart(3, "0"),
            customerName: item.customer_name || item.user.name,
            service: item.service.service_name,
            stylist: item.stylist.name,
            status: item.status,
            bookedTime: new Date(item.booking_time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
          };
        });
        setQueues(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch queues:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Socket.io Real-time integration
    const socket = getSocket();
    
    socket.on("connect", () => {
      console.log("WebSocket connected successfully for Live Queue Status.");
    });

    socket.on("NEW_QUEUE", (data) => {
      console.log("Socket Event received: NEW_QUEUE", data);
      fetchQueues();
    });

    socket.on("QUEUE_STATUS_UPDATED", (data) => {
      console.log("Socket Event received: QUEUE_STATUS_UPDATED", data);
      fetchQueues();
    });

    return () => {
      clearInterval(timer);
      socket.disconnect();
    };
  }, []);

  const inProgressQueues = queues.filter((q) => q.status === "IN_PROGRESS");
  const waitingQueues = queues.filter((q) => q.status === "PENDING");

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-gray-400">Menghubungkan ke server antrean...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Status Antrean Real-Time</h1>
          <p className="text-gray-400 text-lg">Pantau posisi antrean Anda secara langsung</p>
        </div>
        <Card className="md:w-fit bg-card/80 backdrop-blur-sm border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Waktu Saat Ini</p>
              <p className="text-3xl font-bold text-primary">
                {currentTime.toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6 items-stretch">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 h-full min-h-[150px] flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-400">Total Antrean</CardDescription>
            <CardTitle className="text-4xl text-primary font-bold">{queues.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Users className="h-4 w-4" />
              <span>Pelanggan aktif hari ini</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/30 h-full min-h-[150px] flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-400">Sedang Dikerjakan</CardDescription>
            <CardTitle className="text-4xl text-blue-400 font-bold">{inProgressQueues.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Dalam proses pelayanan</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/30 h-full min-h-[150px] flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-400">Menunggu</CardDescription>
            <CardTitle className="text-4xl text-yellow-400 font-bold">{waitingQueues.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="h-4 w-4" />
              <span>Dalam antrean ruang tunggu</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Queue Display */}
      <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
        <CardHeader className="border-b border-primary/10">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
            <CardTitle className="text-2xl">Sedang Dikerjakan</CardTitle>
          </div>
          <CardDescription className="text-gray-400">Nomor antrean yang sedang dilayani</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {inProgressQueues.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {inProgressQueues.map((queue) => (
                <Card key={queue.id} className="border-2 border-blue-500/50 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-5xl font-bold text-blue-400 mb-2">
                          #{queue.queueNumber}
                        </CardTitle>
                        <CardDescription className="text-lg text-gray-300">{queue.customerName}</CardDescription>
                      </div>
                      <Badge className="bg-blue-500 text-white">Dikerjakan</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Separator className="bg-blue-500/20" />
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Layanan</span>
                      <span className="font-semibold text-white">{queue.service}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Stylist</span>
                      <span className="font-semibold text-white">{queue.stylist}</span>
                    </div>
                    <Separator className="bg-blue-500/20" />
                    <div className="flex items-center gap-2 text-sm text-blue-400">
                      <Clock className="h-4 w-4" />
                      <span className="font-semibold">Estimasi pelayanan berlangsung</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Tidak ada antrean yang sedang dikerjakan saat ini</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Waiting Queue */}
      <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
        <CardHeader className="border-b border-primary/10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-400" />
                <CardTitle className="text-2xl">Antrean Menunggu</CardTitle>
              </div>
              <CardDescription className="text-gray-400 mt-1">Daftar pelanggan yang sedang menunggu giliran</CardDescription>
            </div>
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              {waitingQueues.length} Menunggu
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {waitingQueues.length > 0 ? (
            <div className="space-y-4">
              {waitingQueues.map((queue, index) => (
                <div key={queue.id}>
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 border border-primary/10 hover:border-primary/30 transition-colors">
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-yellow-500/30 to-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                        <span className="text-2xl font-bold text-yellow-400">#{queue.queueNumber}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-white text-lg truncate">{queue.customerName}</p>
                        <Badge variant="outline" className="ml-2 flex-shrink-0 border-primary/30 text-primary">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Posisi {index + 1}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <User className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{queue.stylist}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">Jadwal: Pukul {queue.bookedTime}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 truncate mb-2">{queue.service}</p>
                      <div className="mt-2">
                        <Progress value={Math.max(5, 100 - index * 15)} className="h-2 bg-secondary border border-primary/10 animate-pulse" />
                      </div>
                    </div>
                  </div>
                  {index < waitingQueues.length - 1 && <Separator className="my-4 bg-primary/10" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Tidak ada antrean yang menunggu</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
