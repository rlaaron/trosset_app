/**
 * @file: src/components/layout/Sidebar.tsx
 * @purpose: Menú lateral de navegación principal de la aplicación
 * @goal: Proporcionar navegación entre módulos (Dashboard, Comercial, Inventarios, etc.)
 * @context: Layout base - Navegación principal según mockups
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingCart, 
  Package, 
  Wheat,
  Calendar,
  Monitor,
  DollarSign,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    name: 'Comercial',
    href: '/comercial',
    icon: <ShoppingCart className="h-5 w-5" />,
    children: [
      { name: 'Clientes', href: '/comercial/clientes', icon: <Users className="h-4 w-4" /> },
      { name: 'Pedidos', href: '/comercial/pedidos', icon: <ShoppingCart className="h-4 w-4" /> },
    ],
  },
  {
    name: 'Inventarios',
    href: '/inventarios',
    icon: <Package className="h-5 w-5" />,
    children: [
      { name: 'Insumos', href: '/inventarios/insumos', icon: <Wheat className="h-4 w-4" /> },
      { name: 'Productos', href: '/inventarios/productos', icon: <Package className="h-4 w-4" /> },
    ],
  },
  {
    name: 'Planificación',
    href: '/planificacion',
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    name: 'Kiosco Tablet',
    href: '/kiosco',
    icon: <Monitor className="h-5 w-5" />,
  },
  {
    name: 'Listas de Precios',
    href: '/listas-precios',
    icon: <DollarSign className="h-5 w-5" />,
  },
  {
    name: 'Configuración',
    href: '/configuracion',
    icon: <Settings className="h-5 w-5" />,
  },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();

  const toggleExpanded = (name: string) => {
    setExpandedItems(prev =>
      prev.includes(name)
        ? prev.filter(item => item !== name)
        : [...prev, name]
    );
  };

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/');
  };

  return (
    <div
      className={`flex flex-col h-screen bg-primary text-white transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-primary-light">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🥖</span>
            <span className="font-bold text-lg">PanaderíaApp</span>
          </div>
        )}
        {isCollapsed && <span className="text-2xl mx-auto">🥖</span>}
        
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded hover:bg-primary-light transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <div>
                {item.children ? (
                  <button
                    onClick={() => toggleExpanded(item.name)}
                    className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'bg-primary-light text-white'
                        : 'text-white/80 hover:bg-primary-light/50 hover:text-white'
                    }`}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!isCollapsed && (
                      <>
                        <span className="ml-3 flex-1 text-left">{item.name}</span>
                        <ChevronRight
                          className={`h-4 w-4 transition-transform ${
                            expandedItems.includes(item.name) ? 'rotate-90' : ''
                          }`}
                        />
                      </>
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'bg-primary-light text-white'
                        : 'text-white/80 hover:bg-primary-light/50 hover:text-white'
                    }`}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!isCollapsed && (
                      <span className="ml-3 flex-1">{item.name}</span>
                    )}
                  </Link>
                )}

                {/* Submenu */}
                {item.children && !isCollapsed && expandedItems.includes(item.name) && (
                  <ul className="mt-1 ml-4 space-y-1">
                    {item.children.map((child) => (
                      <li key={child.name}>
                        <Link
                          href={child.href}
                          className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive(child.href)
                              ? 'bg-primary-light text-white'
                              : 'text-white/70 hover:bg-primary-light/30 hover:text-white'
                          }`}
                        >
                          <span className="flex-shrink-0">{child.icon}</span>
                          <span className="ml-2">{child.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-primary-light">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white font-bold">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Admin</p>
              <p className="text-xs text-white/70 truncate">Administrador</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
