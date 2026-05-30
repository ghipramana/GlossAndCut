import { useState, useEffect } from "react";
import { Calendar, Clock, TrendingUp, Users, Scissors, Award, History, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { apiFetch } from "./utils/api";

export default function Dashboard({ user, onNavigate }) {
  if (user.role === "customer") {
    return <CustomerDashboard user={user} onNavigate={onNavigate} />;
  } else if (user.role === "barber") {
    return <BarberDashboardOverview user={user} onNavigate={onNavigate} />;
  } else if (user.role === "owner") {
    return <OwnerDashboardOverview user={user} onNavigate={onNavigate} />;
  }

  return null;
}

function CustomerDashboard({ user, onNavigate }) {
  const [activeBookings, setActiveBookings] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveBooking = async () => {
    try {
      const res = await apiFetch("/queues/active");
      if (res.success) {
        // Find all active queues for this user
        const myBookings = res.data.filter((q) => q.id_user.toString() === user.id.toString());
        if (myBookings.length > 0) {
          const formattedBookings = myBookings.map(myBooking => {
            const waitTimeMs = new Date(myBooking.booking_time).getTime() - Date.now();
            const waitTimeMins = Math.max(0, Math.round(waitTimeMs / 60000));
            
            return {
              id: myBooking.id_queue,
              queueNumber: myBooking.queue_number.toString().padStart(3, "0"),
              service: myBooking.service.service_name,
              stylist: myBooking.stylist.name,
              customerName: myBooking.customer_name || myBooking.user.name,
              customerPhone: myBooking.customer_phone || ("0812345678" + (myBooking.id_user % 100).toString().padStart(2, "0")),
              date: new Date(myBooking.booking_time).toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
              time: new Date(myBooking.booking_time).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              estimatedWait: waitTimeMins,
              status: myBooking.status, // PENDING or IN_PROGRESS
            };
          });
          setActiveBookings(formattedBookings);
        } else {
          setActiveBookings([]);
        }
      }
    } catch (err) {
      console.error("Failed to load active booking:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await apiFetch("/queues/history");
      if (res.success) {
        const mappedHistory = res.data.map((h) => {
          const dateObj = new Date(h.created_at);
          const formattedDate = dateObj.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric"
          });
          
          return {
            id: h.id_queue,
            service: h.service.service_name,
            stylist: h.stylist.name,
            date: formattedDate,
            price: "Rp " + h.service.price.toLocaleString("id-ID"),
            status: h.status
          };
        });
        setHistoryList(mappedHistory);
      }
    } catch (err) {
      console.error("Failed to load user booking history:", err);
    }
  };

  useEffect(() => {
    fetchActiveBooking();
    fetchHistory();
    // Poll every 10 seconds to keep waiting time estimates accurate
    const interval = setInterval(fetchActiveBooking, 10000);
    return () => clearInterval(interval);
  }, [user.id]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">
          Selamat Datang, <span className="text-primary">{user.name}</span>!
        </h1>
        <p className="text-gray-400 text-lg">Kelola booking dan lihat riwayat layanan Anda</p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 cursor-pointer hover:border-primary/50 transition-all group" onClick={() => onNavigate("booking")}>
          <CardHeader>
            <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center mb-3 group-hover:bg-primary/30 transition-colors">
              <Calendar className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-xl">Booking Antrean</CardTitle>
            <CardDescription className="text-gray-400">Ambil nomor antrean baru</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-primary hover:bg-primary/90 text-black font-bold" size="sm">
              Booking Sekarang
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/30 cursor-pointer hover:border-blue-500/50 transition-all group" onClick={() => onNavigate("queue")}>
          <CardHeader>
            <div className="w-14 h-14 rounded-lg bg-blue-500/20 flex items-center justify-center mb-3 group-hover:bg-blue-500/30 transition-colors">
              <Clock className="h-7 w-7 text-blue-400" />
            </div>
            <CardTitle className="text-xl">Status Antrean</CardTitle>
            <CardDescription className="text-gray-400">Cek posisi antrean real-time</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10" size="sm">
              Lihat Status
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30 cursor-pointer hover:border-green-500/50 transition-all group">
          <CardHeader>
            <div className="w-14 h-14 rounded-lg bg-green-500/20 flex items-center justify-center mb-3 group-hover:bg-green-500/30 transition-colors">
              <History className="h-7 w-7 text-green-400" />
            </div>
            <CardTitle className="text-xl">Riwayat</CardTitle>
            <CardDescription className="text-gray-400">Lihat riwayat kunjungan</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10" size="sm">
              Lihat Riwayat
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Active Bookings - Only visible when customer has booked */}
      {activeBookings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-primary text-black">Active</Badge>
            <h2 className="text-2xl font-bold">Antrean Aktif Anda</h2>
          </div>
          {activeBookings.map(booking => (
            <Card key={booking.id} className="border-2 border-primary/50 bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-5xl font-bold text-primary">#{booking.queueNumber}</h3>
                        <Badge className={
                          booking.status === "PENDING"
                            ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                            : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        }>
                          {booking.status === "PENDING" ? "Menunggu" : "Dikerjakan"}
                        </Badge>
                      </div>
                      <p className="text-xl font-semibold text-white mb-1">{booking.service}</p>
                      <p className="text-gray-400">dengan {booking.stylist}</p>
                      <div className="mt-3 space-y-1 text-sm text-gray-300 border-t border-primary/10 pt-2">
                        <p>Pelanggan: <strong className="text-white">{booking.customerName}</strong></p>
                        <p>Nomor Telepon: <strong className="text-white">{booking.customerPhone}</strong></p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400 mb-1">{booking.date}</p>
                      <p className="text-2xl font-bold text-primary">{booking.time}</p>
                    </div>
                  </div>
                  <Separator className="bg-primary/20" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Estimasi tunggu: {booking.estimatedWait} menit</span>
                    </div>
                    <Button className="bg-primary hover:bg-primary/90 text-black font-bold" onClick={() => onNavigate("queue")}>
                      Lihat Detail
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Booking History */}
      <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
        <CardHeader className="border-b border-primary/10">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Riwayat Kunjungan</CardTitle>
              <CardDescription className="text-gray-400">Histori layanan yang pernah Anda ambil</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10">
              Lihat Semua
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {historyList.length > 0 ? (
              historyList.map((history, index) => (
                <div key={history.id}>
                  <div className="flex justify-between items-center p-4 rounded-lg bg-secondary/30 border border-primary/10 hover:border-primary/30 transition-colors">
                    <div>
                      <p className="font-semibold text-white text-lg">{history.service}</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {history.stylist} • {history.date} •{" "}
                        <span className={
                          history.status === "COMPLETED"
                            ? "text-green-400"
                            : history.status === "CANCELLED"
                            ? "text-red-400"
                            : history.status === "IN_PROGRESS"
                            ? "text-blue-400"
                            : "text-yellow-400"
                        }>
                          {history.status === "COMPLETED"
                            ? "Selesai"
                            : history.status === "CANCELLED"
                            ? "Dibatalkan"
                            : history.status === "IN_PROGRESS"
                            ? "Dikerjakan"
                            : "Menunggu"}
                        </span>
                      </p>
                    </div>
                    <p className="font-bold text-primary text-xl">{history.price}</p>
                  </div>
                  {index < historyList.length - 1 && <Separator className="my-4 bg-primary/10" />}
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-400">
                <Scissors className="h-10 w-10 mx-auto mb-3 opacity-40 text-primary animate-pulse" />
                <p>Belum ada riwayat booking. Ayo buat booking pertama Anda!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BarberDashboardOverview({ user, onNavigate }) {
  const [stats, setStats] = useState({
    todayStats: {
      totalQueue: 0,
      completed: 0,
      waiting: 0,
      inProgress: 0
    },
    totalServed: 0,
    completionRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBarberStats = async () => {
      try {
        const res = await apiFetch("/queues/barber-stats");
        if (res.success) {
          setStats(res.data);
        }
      } catch (err) {
        console.error("Failed to load barber stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBarberStats();
    const interval = setInterval(fetchBarberStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">
          Selamat Datang, <span className="text-primary">{user.name}</span>!
        </h1>
        <p className="text-gray-400 text-lg">Kelola antrean dan layanan pelanggan Anda</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 items-stretch">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 h-full min-h-[150px] flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-400">Total Antrean Hari Ini</CardDescription>
            <CardTitle className="text-4xl text-primary font-bold">{stats.todayStats.totalQueue}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Users className="h-4 w-4" />
              <span>Pelanggan</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30 h-full min-h-[150px] flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-400">Selesai</CardDescription>
            <CardTitle className="text-4xl text-green-400 font-bold">{stats.todayStats.completed}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-green-400">
              <TrendingUp className="h-4 w-4" />
              <span>Layanan selesai</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/30 h-full min-h-[150px] flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-400">Sedang Dikerjakan</CardDescription>
            <CardTitle className="text-4xl text-blue-400 font-bold">{stats.todayStats.inProgress}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-blue-400">
              <Users className="h-4 w-4" />
              <span>Sedang dilayani</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/30 h-full min-h-[150px] flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-400">Menunggu</CardDescription>
            <CardTitle className="text-4xl text-yellow-400 font-bold">{stats.todayStats.waiting}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-yellow-400">
              <Clock className="h-4 w-4" />
              <span>Dalam antrean</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-card/80 backdrop-blur-sm border-primary/20 cursor-pointer hover:border-primary/50 transition-all group" onClick={() => onNavigate("barber")}>
          <CardHeader>
            <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center mb-3 group-hover:bg-primary/30 transition-colors">
              <Scissors className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl">Kelola Antrean</CardTitle>
            <CardDescription className="text-lg text-gray-400">Lihat dan kelola antrean pelanggan Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-primary hover:bg-primary/90 text-black font-bold h-11">
              Kelola Sekarang
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <div className="w-14 h-14 rounded-lg bg-yellow-500/20 flex items-center justify-center mb-3">
              <Award className="h-7 w-7 text-yellow-400" />
            </div>
            <CardTitle className="text-2xl">Performa Anda</CardTitle>
            <CardDescription className="text-lg text-gray-400">Efisiensi dan statistik layanan Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                <span className="text-gray-400">Kinerja Layanan</span>
                <span className="font-bold text-primary text-xl">{stats.completionRate}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                <span className="text-gray-400">Total Pelanggan Selesai</span>
                <span className="font-bold text-white text-xl">{stats.totalServed}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OwnerDashboardOverview({ user, onNavigate }) {
  const [stats, setStats] = useState({
    weeklyRevenue: 0,
    totalReservations: 0,
    activeStaff: 0,
    revenueDiffPercent: null,
    customersDiffPercent: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiFetch("/queues/reports?period=weekly");
        if (res.success) {
          setStats({
            weeklyRevenue: res.data.weeklyRevenue || 0,
            totalReservations: res.data.totalReservations || 0,
            activeStaff: res.data.activeStaff || 0,
            revenueDiffPercent: res.data.revenueDiffPercent,
            customersDiffPercent: res.data.customersDiffPercent
          });
        }
      } catch (err) {
        console.error("Gagal memuat stats dashboard owner:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">
          Selamat Datang, <span className="text-primary">{user.name}</span>!
        </h1>
        <p className="text-gray-400 text-lg">Pantau performa bisnis dan kelola operasional salon</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 items-stretch">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 h-full min-h-[150px] flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-400">Total Pelanggan Minggu Ini</CardDescription>
            <CardTitle className="text-4xl text-primary font-bold">{stats.totalReservations}</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.customersDiffPercent !== null && (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <TrendingUp className="h-4 w-4" />
                <span>{stats.customersDiffPercent} dari minggu lalu</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30 h-full min-h-[150px] flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-400">Total Pendapatan</CardDescription>
            <CardTitle className="text-4xl text-green-400 font-bold">
              Rp {stats.weeklyRevenue.toLocaleString("id-ID")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.revenueDiffPercent !== null && (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <TrendingUp className="h-4 w-4" />
                <span>{stats.revenueDiffPercent} dari minggu lalu</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/30 h-full min-h-[150px] flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-400">Staff Aktif</CardDescription>
            <CardTitle className="text-4xl text-blue-400 font-bold">{stats.activeStaff}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-blue-400">
              <Users className="h-4 w-4" />
              <span>Stylist bertugas</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-card/80 backdrop-blur-sm border-primary/20 cursor-pointer hover:border-primary/50 transition-all group" onClick={() => onNavigate("owner")}>
          <CardHeader>
            <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center mb-3 group-hover:bg-primary/30 transition-colors">
              <TrendingUp className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl">Laporan dan Data Master</CardTitle>
            <CardDescription className="text-lg text-gray-400">Lihat performa bisnis dan statistik lengkap</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-primary hover:bg-primary/90 text-black font-bold h-11">
              Buka Laporan dan Data Master
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm border-primary/20 cursor-pointer hover:border-primary/50 transition-all group" onClick={() => onNavigate("queue")}>
          <CardHeader>
            <div className="w-14 h-14 rounded-lg bg-blue-500/20 flex items-center justify-center mb-3 group-hover:bg-blue-500/30 transition-colors">
              <Users className="h-7 w-7 text-blue-400" />
            </div>
            <CardTitle className="text-2xl">Status Antrean</CardTitle>
            <CardDescription className="text-lg text-gray-400">Monitor antrean real-time di semua outlet</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10 h-11">
              Lihat Antrean
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
