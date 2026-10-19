'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCartStore, CartItem } from '@/stores/cartStore';
import { 
  initiateCheckoutAction, 
  ShippingDetails,
  syncAbandonedCartAction,
  getAbandonedCartAction,
  markCartAsConvertedAction
} from './actions';
import { getShippingOptions, ShippingOption } from './shippingActions';
import { 
  ShoppingCart, 
  AlertTriangle, 
  Loader2, 
  Clock, 
  Timer, 
  Lock, 
  CreditCard 
} from 'lucide-react';

/**
 * Unique key for saving checkout shipping details in localStorage.
 */
const STORAGE_KEY = 'glak_checkout_shipping_v1';

export default function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recoverSessionId = searchParams.get('recover_session');
  
  // Zustand Store
  const items = useCartStore((state) => state.items);
  const totalPrice = useCartStore((state) => state.totalPrice);
  const clearCart = useCartStore((state) => state.clearCart);
  const totalItems = useCartStore((state) => state.totalItems);
  const restoreCart = useCartStore((state) => state.restoreCart);

  // Core state
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form input state
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    zipCode: '',
    street: '',
    number: '',
    floor: '',
    apartment: '',
    city: '',
    state: 'Buenos Aires',
  });

  // Shipping selection state
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);

  // Session ID for transactional stock lock (persisted per session)
  const [sessionId, setSessionId] = useState<string>('');

  // 15-Minute Countdown Timer (900 seconds)
  const [timerSeconds, setTimerSeconds] = useState(900);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Hydration safety check and Recovery check
  useEffect(() => {
    setMounted(true);

    // Initialize session ID
    let sId = sessionStorage.getItem('glak_checkout_session');
    if (!sId) {
      sId = `session_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
      sessionStorage.setItem('glak_checkout_session', sId);
    }
    setSessionId(sId);

    // Load saved form data from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setForm(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Could not read saved shipping details from localStorage:", e);
    }

    // Ingest recovery session if present in URL
    if (recoverSessionId) {
      const loadRecovery = async () => {
        try {
          const res = await getAbandonedCartAction(recoverSessionId);
          if (res.success && res.data) {
            const cartData = res.data;
            // 1. Populate form fields
            setForm((prev) => ({
              ...prev,
              firstName: cartData.first_name || '',
              lastName: cartData.last_name || '',
              email: cartData.email || '',
            }));
            
            // 2. Hydrate Zustand store items
            if (Array.isArray(cartData.cart_items) && cartData.cart_items.length > 0) {
              restoreCart(cartData.cart_items);
            }

            // 3. Persist the recovered cart ID to sessionStorage
            sessionStorage.setItem('glak_abandoned_cart_id', cartData.id);
          }
        } catch (e) {
          console.error("Could not load recovery session:", e);
        }
      };
      loadRecovery();
    }
  }, [recoverSessionId, restoreCart]);

  // Countdown timer effect
  useEffect(() => {
    if (!isTimerActive || timerSeconds <= 0) return;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setErrorMsg("La reserva de stock ha expirado. Por favor, reinicia el checkout.");
          setStep(1);
          setIsTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerActive, timerSeconds]);

  // Save form to localStorage on change
  useEffect(() => {
    if (!mounted) return;
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      } catch (e) {
        console.warn("Could not write shipping details to localStorage:", e);
      }
    }, 800); // Debounce saves by 800ms
    return () => clearTimeout(timeout);
  }, [form, mounted]);

  // Synchronize abandoned cart to database whenever form details or cart items change (debounced)
  useEffect(() => {
    if (!mounted) return;
    
    // Check for valid email and non-empty items
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email || !emailRegex.test(form.email) || items.length === 0) {
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const activeCartId = sessionStorage.getItem('glak_abandoned_cart_id');
        const res = await syncAbandonedCartAction(
          activeCartId,
          form.email,
          form.firstName,
          form.lastName,
          items
        );

        if (res.success && res.cartId) {
          sessionStorage.setItem('glak_abandoned_cart_id', res.cartId);
        }
      } catch (err) {
        console.error("Failed to sync abandoned cart:", err);
      }
    }, 2000); // Debounce for 2000ms

    return () => clearTimeout(delayDebounceFn);
  }, [form.email, form.firstName, form.lastName, items, mounted]);

  // Format countdown time into MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Handle standard text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Step 1 Submission: Proceed to Step 2 & Calculate Shipping
  const handleGoToShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate main inputs
    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.zipCode || !form.street || !form.number || !form.city) {
      setErrorMsg("Por favor, completa todos los campos requeridos.");
      return;
    }

    setLoadingShipping(true);
    setStep(2);

    try {
      const res = await getShippingOptions(form.zipCode, items);
      if (res.success && res.data.length > 0) {
        setShippingOptions(res.data);
        // Default to the cheapest option
        setSelectedShipping(res.data[0]);
      } else {
        setErrorMsg(res.error || "No se pudieron cotizar opciones de envío. Revisa tu código postal.");
      }
    } catch (err) {
      setErrorMsg("Ocurrió un error al calcular los envíos. Intenta nuevamente.");
    } finally {
      setLoadingShipping(false);
    }
  };

  // Step 2 Submission: Proceed to Step 3 (Review) & Lock stock
  const handleGoToReview = () => {
    if (!selectedShipping) {
      setErrorMsg("Por favor, selecciona un método de envío.");
      return;
    }
    setErrorMsg(null);
    setStep(3);
    
    // Start countdown timer for the stock lock
    setTimerSeconds(900); // 15 mins
    setIsTimerActive(true);
  };

  // Step 3 Submission: Finalize checkout, register order, redirect to Mercado Pago Checkout Pro
  const handlePayment = async () => {
    if (!selectedShipping || items.length === 0) return;
    setLoading(true);
    setErrorMsg(null);

    const shippingDetails: ShippingDetails = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      zipCode: form.zipCode,
      street: form.street,
      number: form.number,
      floor: form.floor || undefined,
      apartment: form.apartment || undefined,
      city: form.city,
      state: form.state,
      shippingMethod: selectedShipping.code,
      shippingCost: selectedShipping.cost,
    };

    try {
      const res = await initiateCheckoutAction(items, shippingDetails, sessionId);
      if (res.success && res.initPoint) {
        // Mark abandoned cart as converted if we have an active sync session
        const activeCartId = sessionStorage.getItem('glak_abandoned_cart_id');
        if (activeCartId) {
          await markCartAsConvertedAction(activeCartId);
          sessionStorage.removeItem('glak_abandoned_cart_id');
        }

        // Clear local cart store as preference is created and order recorded
        clearCart();
        // Redirect browser to secure Mercado Pago Checkout Pro portal
        window.location.href = res.initPoint;
      } else {
        setErrorMsg(res.error || "Error al iniciar el pago con Mercado Pago.");
        setIsTimerActive(false);
      }
    } catch (err: any) {
      console.error("Payment action failed:", err);
      setErrorMsg("Error de comunicación. Por favor, reintente en unos instantes.");
      setIsTimerActive(false);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return <CheckoutSkeleton />;
  }

  if (items.length === 0) {
    return (
      <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center', minHeight: '60vh' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <ShoppingCart size={64} style={{ color: 'var(--text-tertiary)' }} strokeWidth={1.5} aria-hidden="true" />
        </div>
        <h2 style={{ fontFamily: 'var(--font-outfit)', fontSize: 'var(--text-3xl)', marginBottom: '1rem' }}>Tu carrito está vacío</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 2rem auto' }}>
          No tenés productos agregados para realizar el checkout. Agregá algunas prendas exclusivas en la tienda.
        </p>
        <Link href="/tienda" className="btn btn-primary">
          Explorar Tienda
        </Link>
      </div>
    );
  }

  const subtotal = totalPrice();
  const shippingCost = selectedShipping ? selectedShipping.cost : 0;
  const total = subtotal + shippingCost;

  return (
    <div className="container" style={{ paddingBlock: 'var(--space-12)' }}>
      {/* Elegante barra de progreso en 3 pasos */}
      <div style={{ maxWidth: '800px', margin: '0 auto var(--space-8) auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
          
          <div style={{ flex: 1, height: '2px', backgroundColor: 'var(--border-subtle)', position: 'absolute', top: '22px', left: '0', right: '0', zIndex: 1 }} />
          <div style={{ flex: 1, height: '2px', backgroundColor: 'var(--accent-primary)', position: 'absolute', top: '22px', left: '0', right: step === 1 ? '100%' : step === 2 ? '50%' : '0%', transition: 'all var(--transition-slow)', zIndex: 2 }} />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3, position: 'relative' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: step >= 1 ? 'var(--accent-primary)' : 'var(--bg-surface)',
              color: step >= 1 ? 'var(--text-on-accent)' : 'var(--text-secondary)',
              border: '2px solid var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '1rem',
              transition: 'all var(--transition-base)'
            }}>
              1
            </div>
            <span style={{ fontSize: 'var(--text-xs)', color: step >= 1 ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: step >= 1 ? 600 : 400, marginTop: 'var(--space-2)' }}>Envío</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3, position: 'relative' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: step >= 2 ? 'var(--accent-primary)' : 'var(--bg-surface)',
              color: step >= 2 ? 'var(--text-on-accent)' : 'var(--text-secondary)',
              border: `2px solid ${step >= 2 ? 'var(--accent-primary)' : 'var(--border-strong)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '1rem',
              transition: 'all var(--transition-base)'
            }}>
              2
            </div>
            <span style={{ fontSize: 'var(--text-xs)', color: step >= 2 ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: step >= 2 ? 600 : 400, marginTop: 'var(--space-2)' }}>Método</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3, position: 'relative' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: step >= 3 ? 'var(--accent-primary)' : 'var(--bg-surface)',
              color: step >= 3 ? 'var(--text-on-accent)' : 'var(--text-secondary)',
              border: `2px solid ${step >= 3 ? 'var(--accent-primary)' : 'var(--border-strong)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '1rem',
              transition: 'all var(--transition-base)'
            }}>
              3
            </div>
            <span style={{ fontSize: 'var(--text-xs)', color: step >= 3 ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: step >= 3 ? 600 : 400, marginTop: 'var(--space-2)' }}>Revisión</span>
          </div>

        </div>
      </div>

      <h1 className="font-editorial" style={{ fontSize: 'var(--text-3xl)', textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        Checkout
      </h1>

      {errorMsg && (
        <div style={{
          backgroundColor: 'rgba(212, 97, 58, 0.08)',
          color: 'var(--error)',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-md)',
          border: '1.5px solid rgba(212, 97, 58, 0.2)',
          maxWidth: '900px',
          margin: '0 auto var(--space-6) auto',
          fontSize: 'var(--text-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)'
        }}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid Layout Principal */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 'var(--space-8)',
        maxWidth: '1000px',
        margin: '0 auto'
      }} className="sm:grid-cols-2 lg:grid-cols-5">
        
        {/* LADO IZQUIERDO: Formularios según paso actual */}
        <div className="glass-float lg:col-span-3" style={{
          padding: 'var(--space-6)',
          gridColumn: 'span 1',
        } as any}>
          
          {step === 1 && (
            <form onSubmit={handleGoToShipping} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h2 className="font-heading" style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-2)' }}>
                Datos de Envío
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <label className="label">Nombre *</label>
                  <input type="text" name="firstName" required className="input" value={form.firstName} onChange={handleInputChange} placeholder="Thiago" />
                </div>
                <div>
                  <label className="label">Apellido *</label>
                  <input type="text" name="lastName" required className="input" value={form.lastName} onChange={handleInputChange} placeholder="Garcia" />
                </div>
              </div>

              <div>
                <label className="label">Email de Contacto *</label>
                <input type="email" name="email" required className="input" value={form.email} onChange={handleInputChange} placeholder="thiago@ejemplo.com" />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Usaremos este email para enviarte la confirmación del pago.</span>
              </div>

              <div>
                <label className="label">Teléfono *</label>
                <input type="tel" name="phone" required className="input" value={form.phone} onChange={handleInputChange} placeholder="11 3456 7890" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <label className="label">Calle *</label>
                  <input type="text" name="street" required className="input" value={form.street} onChange={handleInputChange} placeholder="Av. Santa Fe" />
                </div>
                <div>
                  <label className="label">Número *</label>
                  <input type="text" name="number" required className="input" value={form.number} onChange={handleInputChange} placeholder="3400" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <label className="label">Piso (Opcional)</label>
                  <input type="text" name="floor" className="input" value={form.floor} onChange={handleInputChange} placeholder="4" />
                </div>
                <div>
                  <label className="label">Depto (Opcional)</label>
                  <input type="text" name="apartment" className="input" value={form.apartment} onChange={handleInputChange} placeholder="B" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr', gap: 'var(--space-4)' }}>
                <div>
                  <label className="label">Ciudad *</label>
                  <input type="text" name="city" required className="input" value={form.city} onChange={handleInputChange} placeholder="CABA" />
                </div>
                <div>
                  <label className="label">Código Postal *</label>
                  <input type="text" name="zipCode" required className="input" value={form.zipCode} onChange={handleInputChange} placeholder="1425" />
                </div>
              </div>

              <div>
                <label className="label">Provincia *</label>
                <select name="state" className="input" value={form.state} onChange={handleInputChange}>
                  <option value="CABA">Capital Federal (CABA)</option>
                  <option value="Buenos Aires">Buenos Aires</option>
                  <option value="Catamarca">Catamarca</option>
                  <option value="Chaco">Chaco</option>
                  <option value="Chubut">Chubut</option>
                  <option value="Córdoba">Córdoba</option>
                  <option value="Corrientes">Corrientes</option>
                  <option value="Entre Ríos">Entre Ríos</option>
                  <option value="Formosa">Formosa</option>
                  <option value="Jujuy">Jujuy</option>
                  <option value="La Pampa">La Pampa</option>
                  <option value="La Rioja">La Rioja</option>
                  <option value="Mendoza">Mendoza</option>
                  <option value="Misiones">Misiones</option>
                  <option value="Neuquén">Neuquén</option>
                  <option value="Río Negro">Río Negro</option>
                  <option value="Salta">Salta</option>
                  <option value="San Juan">San Juan</option>
                  <option value="San Luis">San Luis</option>
                  <option value="Santa Cruz">Santa Cruz</option>
                  <option value="Santa Fe">Santa Fe</option>
                  <option value="Santiago del Estero">Santiago del Estero</option>
                  <option value="Tierra del Fuego">Tierra del Fuego</option>
                  <option value="Tucumán">Tucumán</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
                Continuar a Envíos
              </button>
            </form>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              <h2 className="font-heading" style={{ fontSize: 'var(--text-xl)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-2)' }}>
                Método de Envío
              </h2>

              {loadingShipping ? (
                <div style={{ padding: 'var(--space-8) 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Loader2 size={32} style={{ animation: 'spin 1.5s linear infinite', color: 'var(--accent-primary)' }} aria-hidden="true" />
                  <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-3)' }}>Cotizando tarifas en Correo Argentino y Andreani...</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {shippingOptions.map((opt) => (
                    <label key={opt.code} style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: 'var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      border: selectedShipping?.code === opt.code ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      backgroundColor: selectedShipping?.code === opt.code ? 'var(--accent-light)' : 'var(--bg-surface)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}>
                      <input
                        type="radio"
                        name="shippingOption"
                        checked={selectedShipping?.code === opt.code}
                        onChange={() => setSelectedShipping(opt)}
                        style={{ marginRight: 'var(--space-4)', accentColor: 'var(--accent-primary)' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{opt.serviceName}</span>
                          <span style={{ color: 'var(--accent-primary)' }}>${opt.cost.toLocaleString('es-AR')}</span>
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} aria-hidden="true" />
                            {opt.days}
                          </span>
                          <span style={{ textTransform: 'capitalize', fontStyle: 'italic' }}>{opt.type}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                  
                  <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-6)' }}>
                    <button onClick={() => setStep(1)} className="btn btn-secondary" style={{ flex: 1 }}>
                      Volver
                    </button>
                    <button onClick={handleGoToReview} className="btn btn-primary" style={{ flex: 2 }}>
                      Continuar a Revisión
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="font-heading" style={{ fontSize: 'var(--text-xl)' }}>
                  Confirmación de Pago
                </h2>
                
                {/* 15-Minute Countdown Display */}
                <div style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  border: '1px solid rgba(86, 130, 3, 0.15)'
                }}>
                  <Timer size={14} style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
                  <span>Reserva: {formatTime(timerSeconds)}</span>
                </div>
              </div>

              {/* Informative notification message */}
              <div style={{
                backgroundColor: 'var(--accent-light)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
                borderLeft: '4px solid var(--accent-primary)',
                fontSize: 'var(--text-sm)',
                lineHeight: 1.5
              }}>
                <strong style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Lock size={14} aria-hidden="true" />
                  Stock Reservado en Exclusividad
                </strong>
                Tu selección de indumentaria se encuentra bloqueada por 15 minutos en nuestro stock de depósito para que puedas completar tu pago sin riesgos de sobreventa.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>Resumen de Entrega</h3>
                
                <div style={{
                  backgroundColor: 'var(--bg-subtle)',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Cliente: </span>
                    <strong>{form.firstName} {form.lastName}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Contacto: </span>
                    <span>{form.email} | {form.phone}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Dirección: </span>
                    <span>{form.street} {form.number} {form.floor ? `, Piso ${form.floor}` : ''} {form.apartment ? ` ${form.apartment}` : ''}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Localidad: </span>
                    <span>{form.city}, {form.state} (CP {form.zipCode})</span>
                  </div>
                  <div style={{ marginTop: 'var(--space-2)', paddingTop: 'var(--space-2)', borderTop: '1.5px dashed var(--border-strong)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Flete: </span>
                    <strong>{selectedShipping?.serviceName}</strong>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>
                      (<Clock size={11} aria-hidden="true" /> {selectedShipping?.days})
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
                <button onClick={() => setStep(2)} className="btn btn-secondary" style={{ flex: 1 }} disabled={loading}>
                  Volver
                </button>
                <button onClick={handlePayment} className="btn btn-primary" style={{ flex: 2, gap: 'var(--space-3)' }} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 size={18} style={{ animation: 'spin 1.5s linear infinite' }} aria-hidden="true" /> Procesando pago...
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} aria-hidden="true" /> PAGAR CON MERCADO PAGO
                    </>
                  )}
                </button>
              </div>

              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 'var(--space-2)' }}>
                Al hacer clic, te redirigiremos de forma segura a la pasarela Checkout Pro de Mercado Pago para abonar con tarjetas de crédito/débito o dinero en cuenta.
              </p>
            </div>
          )}

        </div>

        {/* LADO DERECHO: Resumen del Pedido (Productos) */}
        <div style={{ gridColumn: 'span 1' } as any} className="lg:col-span-2">
          <div className="glass-float" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', position: 'sticky', top: '100px' }}>
            <h2 className="font-heading" style={{ fontSize: 'var(--text-lg)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-2)', margin: 0 }}>
              Tu Orden
            </h2>

            {/* Listado de prendas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
              {items.map((item) => (
                <div key={`${item.id}_${item.size}_${item.color}`} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{ width: '56px', height: '70px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                      {item.name}
                    </h4>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                      Talle: {item.size} | Color: {item.color}
                    </p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '2px 0 0 0' }}>
                      Cantidad: {item.quantity}
                    </p>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                    ${(item.price * item.quantity).toLocaleString('es-AR')}
                  </div>
                </div>
              ))}
            </div>

            {/* Totales de precio */}
            <div style={{
              marginTop: 'var(--space-2)',
              paddingTop: 'var(--space-4)',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
              fontSize: 'var(--text-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Prendas ({totalItems()})</span>
                <span>${subtotal.toLocaleString('es-AR')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Envío</span>
                {selectedShipping ? (
                  <span>${shippingCost.toLocaleString('es-AR')}</span>
                ) : (
                  <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>A calcular</span>
                )}
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 'var(--text-base)',
                fontWeight: 700,
                marginTop: 'var(--space-2)',
                paddingTop: 'var(--space-3)',
                borderTop: '1.5px solid var(--border-strong)',
                color: 'var(--text-primary)'
              }}>
                <span>Total</span>
                <span>${total.toLocaleString('es-AR')}</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* CSS Animación simple inline para rotador */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/**
 * Loading skeleton to display during React hydration mounting phase
 */
function CheckoutSkeleton() {
  return (
    <div className="container" style={{ paddingBlock: 'var(--space-12)', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ height: '40px', width: '250px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', margin: '0 auto var(--space-8) auto' }} className="skeleton" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-8)' }} className="sm:grid-cols-2 lg:grid-cols-5">
        <div style={{ height: '500px', gridColumn: 'span 1' } as any} className="lg:col-span-3 skeleton" />
        <div style={{ height: '350px', gridColumn: 'span 1' } as any} className="lg:col-span-2 skeleton" />
      </div>
    </div>
  );
}
