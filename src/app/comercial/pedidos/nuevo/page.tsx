/**
 * @file: src/app/comercial/pedidos/nuevo/page.tsx
 * @purpose: Formulario para crear nuevo pedido B2B
 * @goal: Crear pedido con selección de cliente, productos y fechas
 * @context: Módulo Comercial - Creación de pedido
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  ShoppingCart,
  User,
  Package,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Search
} from 'lucide-react';
import { createOrder } from '@/actions/orders';
import { getClients } from '@/actions/clients';
import { getProductsForSelect } from '@/actions/products';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';

interface OrderItem {
  product_id: string;
  product_name?: string;
  variant_name?: string;
  quantity: number;
  unit_price_snapshot: number;
}

// Función para obtener el precio del producto basado en la lista del cliente
const getProductPrice = (product: any, variantName?: string): number => {
  // Por ahora retornamos 0, esto se debe implementar con la lógica de price_lists
  // TODO: Implementar búsqueda de precio en price_list_items basado en:
  // - selectedClient.price_list_id
  // - product.id
  // - Si tiene variante, buscar precio específico o usar base + extra_cost
  return 0;
};

export default function NuevoPedidoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  // Form data
  const [formData, setFormData] = useState({
    client_id: '',
    delivery_date: '',
    internal_notes: '',
  });
  
  const [items, setItems] = useState<OrderItem[]>([]);
  
  // Temporary states for adding items
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('');
  const [clientSearch, setClientSearch] = useState('');

  // Get selected product details
  const selectedProduct = products.find(p => p.id === selectedProductId);

  useEffect(() => {
    loadClients();
    loadProducts();
    // Set default delivery date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFormData(prev => ({
      ...prev,
      delivery_date: tomorrow.toISOString().split('T')[0]
    }));
  }, []);

  const loadClients = async () => {
    const { data } = await getClients();
    if (data) {
      setClients(data);
    }
  };

  const loadProducts = async () => {
    const { data } = await getProductsForSelect();
    if (data) {
      setProducts(data);
    }
  };

  const selectedClient = clients.find(c => c.id === formData.client_id);

  const handleAddItem = () => {
    if (!selectedProductId || !selectedQuantity || parseInt(selectedQuantity) <= 0) {
      alert('Selecciona un producto y una cantidad válida');
      return;
    }
    
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;
    
    // Check if product already exists in items
    const existingIndex = items.findIndex(i => i.product_id === selectedProductId);
    
    if (existingIndex >= 0) {
      // Update existing item
      const newItems = [...items];
      newItems[existingIndex].quantity += parseInt(selectedQuantity);
      setItems(newItems);
    } else {
      // Add new item
      setItems([...items, {
        product_id: selectedProductId,
        product_name: product.name,
        quantity: parseInt(selectedQuantity),
        unit_price_snapshot: parseFloat(selectedPrice) || 0,
      }]);
    }
    
    setSelectedProductId('');
    setSelectedQuantity('');
    setSelectedPrice('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItemPrice = (index: number, price: string) => {
    const newItems = [...items];
    newItems[index].unit_price_snapshot = parseFloat(price) || 0;
    setItems(newItems);
  };

  const handleUpdateItemQuantity = (index: number, qty: string) => {
    const newItems = [...items];
    newItems[index].quantity = parseInt(qty) || 0;
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => total + (item.quantity * item.unit_price_snapshot), 0);
  };

  const handleSubmit = async () => {
    if (!formData.client_id) {
      alert('Selecciona un cliente');
      setCurrentStep(1);
      return;
    }

    if (!formData.delivery_date) {
      alert('Selecciona una fecha de entrega');
      setCurrentStep(1);
      return;
    }

    if (items.length === 0) {
      alert('Agrega al menos un producto al pedido');
      setCurrentStep(2);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await createOrder(
        {
          client_id: formData.client_id,
          delivery_date: formData.delivery_date,
          internal_notes: formData.internal_notes || null,
        },
        items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price_snapshot: item.unit_price_snapshot,
        }))
      );

      if (error) {
        alert('Error al crear pedido: ' + error);
      } else {
        alert('Pedido creado exitosamente');
        router.push('/comercial/pedidos');
      }
    } catch (error) {
      alert('Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const steps = [
    { number: 1, title: 'Cliente y Entrega', icon: User },
    { number: 2, title: 'Productos', icon: Package },
    { number: 3, title: 'Resumen', icon: ShoppingCart },
  ];

  return (
    <AppLayout>
      <PageContainer
        title="Nuevo Pedido"
        subtitle="Crear un nuevo pedido B2B"
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        }
      >
        {/* Wizard Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                    currentStep === step.number 
                      ? 'bg-primary text-white' 
                      : currentStep > step.number 
                        ? 'bg-success text-white' 
                        : 'bg-surface-elevated text-text-muted'
                  }`}>
                    {currentStep > step.number ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.number ? 'text-text-primary' : 'text-text-muted'
                    }`}>
                      Paso {step.number}
                    </p>
                    <p className={`text-xs ${
                      currentStep >= step.number ? 'text-text-secondary' : 'text-text-muted'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > step.number ? 'bg-success' : 'bg-border'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">
              {steps[currentStep - 1].title}
            </h3>
          </CardHeader>
          <CardBody>
            {/* Step 1: Cliente y Entrega */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Selección de Cliente - Dropdown con Búsqueda */}
                <div className="relative">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Seleccionar Cliente *
                  </label>
                  
                  {!formData.client_id ? (
                    // Modo selección - Dropdown con búsqueda
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-muted z-10" />
                      <Input
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        placeholder="Escribe para buscar cliente..."
                        className="pl-10"
                        autoComplete="off"
                      />
                      
                      {/* Dropdown de resultados */}
                      {clientSearch && (
                        <div className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredClients.length > 0 ? (
                            filteredClients.slice(0, 10).map((client) => (
                              <div
                                key={client.id}
                                onClick={() => {
                                  setFormData({ ...formData, client_id: client.id });
                                  setClientSearch('');
                                }}
                                className="p-3 cursor-pointer hover:bg-surface-elevated transition-colors border-b border-border last:border-0"
                              >
                                <p className="font-medium text-text-primary">{client.name}</p>
                                <p className="text-sm text-text-secondary">
                                  {client.contact_name || 'Sin contacto'}
                                  {client.phone && ` • ${client.phone}`}
                                </p>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-text-muted">
                              No se encontraron clientes
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Cliente seleccionado - Botón para cambiar
                    <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <div>
                        <p className="font-medium text-text-primary">{selectedClient?.name}</p>
                        <p className="text-sm text-text-secondary">
                          {selectedClient?.contact_name || 'Sin contacto'}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setFormData({ ...formData, client_id: '' });
                          setClientSearch('');
                        }}
                      >
                        Cambiar
                      </Button>
                    </div>
                  )}
                </div>

                {/* Cliente seleccionado */}
                {selectedClient && (
                  <div className="bg-surface-elevated p-4 rounded-lg">
                    <h4 className="font-medium text-text-primary mb-2">Cliente Seleccionado</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-text-secondary">Nombre:</span>
                        <p className="font-medium">{selectedClient.name}</p>
                      </div>
                      <div>
                        <span className="text-text-secondary">Contacto:</span>
                        <p>{selectedClient.contact_name || '-'}</p>
                      </div>
                      <div>
                        <span className="text-text-secondary">Teléfono:</span>
                        <p>{selectedClient.phone || '-'}</p>
                      </div>
                      <div>
                        <span className="text-text-secondary">Dirección:</span>
                        <p>{selectedClient.address_delivery || '-'}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-text-secondary">Lista de Precios:</span>
                        <div className="mt-1">
                          {selectedClient.price_list ? (
                            <Badge variant="info">{selectedClient.price_list.name}</Badge>
                          ) : (
                            <Badge variant="neutral">Lista General</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fecha de Entrega */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Fecha de Entrega *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-muted" />
                      <Input
                        type="date"
                        value={formData.delivery_date}
                        onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Notas Internas */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Notas Internas
                  </label>
                  <textarea
                    value={formData.internal_notes}
                    onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                    placeholder="Notas adicionales sobre el pedido..."
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Productos */}
            {currentStep === 2 && (
              <div className="space-y-4">
                {/* Agregar Producto */}
                <div className="bg-surface-elevated p-4 rounded-lg">
                  <h4 className="font-medium text-text-primary mb-3">Agregar Producto</h4>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    {/* Selector de Producto */}
                    <div className="md:col-span-4">
                      <select
                        value={selectedProductId}
                        onChange={(e) => {
                          setSelectedProductId(e.target.value);
                          setSelectedVariant('');
                          // Calcular precio automáticamente
                          const product = products.find(p => p.id === e.target.value);
                          if (product && selectedClient) {
                            const price = getProductPrice(product);
                            setSelectedPrice(price.toString());
                          }
                        }}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Seleccionar producto...</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Selector de Variante (solo si tiene variantes) */}
                    {selectedProduct?.has_variants && (
                      <div className="md:col-span-3">
                        <select
                          value={selectedVariant}
                          onChange={(e) => {
                            setSelectedVariant(e.target.value);
                            // Recalcular precio con variante
                            if (selectedClient) {
                              const price = getProductPrice(selectedProduct, e.target.value);
                              setSelectedPrice(price.toString());
                            }
                          }}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="">Seleccionar sabor...</option>
                          {selectedProduct.variants?.map((variant: any, idx: number) => (
                            <option key={idx} value={variant.name}>
                              {variant.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Cantidad */}
                    <div className="md:col-span-2">
                      <Input
                        type="number"
                        min="1"
                        value={selectedQuantity}
                        onChange={(e) => setSelectedQuantity(e.target.value)}
                        placeholder="Cantidad"
                      />
                    </div>

                    {/* Precio (editable) */}
                    <div className="md:col-span-2">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={selectedPrice}
                          onChange={(e) => setSelectedPrice(e.target.value)}
                          placeholder="Precio"
                          className="pl-7"
                        />
                      </div>
                    </div>

                    {/* Botón Agregar */}
                    <div className="md:col-span-1">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={handleAddItem}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Mensaje de precio sugerido */}
                  {selectedProduct && selectedClient && (
                    <div className="mt-2 text-sm text-text-secondary">
                      Precio sugerido basado en lista del cliente: {' '}
                      <span className="font-medium text-text-primary">
                        {formatCurrency(getProductPrice(selectedProduct, selectedVariant))}
                      </span>
                    </div>
                  )}
                </div>

                {/* Lista de Productos */}
                {items.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="font-medium text-text-primary">Productos en el Pedido</h4>
                    {items.map((item, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-4 bg-surface-elevated rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-text-primary">{item.product_name}</p>
                          {item.variant_name && (
                            <p className="text-sm text-text-secondary">{item.variant_name}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-text-secondary">Cant:</label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItemQuantity(index, e.target.value)}
                              className="w-16"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-text-secondary">Precio:</label>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-text-muted text-sm">$</span>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.unit_price_snapshot}
                                onChange={(e) => handleUpdateItemPrice(index, e.target.value)}
                                className="w-24 pl-5"
                              />
                            </div>
                          </div>
                          <div className="text-right min-w-[100px]">
                            <p className="font-medium text-text-primary">
                              {formatCurrency(item.quantity * item.unit_price_snapshot)}
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-error" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Total */}
                    <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-text-primary">Total del Pedido:</span>
                        <span className="text-2xl font-bold text-primary">
                          {formatCurrency(calculateTotal())}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-text-muted">
                    <Package className="h-16 w-16 mx-auto mb-4" />
                    <p className="text-lg">No hay productos en el pedido</p>
                    <p className="text-sm mt-1">Agrega productos para continuar</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Resumen */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Resumen del Cliente */}
                <div className="bg-surface-elevated p-4 rounded-lg">
                  <h4 className="font-medium text-text-primary mb-3 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Cliente
                  </h4>
                  {selectedClient ? (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-text-secondary">Nombre:</span>
                        <p className="font-medium">{selectedClient.name}</p>
                      </div>
                      <div>
                        <span className="text-text-secondary">Contacto:</span>
                        <p>{selectedClient.contact_name || '-'}</p>
                      </div>
                      <div>
                        <span className="text-text-secondary">Teléfono:</span>
                        <p>{selectedClient.phone || '-'}</p>
                      </div>
                      <div>
                        <span className="text-text-secondary">Dirección:</span>
                        <p>{selectedClient.address_delivery || '-'}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-text-muted">No se ha seleccionado cliente</p>
                  )}
                </div>

                {/* Resumen de Entrega */}
                <div className="bg-surface-elevated p-4 rounded-lg">
                  <h4 className="font-medium text-text-primary mb-3 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Entrega
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-text-secondary">Fecha:</span>
                      <p className="font-medium">{formatDate(formData.delivery_date)}</p>
                    </div>
                    {formData.internal_notes && (
                      <div className="col-span-2">
                        <span className="text-text-secondary">Notas:</span>
                        <p>{formData.internal_notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Resumen de Productos */}
                <div className="bg-surface-elevated p-4 rounded-lg">
                  <h4 className="font-medium text-text-primary mb-3 flex items-center">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Productos ({items.length})
                  </h4>
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                        <div>
                          <p className="font-medium text-text-primary">{item.product_name}</p>
                          <p className="text-sm text-text-secondary">
                            {item.quantity} x {formatCurrency(item.unit_price_snapshot)}
                          </p>
                        </div>
                        <p className="font-medium text-text-primary">
                          {formatCurrency(item.quantity * item.unit_price_snapshot)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Final */}
                <div className="p-6 bg-primary text-white rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-primary-100">Total del Pedido</p>
                      <p className="text-sm text-primary-200">
                        {items.reduce((sum, i) => sum + i.quantity, 0)} unidades en total
                      </p>
                    </div>
                    <span className="text-3xl font-bold">
                      {formatCurrency(calculateTotal())}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          {currentStep < 3 ? (
            <Button
              variant="primary"
              onClick={() => setCurrentStep(currentStep + 1)}
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Guardando...' : 'Crear Pedido'}
            </Button>
          )}
        </div>
      </PageContainer>
    </AppLayout>
  );
}
