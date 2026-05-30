import { Scissors, Clock, Users, Star, CheckCircle, ArrowRight, Award, Shield } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

export default function HomePage({ onNavigate }) {
  const services = [
    {
      name: "Potong Rambut Pria",
      price: "Rp 50.000",
      duration: "30 menit",
      popular: true,
      image: "https://images.unsplash.com/photo-1647140655214-e4a2d914971f?w=500&q=80"
    },
    {
      name: "Potong Rambut Wanita",
      price: "Rp 75.000",
      duration: "45 menit",
      popular: false,
      image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&q=80"
    },
    {
      name: "Cuci + Potong",
      price: "Rp 65.000",
      duration: "40 menit",
      popular: true,
      image: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=500&q=80"
    },
    {
      name: "Pewarnaan Rambut",
      price: "Rp 150.000",
      duration: "90 menit",
      popular: false,
      image: "https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?w=500&q=80"
    },
    {
      name: "Smoothing Premium",
      price: "Rp 300.000",
      duration: "120 menit",
      popular: false,
      image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=500&q=80"
    },
    {
      name: "Cukur Jenggot",
      price: "Rp 25.000",
      duration: "15 menit",
      popular: true,
      image: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=500&q=80"
    },
  ];

  const features = [
    {
      icon: Clock,
      title: "Estimasi Waktu Real-time",
      description: "Tidak perlu menunggu lama, kami beri tahu kapan giliran Anda",
    },
    {
      icon: Award,
      title: "Pilih Stylist Favorit",
      description: "Booking dengan barber profesional pilihan Anda",
    },
    {
      icon: Shield,
      title: "Antrean Digital",
      description: "Sistem antrean modern tanpa kerumitan",
    },
  ];

  const stylists = [
    {
      name: "Budi Santoso",
      speciality: "Master Barber",
      rating: 4.9,
      customers: 150,
      exp: "10 Tahun",
      image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&q=80"
    },
    {
      name: "Rina Wijaya",
      speciality: "Color Specialist",
      rating: 4.8,
      customers: 120,
      exp: "8 Tahun",
      image: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&q=80"
    },
    {
      name: "Ahmad Hidayat",
      speciality: "Beard Expert",
      rating: 4.7,
      customers: 98,
      exp: "7 Tahun",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80"
    },
    {
      name: "Siti Nurhaliza",
      speciality: "Hair Stylist",
      rating: 5.0,
      customers: 200,
      exp: "12 Tahun",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80"
    },
  ];

  const stats = [
    { value: "5000+", label: "Pelanggan Puas" },
    { value: "10+", label: "Tahun Pengalaman" },
    { value: "4.9", label: "Rating Rata-rata" },
    { value: "15+", label: "Layanan Premium" },
  ];

  return (
    <div className="space-y-0">
      {/* Hero Section with Background Image */}
      <section className="relative min-h-[700px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1593702275687-f8b402bf1fb5?w=1920&q=80"
            alt="Barbershop"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/80"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background"></div>
        </div>

        <div className="relative container mx-auto px-4 py-20 text-center z-10">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 border border-primary/30 rounded-full mb-8 backdrop-blur-sm">
            <Scissors className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Premium Barbershop Experience</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-white">Selamat Datang di</span>
            <br />
            <span className="text-primary">Gloss & Cut</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
            Sistem manajemen antrean salon & barbershop modern dengan estimasi waktu real-time.
            <span className="block mt-2 text-primary font-semibold">Booking sekarang, datang tepat waktu!</span>
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 text-black font-bold" onClick={() => onNavigate("booking")}>
              <Clock className="mr-2 h-5 w-5" />
              Booking Sekarang
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-primary text-primary hover:bg-primary/10 backdrop-blur-sm" onClick={() => onNavigate("queue")}>
              <Users className="mr-2 h-5 w-5" />
              Cek Status Antrean
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="p-4 bg-card/80 backdrop-blur-sm border border-primary/20 rounded-lg">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-gray-400 uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/30">Fitur Unggulan</Badge>
            <h2 className="text-4xl font-bold mb-4">Kenapa Memilih Kami?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Pengalaman booking salon yang modern, efisien, dan profesional
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="bg-secondary border-primary/20 hover:border-primary/50 transition-all group">
                <CardHeader>
                  <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base text-gray-400">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section with Images */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/30">Our Services</Badge>
            <h2 className="text-4xl font-bold mb-4">Layanan Premium</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Berbagai layanan profesional untuk penampilan terbaik Anda
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {services.map((service, index) => (
              <Card key={index} className="bg-card border-primary/20 hover:border-primary/50 transition-all group relative overflow-hidden">
                {service.popular && (
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-primary text-black">Populer</Badge>
                  </div>
                )}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent"></div>
                </div>
                <CardHeader>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{service.name}</CardTitle>
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-2xl font-bold text-primary">{service.price}</div>
                    <Badge variant="outline" className="border-primary/30 text-gray-400">
                      <Clock className="w-3 h-3 mr-1" />
                      {service.duration}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stylists Section with Photos */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/30">Our Team</Badge>
            <h2 className="text-4xl font-bold mb-4">Tim Profesional Kami</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Dipercaya oleh ribuan pelanggan untuk tampilan terbaik mereka
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {stylists.map((stylist, index) => (
              <Card key={index} className="bg-secondary border-primary/20 hover:border-primary/50 transition-all group text-center overflow-hidden">
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={stylist.image}
                    alt={stylist.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/80 to-transparent"></div>
                </div>
                <CardHeader className="-mt-12 relative z-10">
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{stylist.name}</CardTitle>
                  <CardDescription className="text-gray-400">{stylist.speciality}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span className="font-bold text-primary">{stylist.rating}</span>
                      <span className="text-sm text-gray-400">({stylist.customers} review)</span>
                    </div>
                    <Badge variant="outline" className="border-primary/30 text-gray-400">
                      <Award className="w-3 h-3 mr-1" />
                      {stylist.exp} Pengalaman
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with Background */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1635273051937-a0ddef9573b6?w=1920&q=80"
            alt="Barbershop interior"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-background/90"></div>
        </div>

        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Siap untuk Pengalaman<br />
            <span className="text-primary">Salon yang Lebih Baik?</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
            Booking antrean Anda sekarang dan nikmati layanan profesional tanpa perlu menunggu lama di lokasi
          </p>
          <Button size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 text-black font-bold" onClick={() => onNavigate("booking")}>
            Mulai Booking Sekarang
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span>Gratis Registrasi</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span>Estimasi Real-time</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span>Pilih Stylist Favorit</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
