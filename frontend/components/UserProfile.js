import { useState, useEffect } from "react";
import { User, Mail, Lock, Shield, Camera, Save, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { apiFetch, API_BASE_URL } from "./utils/api";

export default function UserProfile({ user, onUpdateUser }) {
  const [name, setName] = useState(user.name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const [isUpdating, setIsUpdating] = useState(false);
  const [stylistId, setStylistId] = useState(null);
  const [barberStatus, setBarberStatus] = useState(false); // false = Busy, true = Available
  const [statusLoading, setStatusLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    // Fetch user profile info or set initial photo
    setPhotoUrl(user.photoUrl || null);
    
    // Fetch stylist ID and status if user is a barber
    if (user.role === "barber") {
      apiFetch("/stylists").then((res) => {
        if (res.success) {
          const myStylist = res.data.find(s => s.id_user.toString() === user.id.toString());
          if (myStylist) {
            setStylistId(myStylist.id_stylist);
            setBarberStatus(myStylist.status === "Available" || myStylist.status === "AVAILABLE");
          }
        }
      });
    }
  }, [user.role, user.id, user.photoUrl]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await apiFetch("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ name })
      });
      if (res.success) {
        onUpdateUser({ ...user, name });
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        alert(res.message || "Gagal memperbarui profil.");
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Password baru dan konfirmasi tidak cocok!");
      return;
    }
    setIsUpdating(true);
    try {
      const res = await apiFetch("/auth/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword })
      });
      if (res.success) {
        setShowSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        alert(res.message || "Gagal memperbarui password.");
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (checked) => {
    if (!stylistId) return;
    setStatusLoading(true);
    const newStatus = checked ? "Available" : "Busy";
    try {
      const res = await apiFetch(`/stylists/${stylistId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus })
      });
      if (res.success) {
        setBarberStatus(checked);
      } else {
        alert("Gagal memperbarui ketersediaan.");
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem.");
    } finally {
      setStatusLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);

    setIsUploadingPhoto(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/auth/profile/photo`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await res.json();
      if (data.success) {
        setPhotoUrl(data.data.photoUrl);
        onUpdateUser({ ...user, photoUrl: data.data.photoUrl });
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        alert(data.message || "Gagal mengunggah foto.");
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem saat mengunggah foto.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus akun Anda secara permanen? Semua data antrean Anda akan terhapus dan tidak bisa dikembalikan.")) {
      try {
        const res = await apiFetch("/auth/profile", {
          method: "DELETE"
        });
        if (res.success) {
          alert("Akun Anda telah berhasil dihapus.");
          // Clear session and force reload to trigger app reset
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.reload();
        } else {
          alert(res.message || "Gagal menghapus akun.");
        }
      } catch (err) {
        alert("Terjadi kesalahan sistem.");
      }
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

  const getRoleDisplay = (role) => {
    switch (role) {
      case "customer":
        return "Pelanggan";
      case "barber":
        return "Barber";
      case "owner":
        return "Owner";
      default:
        return role;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "customer":
        return "bg-blue-500";
      case "barber":
        return "bg-green-500";
      case "owner":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Profil Saya</h1>
        <p className="text-muted-foreground">Kelola informasi akun dan preferensi Anda</p>
      </div>

      {showSuccess && (
        <Alert className="bg-green-50 text-green-900 border-green-200">
          <AlertDescription>✓ Perubahan berhasil disimpan</AlertDescription>
        </Alert>
      )}

      {/* Profile Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24">
                {photoUrl ? (
                  <img src={photoUrl.startsWith('http') ? photoUrl : `http://localhost:5000${photoUrl}`} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <AvatarFallback className="text-2xl">{getInitials(name)}</AvatarFallback>
                )}
              </Avatar>
              <label className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-secondary hover:bg-primary hover:text-black flex items-center justify-center cursor-pointer transition-colors border border-primary/20 shadow-lg">
                {isUploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={isUploadingPhoto} />
              </label>
            </div>
            <div className="text-center md:text-left flex-1">
              <h2 className="text-2xl font-bold">{name}</h2>
              <p className="text-muted-foreground">{user.email}</p>
              <Badge className={`mt-2 ${getRoleBadgeColor(user.role)}`}>
                {getRoleDisplay(user.role)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className={`grid w-full ${user.role === "barber" ? "grid-cols-3" : "grid-cols-2"}`}>
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            Keamanan
          </TabsTrigger>
          {user.role === "barber" && (
            <TabsTrigger value="availability">
              <CheckCircle className="mr-2 h-4 w-4" />
              Ketersediaan
            </TabsTrigger>
          )}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Pribadi</CardTitle>
              <CardDescription>Update informasi profil Anda</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="Nama lengkap"
                      className="pl-10"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      className="pl-10"
                      value={user.email}
                      disabled
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Email tidak dapat diubah</p>
                </div>



                <Separator />

                <Button type="submit" className="w-full" disabled={isUpdating}>
                  {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Simpan Perubahan
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Ubah Password</CardTitle>
              <CardDescription>Update password akun Anda untuk keamanan</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Password Saat Ini</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">Password Baru</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Password harus minimal 6 karakter dan mengandung huruf dan angka
                  </AlertDescription>
                </Alert>

                <Separator />

                <Button type="submit" className="w-full" disabled={isUpdating}>
                  {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                  Ubah Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Availability Tab (For Barbers) */}
        {user.role === "barber" && (
          <TabsContent value="availability">
            <Card>
              <CardHeader>
                <CardTitle>Status Ketersediaan</CardTitle>
                <CardDescription>Tentukan apakah Anda sedang tersedia melayani pelanggan atau sedang sibuk/istirahat.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-primary/10">
                  <div className="space-y-0.5">
                    <Label htmlFor="availability-status" className="text-lg font-bold flex items-center gap-2">
                      {barberStatus ? (
                        <span className="text-green-500 flex items-center gap-2"><CheckCircle className="h-5 w-5" /> Tersedia (Available)</span>
                      ) : (
                        <span className="text-yellow-500 flex items-center gap-2"><XCircle className="h-5 w-5" /> Sibuk / Istirahat (Busy)</span>
                      )}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {barberStatus ? "Pelanggan dapat mengambil antrean untuk Anda." : "Pelanggan tidak akan bisa mengambil antrean Anda."}
                    </p>
                  </div>
                  <Switch
                    id="availability-status"
                    checked={barberStatus}
                    onCheckedChange={handleStatusChange}
                    disabled={statusLoading || !stylistId}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

      </Tabs>
      
      {/* Delete Account Section */}
      <Card className="border-destructive/30 bg-destructive/5 mt-8">
        <CardHeader>
          <CardTitle className="text-destructive">Zona Berbahaya</CardTitle>
          <CardDescription>Tindakan ini tidak dapat dibatalkan</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Menghapus akun Anda akan secara permanen menghapus semua data Anda dari sistem kami, termasuk riwayat pemesanan dan preferensi profil.
          </p>
          <Button variant="destructive" onClick={handleDeleteAccount}>
            Hapus Akun Saya
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
