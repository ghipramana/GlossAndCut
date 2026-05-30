import { useState, useEffect } from "react";
import { User, Clock, CheckCircle, Star, ArrowRight, ArrowLeft, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Separator } from "./ui/separator";
import { apiFetch } from "./utils/api";

export default function CustomerBooking() {
  const getLocalFormattedDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    service: "",
    stylist: "",
    date: getLocalFormattedDate(),
    time: "",
  });
  
  const [services, setServices] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [stylistSchedule, setStylistSchedule] = useState([]);
  const [opHours, setOpHours] = useState({ start: "08:00", end: "22:00" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [queueNumber, setQueueNumber] = useState(0);
  const [bookedTime, setBookedTime] = useState("");

  // Load active services and stylists on mount
  useEffect(() => {
    const loadBookingData = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Fetch services and stylists concurrently
        const [servicesRes, stylistsRes, settingsRes] = await Promise.all([
          apiFetch("/services"),
          apiFetch("/stylists"),
          apiFetch("/settings")
        ]);

        if (servicesRes.success) {
          setServices(servicesRes.data);
        } else {
          setError(servicesRes.message || "Failed to load services.");
        }

        if (stylistsRes.success) {
          setStylists(stylistsRes.data);
        } else {
          setError(stylistsRes.message || "Failed to load stylists.");
        }

        if (settingsRes.success) {
          setOpHours({
            start: settingsRes.data.operational_start || "08:00",
            end: settingsRes.data.operational_end || "22:00"
          });
        }
      } catch (err) {
        console.error("Load booking error:", err);
        setError("Tidak dapat terhubung ke server backend.");
      } finally {
        setLoading(false);
      }
    };

    loadBookingData();
  }, []);

  const fetchSchedule = async (stylistId, date) => {
    try {
      const res = await apiFetch(`/queues/schedule?id_stylist=${stylistId}&date=${date}&_t=${Date.now()}`);
      if (res.success) {
        setStylistSchedule(res.data);
      }
    } catch (err) {
      console.error("Gagal memuat jadwal:", err);
    }
  };

  useEffect(() => {
    if (step === 4 && formData.stylist && formData.date) {
      fetchSchedule(formData.stylist, formData.date);
    }
  }, [formData.date, step]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (step === 1 && formData.name && formData.phone) {
      setStep(2);
    } else if (step === 2 && formData.service) {
      setStep(3);
    } else if (step === 3 && formData.stylist) {
      setStep(4);
      fetchSchedule(formData.stylist, formData.date);
    } else if (step === 4 && formData.date && formData.time) {
      const selectedService = services.find((s) => s.id_service.toString() === formData.service);
      const startMs = new Date(`${formData.date}T${formData.time}`).getTime();
      
      if (isNaN(startMs)) {
        setError("Waktu tidak valid.");
        return;
      }
      
      const endMs = startMs + selectedService.est_duration * 60000;

      // Past time validation client side
      if (startMs < Date.now()) {
        setError("⚠️ Waktu pemesanan tidak boleh di masa lalu.");
        return;
      }

      // Op Hours validation client side
      const [startHour, startMin] = opHours.start.split(':').map(Number);
      const [endHour, endMin] = opHours.end.split(':').map(Number);
      const bookingStartMinutes = new Date(startMs).getHours() * 60 + new Date(startMs).getMinutes();
      const bookingEndMinutes = new Date(endMs).getHours() * 60 + new Date(endMs).getMinutes();
      const opStartMinutes = startHour * 60 + startMin;
      const opEndMinutes = endHour * 60 + endMin;

      if (bookingStartMinutes < opStartMinutes || bookingEndMinutes > opEndMinutes) {
        setError(`⚠️ Jam operasional salon adalah pukul ${opHours.start} - ${opHours.end}. Silakan pilih waktu lain.`);
        return;
      }

      // Client-side overlap validation
      const isOverlap = stylistSchedule.some(slot => {
        const slotStart = new Date(slot.booking_time).getTime();
        const slotEnd = new Date(slot.booking_end).getTime();
        return startMs < slotEnd && endMs > slotStart;
      });

      if (isOverlap) {
        setError("⚠️ Waktu tidak tersedia (Tabrakan jadwal). Barber sudah memiliki jadwal di rentang waktu ini.");
        return;
      }

      try {
        setLoading(true);
        const res = await apiFetch("/queues", {
          method: "POST",
          body: JSON.stringify({
            id_service: parseInt(formData.service, 10),
            id_stylist: parseInt(formData.stylist, 10),
            customer_name: formData.name,
            customer_phone: formData.phone,
            booking_time: new Date(startMs).toISOString()
          })
        });

        if (res.success) {
          setQueueNumber(res.data.queue_number);
          setBookedTime(res.data.booking_time);
          setBookingConfirmed(true);
        } else {
          setError(res.message || "Gagal melakukan booking.");
        }
      } catch (err) {
        setError("Gagal terhubung ke server untuk menyelesaikan booking.");
      } finally {
        setLoading(false);
      }
    }
  };

  const selectedService = services.find((s) => s.id_service.toString() === formData.service);
  const selectedStylist = stylists.find((s) => s.id_stylist.toString() === formData.stylist);

  if (loading && step === 1 && services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-gray-400">Memuat data layanan & stylist...</p>
      </div>
    );
  }

  if (bookingConfirmed) {
    const bookedDate = new Date(bookedTime);
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-2 border-primary/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center border-b border-primary/20">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 border-2 border-primary/50">
              <CheckCircle className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-3xl">Booking Berhasil!</CardTitle>
            <CardDescription className="text-lg text-gray-400">Jadwal Anda telah dikonfirmasi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="text-center py-10 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg border border-primary/30">
              <p className="text-sm text-gray-400 mb-3 uppercase tracking-wider">Jadwal Anda</p>
              <p className="text-4xl font-bold text-primary mb-2">
                {bookedDate.toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p className="text-3xl font-bold text-white mb-4">
                Pukul {bookedDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
              </p>
              <Badge className="bg-primary/20 text-primary border-primary/30">Antrean #{queueNumber.toString().padStart(3, "0")}</Badge>
            </div>

            <div className="space-y-4 bg-secondary/50 p-6 rounded-lg border border-primary/20">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Nama</span>
                <span className="font-semibold text-white">{formData.name}</span>
              </div>
              <Separator className="bg-primary/10" />
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Layanan</span>
                <span className="font-semibold text-white">{selectedService?.service_name}</span>
              </div>
              <Separator className="bg-primary/10" />
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Stylist</span>
                <span className="font-semibold text-white">{selectedStylist?.name}</span>
              </div>
            </div>

            <Button
              className="w-full bg-primary hover:bg-primary/90 text-black font-bold h-12"
              onClick={() => {
                setBookingConfirmed(false);
                setStep(1);
                setFormData({ name: "", phone: "", service: "", stylist: "", date: getLocalFormattedDate(), time: "" });
              }}
            >
              Selesai
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-3">Booking Antrean</h1>
        <p className="text-gray-400 text-lg">
          Pilih jadwal potong rambut Anda tanpa perlu menunggu lama di lokasi
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6 bg-destructive/10 border-destructive/50">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-10 overflow-x-auto pb-4">
        <div className="flex items-center gap-2 min-w-max">
          {[
            { num: 1, label: "Data Diri" },
            { num: 2, label: "Layanan" },
            { num: 3, label: "Stylist" },
            { num: 4, label: "Jadwal" },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 ${step >= s.num ? "text-primary" : "text-gray-500"}`}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${
                    step >= s.num ? "bg-primary text-black border-primary" : "bg-secondary border-gray-600"
                  }`}
                >
                  {s.num}
                </div>
                <span className="hidden sm:inline font-semibold">{s.label}</span>
              </div>
              {idx < 3 && <div className={`w-8 h-1 rounded ${step >= s.num + 1 ? "bg-primary" : "bg-gray-700"}`} />}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Personal Information */}
        {step === 1 && (
          <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
            <CardHeader className="border-b border-primary/10">
              <CardTitle className="text-2xl">Data Diri</CardTitle>
              <CardDescription className="text-gray-400">Masukkan nama dan nomor telepon Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">Nama Lengkap</Label>
                <Input
                  id="name"
                  placeholder="Masukkan nama lengkap"
                  className="bg-secondary border-primary/20 focus:border-primary text-white placeholder:text-gray-500 h-12"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-300">Nomor Telepon</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  className="bg-secondary border-primary/20 focus:border-primary text-white placeholder:text-gray-500 h-12"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-black font-bold h-12" disabled={!formData.name || !formData.phone}>
                Lanjutkan
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Service */}
        {step === 2 && (
          <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
            <CardHeader className="border-b border-primary/10">
              <CardTitle className="text-2xl">Pilih Layanan</CardTitle>
              <CardDescription className="text-gray-400">Pilih jenis layanan yang Anda inginkan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <RadioGroup value={formData.service} onValueChange={(value) => setFormData({ ...formData, service: value })}>
                <div className="grid md:grid-cols-2 gap-4">
                  {services.map((service) => (
                    <label
                      key={service.id_service}
                      className={`relative flex items-start space-x-3 p-5 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.service === service.id_service.toString()
                          ? "border-primary bg-primary/5"
                          : "border-primary/20 bg-secondary/30 hover:border-primary/40"
                      }`}
                    >
                      <RadioGroupItem value={service.id_service.toString()} id={service.id_service.toString()} className="mt-1 border-primary text-primary" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold text-white text-lg">{service.service_name}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xl font-bold text-primary">Rp {service.price.toLocaleString("id-ID")}</p>
                          <Badge variant="outline" className="border-primary/30 text-gray-400">
                            <Clock className="w-3 h-3 mr-1" />
                            {service.est_duration} min
                          </Badge>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </RadioGroup>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1 border-primary/30 text-gray-300 hover:bg-secondary h-12" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Kembali
                </Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-black font-bold h-12" disabled={!formData.service}>
                  Lanjutkan
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Select Stylist */}
        {step === 3 && (
          <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
            <CardHeader className="border-b border-primary/10">
              <CardTitle className="text-2xl">Pilih Stylist</CardTitle>
              <CardDescription className="text-gray-400">Pilih stylist profesional favorit Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <RadioGroup value={formData.stylist} onValueChange={(value) => setFormData({ ...formData, stylist: value })}>
                <div className="grid md:grid-cols-2 gap-4">
                  {stylists.filter(s => s.status?.toUpperCase() === 'AVAILABLE').map((stylist) => (
                    <label
                      key={stylist.id_stylist}
                      className={`flex flex-col border-2 rounded-lg cursor-pointer transition-all overflow-hidden ${
                        formData.stylist === stylist.id_stylist.toString()
                          ? "border-primary bg-primary/5"
                          : "border-primary/20 bg-secondary/30 hover:border-primary/40"
                      }`}
                    >
                      <div className="relative h-48 overflow-hidden bg-zinc-800 flex items-center justify-center">
                        {stylist.photoUrl ? (
                          <img src={`http://localhost:5000${stylist.photoUrl}`} alt={stylist.name} className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-20 w-20 text-gray-600" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/80 to-transparent"></div>
                        <div className="absolute top-3 right-3">
                          <RadioGroupItem value={stylist.id_stylist.toString()} id={stylist.id_stylist.toString()} className="border-2 border-white bg-secondary" />
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="mb-3">
                          <p className="font-semibold text-white text-lg mb-1">{stylist.name}</p>
                          <p className="text-sm text-gray-400">{stylist.specialty}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                  {stylists.filter(s => s.status?.toUpperCase() === 'AVAILABLE').length === 0 && (
                    <div className="col-span-2 text-center py-10 text-gray-400">
                      Maaf, tidak ada stylist yang tersedia saat ini.
                    </div>
                  )}
                </div>
              </RadioGroup>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1 border-primary/30 text-gray-300 hover:bg-secondary h-12" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Kembali
                </Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-black font-bold h-12" disabled={!formData.stylist}>
                  Lanjutkan
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Pick Date & Time */}
        {step === 4 && (
          <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
            <CardHeader className="border-b border-primary/10">
              <CardTitle className="text-2xl">Pilih Jadwal</CardTitle>
              <CardDescription className="text-gray-400">Tentukan tanggal dan jam kedatangan Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-gray-300">Tanggal</Label>
                    <div className="relative">
                      <Input
                        id="date"
                        type="date"
                        min={getLocalFormattedDate()}
                        className="bg-secondary border-primary/20 focus:border-primary text-white h-12 pl-10"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                      <CalendarIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-gray-300">Jam (Waktu Mulai)</Label>
                    <div className="relative">
                      <Input
                        id="time"
                        type="time"
                        className="bg-secondary border-primary/20 focus:border-primary text-white h-12 pl-10"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        required
                      />
                      <Clock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Durasi layanan: {selectedService?.est_duration} menit <br/>
                      <span className="text-primary">Jam Operasional: {opHours.start} - {opHours.end}</span>
                    </p>
                  </div>
                </div>

                <div className="bg-secondary/40 rounded-lg p-5 border border-primary/10">
                  <h4 className="font-semibold text-white mb-4 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-primary" />
                    Jadwal Sibuk Barber (Tanggal {formData.date})
                  </h4>
                  {stylistSchedule.length > 0 ? (
                    <div className="space-y-2">
                      {stylistSchedule.map((slot, idx) => {
                        const start = new Date(slot.booking_time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
                        const end = new Date(slot.booking_end).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
                        return (
                          <div key={idx} className="flex justify-between items-center bg-destructive/10 text-destructive p-3 rounded border border-destructive/20">
                            <span className="font-medium">{start} - {end}</span>
                            <Badge variant="destructive" className="bg-destructive/20 text-destructive">Booked</Badge>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-400">
                      <p>Tidak ada jadwal sibuk.</p>
                      <p className="text-sm mt-1 text-primary">Barber tersedia sepanjang hari!</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1 border-primary/30 text-gray-300 hover:bg-secondary h-12" onClick={() => setStep(3)}>
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Kembali
                </Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-black font-bold h-12" disabled={!formData.date || !formData.time}>
                  Konfirmasi Booking
                  <CheckCircle className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
}
