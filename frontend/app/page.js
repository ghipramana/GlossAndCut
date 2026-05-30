"use client";

import { useState, useEffect } from "react";
import { Scissors, Clock, Users, BarChart3, Menu, LogOut, UserCircle, Home, LayoutDashboard } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import LoginPage from "../components/LoginPage";
import Dashboard from "../components/Dashboard";
import HomePage from "../components/HomePage";
import CustomerBooking from "../components/CustomerBooking";
import QueueStatus from "../components/QueueStatus";
import BarberDashboard from "../components/BarberDashboard";
import OwnerDashboard from "../components/OwnerDashboard";
import UserProfile from "../components/UserProfile";
import ServiceManagement from "../components/ServiceManagement";

export default function HomeApp() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Restore user session on mount
  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      }
    } else {
      // Clear legacy/corrupt sessions
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    }
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setActiveTab("home");
  };

  // If not client mounted, show static beautiful dark loaders
  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Scissors className="h-10 w-10 animate-pulse text-primary" />
          <p className="text-gray-400 font-semibold">Memuat sistem antrean Gloss & Cut...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Get navigation items based on user role
  const getNavigationItems = () => {
    if (user.role === "customer") {
      return [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "home", label: "Tentang", icon: Home },
        { id: "booking", label: "Ambil Antrean", icon: Clock },
        { id: "queue", label: "Status Live", icon: Users },
      ];
    } else if (user.role === "barber") {
      return [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "barber", label: "Kelola Antrean", icon: Scissors },
        { id: "queue", label: "Status Live", icon: Users },
      ];
    } else if (user.role === "owner") {
      return [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "owner", label: "Laporan dan Data Master", icon: BarChart3 },
        { id: "queue", label: "Status Live", icon: Users },
        { id: "barber", label: "Kelola Antrean", icon: Clock },
      ];
    }

    return [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "home", label: "Tentang", icon: Home },
    ];
  };

  const navigationItems = getNavigationItems();

  const getRoleDisplay = (role) => {
    switch (role) {
      case "customer":
        return "Pelanggan";
      case "barber":
        return "Barber / Stylist";
      case "owner":
        return "Owner / Admin";
      default:
        return role;
    }
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
            <Scissors className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-wider text-white">
              Gloss <span className="text-primary">&</span> Cut
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={`h-9 px-4 rounded-md font-medium text-sm transition-all ${
                    isActive 
                      ? "bg-primary text-black font-bold hover:bg-primary/90" 
                      : "text-gray-400 hover:text-white hover:bg-secondary/40"
                  }`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-primary/30 p-0 overflow-hidden">
                  <Avatar className="h-full w-full">
                    {user.photoUrl ? (
                      <img src={user.photoUrl.startsWith('http') ? user.photoUrl : `http://localhost:5000${user.photoUrl}`} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-primary/20 text-primary font-bold">{getInitials(user.name)}</AvatarFallback>
                    )}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card border border-primary/20 text-white">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1 py-1">
                    <p className="text-sm font-semibold">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                    <p className="text-xs text-primary font-semibold">{getRoleDisplay(user.role)}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-primary/10" />
                <DropdownMenuItem className="focus:bg-primary focus:text-black cursor-pointer" onClick={() => setActiveTab("dashboard")}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-primary focus:text-black cursor-pointer" onClick={() => setActiveTab("profile")}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  Profil Saya
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-primary/10" />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:bg-red-950 focus:text-red-300 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden border border-primary/20"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-6 w-6 text-white" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-primary/20 p-4 space-y-2 bg-[#09090b]">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start ${isActive ? "bg-primary text-black font-bold" : "text-gray-400 hover:text-white"}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl flex-grow">
        {activeTab === "dashboard" && <Dashboard user={user} onNavigate={setActiveTab} />}
        {activeTab === "home" && <HomePage onNavigate={setActiveTab} />}
        {activeTab === "booking" && <CustomerBooking />}
        {activeTab === "queue" && <QueueStatus />}
        {activeTab === "barber" && <BarberDashboard user={user} />}
        {activeTab === "owner" && <OwnerDashboard />}
        {activeTab === "services" && <ServiceManagement />}
        {activeTab === "profile" && <UserProfile user={user} onUpdateUser={setUser} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-primary/10 bg-[#09090b] py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500 max-w-7xl">
          <p>© 2026 Gloss & Cut - Sistem Manajemen Antrean Salon/Barbershop Real-time</p>
          <p className="mt-1 text-xs text-primary/60">Dikembangkan oleh Kelompok 1 - Rekayasa Perangkat Lunak (RPL) Undip</p>
        </div>
      </footer>
    </div>
  );
}
