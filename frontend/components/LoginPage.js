import { useState, useEffect } from "react";
import { Scissors, Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Badge } from "./ui/badge";
import { API_BASE_URL } from "./utils/api";

export default function LoginPage({ onLogin }) {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerRole, setRegisterRole] = useState("customer");
  const [error, setError] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Forgot / Reset Password States
  const [viewState, setViewState] = useState("auth"); // "auth", "forgot", "reset"
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      if (token) {
        setResetToken(token);
        setViewState("reset");
      }
    }
  }, []);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage("Link reset password telah dikirim ke email Anda.");
      } else {
        setError(data.message || "Gagal mengirim email reset password.");
      }
    } catch (err) {
      setError("Terjadi kesalahan jaringan.");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage("Password berhasil diubah. Silakan login.");
        setTimeout(() => setViewState("auth"), 3000);
      } else {
        setError(data.message || "Token tidak valid atau sudah kadaluarsa.");
      }
    } catch (err) {
      setError("Terjadi kesalahan jaringan.");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      
      const data = await response.json();

      if (data.success) {
        localStorage.setItem("token", data.token);
        onLogin(data.user);
      } else {
        setError(data.message || "Email atau password salah.");
      }
    } catch (err) {
      setError("Tidak dapat terhubung ke backend server (localhost:5000). Pastikan backend Anda sedang berjalan.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!registerName || !registerEmail || !registerPassword) {
      setError("Semua field wajib diisi");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          password: registerPassword,
          role: registerRole
        })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("token", data.token);
        onLogin(data.user);
      } else {
        setError(data.message || "Registrasi gagal.");
      }
    } catch (err) {
      setError("Tidak dapat terhubung ke backend server (localhost:5000). Pastikan backend Anda sedang berjalan.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-20 relative overflow-hidden font-sans">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1657105052497-f996284ffff8?w=1920&q=80"
          alt="Barbershop"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-background/90"></div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-32 h-32 border-2 border-primary/10 rounded-full animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-24 h-24 border-2 border-primary/10 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="relative w-full max-w-md px-4 py-8 z-10 my-8">
        {/* Logo and Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 mb-6">
            <Scissors className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-3">
            <span className="text-white">Gloss</span>
            <span className="text-primary"> & Cut</span>
          </h1>
          <p className="text-gray-400 text-lg">Premium Barbershop Management</p>
          <div className="flex items-center justify-center mt-4">
            <span className="text-sm text-primary font-semibold uppercase tracking-wider">Professional Service</span>
          </div>
        </div>

        {viewState === "auth" && (
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-secondary border border-primary/20">
            <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              Login
            </TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              Daftar
            </TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
              <CardHeader className="pt-6 pb-4">
                <CardTitle className="text-2xl">Masuk ke Akun Anda</CardTitle>
                <CardDescription className="text-gray-400">
                  Masukkan email dan password untuk melanjutkan
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-gray-300">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-primary/50" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="nama@email.com"
                        className="pl-11 bg-secondary border-primary/20 focus:border-primary text-white placeholder:text-gray-500"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-gray-300">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-primary/50" />
                      <Input
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-11 pr-11 bg-secondary border-primary/20 focus:border-primary text-white"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-3 text-primary/50 hover:text-primary transition-colors focus:outline-none"
                      >
                        {showLoginPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="bg-destructive/10 border-destructive/50">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-black font-bold h-11">
                    Masuk
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>

                  <div className="text-center mt-4">
                    <button 
                      type="button" 
                      onClick={() => { setViewState("forgot"); setError(""); setSuccessMessage(""); }}
                      className="text-sm text-gray-400 hover:text-primary transition-colors"
                    >
                      Lupa Password?
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register">
            <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
              <CardHeader className="pt-6 pb-4">
                <CardTitle className="text-2xl">Buat Akun Baru</CardTitle>
                <CardDescription className="text-gray-400">
                  Daftar untuk mulai menggunakan layanan kami
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-6">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name" className="text-gray-300">Nama Lengkap</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-primary/50" />
                      <Input
                        id="register-name"
                        placeholder="Nama lengkap Anda"
                        className="pl-11 bg-secondary border-primary/20 focus:border-primary text-white placeholder:text-gray-500"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-gray-300">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-primary/50" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="nama@email.com"
                        className="pl-11 bg-secondary border-primary/20 focus:border-primary text-white placeholder:text-gray-500"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-gray-300">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-primary/50" />
                      <Input
                        id="register-password"
                        type={showRegisterPassword ? "text" : "password"}
                        placeholder="Minimal 6 karakter"
                        className="pl-11 pr-11 bg-secondary border-primary/20 focus:border-primary text-white"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute right-3 top-3 text-primary/50 hover:text-primary transition-colors focus:outline-none"
                      >
                        {showRegisterPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>



                  {error && (
                    <Alert variant="destructive" className="bg-destructive/10 border-destructive/50">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-black font-bold h-11">
                    Daftar Sekarang
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        )}

        {viewState === "auth" && (
          <div className="text-center mt-6">
            <p className="text-sm text-gray-400">
              Dengan mendaftar, Anda menyetujui Syarat & Ketentuan kami
            </p>
          </div>
        )}

        {viewState === "forgot" && (
          <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
            <CardHeader className="pt-6 pb-4">
              <CardTitle className="text-2xl">Lupa Password</CardTitle>
              <CardDescription className="text-gray-400">
                Masukkan email Anda untuk menerima link reset password.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-gray-300">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-primary/50" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="nama@email.com"
                      className="pl-11 bg-secondary border-primary/20 focus:border-primary text-white"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive" className="bg-destructive/10 border-destructive/50">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {successMessage && (
                  <Alert className="bg-green-500/10 border-green-500/50 text-green-400">
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-black font-bold h-11">
                  Kirim Link Reset
                </Button>

                <div className="text-center mt-4">
                  <button 
                    type="button" 
                    onClick={() => setViewState("auth")}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Kembali ke Login
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {viewState === "reset" && (
          <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
            <CardHeader className="pt-6 pb-4">
              <CardTitle className="text-2xl">Buat Password Baru</CardTitle>
              <CardDescription className="text-gray-400">
                Masukkan password baru untuk akun Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-gray-300">Password Baru</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-primary/50" />
                    <Input
                      id="new-password"
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-11 pr-11 bg-secondary border-primary/20 focus:border-primary text-white"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-3 text-primary/50 hover:text-primary transition-colors focus:outline-none"
                    >
                      {showLoginPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive" className="bg-destructive/10 border-destructive/50">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {successMessage && (
                  <Alert className="bg-green-500/10 border-green-500/50 text-green-400">
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-black font-bold h-11">
                  Simpan Password
                </Button>
                
                <div className="text-center mt-4">
                  <button 
                    type="button" 
                    onClick={() => { setViewState("auth"); window.history.pushState({}, '', '/'); }}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Kembali ke Login
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
