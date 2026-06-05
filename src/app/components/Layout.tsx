import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Building2, Users, Truck, Box, LogOut, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: Building2, label: 'Dashboard' },
    { path: '/clientes', icon: Users, label: 'Clientes' },
    { path: '/equipos', icon: Truck, label: 'Equipos' },
    { path: '/modelos', icon: Box, label: 'Modelos' },
  ];

  return (
    <div
      className="min-h-screen bg-slate-50"
    >
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo y nombre */}
            <div className="flex items-center space-x-3">
                <a href="/" className="flex items-center hover:scale-105 transition-transform duration-200">
                    <img src="/img/laromanatipografianegra.svg" alt="Logo" className="w-18 h-20 mt-1"/>
                </a>
              <div className="hidden sm:block">
                <h1 className="font-bold text-lg text-gray-900">Flota Clientes</h1>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      className={
                        isActive
                          ? 'bg-[#0066CC] hover:bg-[#0052A3] text-white'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>

            {/* User info and logout */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{user?.nombre}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.rol}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </Button>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden pb-4 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      className={`w-full justify-start ${
                        isActive
                          ? 'bg-[#0066CC] hover:bg-[#0052A3] text-white'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}