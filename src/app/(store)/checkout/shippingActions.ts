'use server';

import { CartItem } from "@/stores/cartStore";

export interface ShippingOption {
  provider: 'correo_argentino' | 'andreani';
  serviceName: string;
  type: 'sucursal' | 'domicilio';
  cost: number;
  days: string;
  code: string;
}

// Simple in-memory cache to avoid saturating shipping APIs
const shippingCache = new Map<string, { options: ShippingOption[], timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Calculates shipping options for a given ZIP code and cart items.
 * Integrates with external shipping API endpoints and falls back gracefully to a regional matrix.
 */
export async function getShippingOptions(
  zipCode: string, 
  items: CartItem[]
): Promise<{ success: boolean; data: ShippingOption[]; error?: string }> {
  
  if (!zipCode || zipCode.length < 4) {
    return { success: false, data: [], error: "Código postal inválido." };
  }

  // 1. Check Cache
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const cacheKey = `${zipCode}_${totalItemsCount}`;
  const cached = shippingCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return { success: true, data: cached.options };
  }

  // 2. Estimate dimensions and weight
  const totalWeightKg = (totalItemsCount * 300) / 1000; // Average 300g per item
  const volumeCm3 = totalItemsCount * 1200; // Average 1200 cm3 per item

  // 3. Parallel rate fetching
  const options: ShippingOption[] = [];
  const promises = [
    fetchAndreaniRate(zipCode, totalWeightKg, volumeCm3),
    fetchCorreoArgentinoRate(zipCode, totalWeightKg)
  ];

  try {
    const results = await Promise.allSettled(promises);
    
    results.forEach(res => {
      if (res.status === 'fulfilled' && res.value) {
        options.push(...res.value);
      }
    });

    // Sort options from cheapest to most expensive
    options.sort((a, b) => a.cost - b.cost);

    // Save in cache
    shippingCache.set(cacheKey, { options, timestamp: Date.now() });

    return { success: true, data: options };

  } catch (err: any) {
    console.error("Shipping calculation failure:", err);
    return { success: false, data: [], error: "No se pudieron obtener cotizaciones en este momento." };
  }
}

/**
 * Andreani API rate fetch with robust local fallback.
 */
async function fetchAndreaniRate(
  zipCode: string, 
  weightKg: number, 
  volumeCm3: number
): Promise<ShippingOption[]> {
  try {
    const clientSecret = process.env.ANDREANI_API_KEY; // "client_id:client_secret"
    const url = process.env.NODE_ENV === 'production' 
      ? 'https://api.andreani.com' 
      : 'https://apisandbox.andreani.com';

    if (!clientSecret) {
      return getFallbackRates(zipCode, 'andreani');
    }

    const authRes = await fetch(`${url}/v2/login`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${clientSecret}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!authRes.ok) throw new Error("Andreani auth failed");
    const { token } = await authRes.json();
    const contract = process.env.ANDREANI_CONTRATO || '400006711'; 

    const rateRes = await fetch(`${url}/v1/tarifas`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        remitente: { postal: "1414" }, // Glak Physical Showroom (Palermo, CABA)
        destinatario: { postal: zipCode },
        bultos: [{
          peso: weightKg * 1000, // grams
          volumen: volumeCm3,
          valorDeclarado: 50000
        }],
        contrato: contract
      })
    });

    if (!rateRes.ok) throw new Error("Andreani rate lookup failed");
    const data = await rateRes.json();

    return [
      {
        provider: 'andreani',
        serviceName: 'Andreani Sucursal',
        type: 'sucursal',
        cost: Math.round(data.tarifaConIva * 0.85),
        days: '2 a 3 días hábiles',
        code: 'andreani_sucursal'
      },
      {
        provider: 'andreani',
        serviceName: 'Andreani a Domicilio',
        type: 'domicilio',
        cost: Math.round(data.tarifaConIva),
        days: '3 a 4 días hábiles',
        code: 'andreani_domicilio'
      }
    ];

  } catch (e) {
    console.warn("Andreani API failed, using fallbacks:", e);
    return getFallbackRates(zipCode, 'andreani');
  }
}

/**
 * Correo Argentino Pack.ar API rate fetch with robust local fallback.
 */
async function fetchCorreoArgentinoRate(zipCode: string, weightKg: number): Promise<ShippingOption[]> {
  try {
    const url = 'https://api.correoargentino.com.ar/packar/v1';
    const apiKey = process.env.CORREO_ARGENTINO_API_KEY;

    if (!apiKey) {
      return getFallbackRates(zipCode, 'correo_argentino');
    }

    const res = await fetch(`${url}/tarifas?origen=1414&destino=${zipCode}&peso=${weightKg * 1000}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!res.ok) throw new Error("Correo Argentino rate API failed");
    const data = await res.json();

    return [
      {
        provider: 'correo_argentino',
        serviceName: 'Correo Argentino Sucursal',
        type: 'sucursal',
        cost: Math.round(data.costoSucursal),
        days: '3 a 5 días hábiles',
        code: 'correo_argentino_sucursal'
      },
      {
        provider: 'correo_argentino',
        serviceName: 'Correo Argentino Domicilio',
        type: 'domicilio',
        cost: Math.round(data.costoDomicilio),
        days: '4 a 6 días hábiles',
        code: 'correo_argentino_domicilio'
      }
    ];

  } catch (e) {
    console.warn("Correo Argentino API failed, using fallbacks:", e);
    return getFallbackRates(zipCode, 'correo_argentino');
  }
}

/**
 * Failsafe local pricing matrix based on Argentinian postal codes.
 */
function getFallbackRates(zipCode: string, provider: 'andreani' | 'correo_argentino'): ShippingOption[] {
  const cp = parseInt(zipCode);
  
  // Regional modifiers based on ZIP range
  let multiplier = 1.0;
  let region = "Buenos Aires";
  
  if (cp >= 1000 && cp <= 1499) { // CABA
    multiplier = 0.7; 
    region = "CABA";
  } else if (cp >= 1500 && cp <= 1999) { // GBA
    multiplier = 0.85;
    region = "GBA";
  } else if (cp >= 2000 && cp <= 4999) { // Centro / Litoral
    multiplier = 1.2;
    region = "Zona Centro";
  } else if (cp >= 5000 && cp <= 7999) { // NOA / Cuyo
    multiplier = 1.4;
    region = "Zona Norte/Cuyo";
  } else if (cp >= 8000) { // Patagonia
    multiplier = 1.8;
    region = "Patagonia";
  }

  const baseCost = 2800; // Base reference price in ARS

  if (provider === 'andreani') {
    return [
      {
        provider: 'andreani',
        serviceName: 'Andreani Sucursal (Failsafe)',
        type: 'sucursal',
        cost: Math.round(baseCost * multiplier * 0.9),
        days: region === 'CABA' ? '1 a 2 días hábiles' : '3 a 4 días hábiles',
        code: 'andreani_sucursal'
      },
      {
        provider: 'andreani',
        serviceName: 'Andreani Domicilio (Failsafe)',
        type: 'domicilio',
        cost: Math.round(baseCost * multiplier * 1.15),
        days: region === 'CABA' ? '2 a 3 días hábiles' : '4 a 5 días hábiles',
        code: 'andreani_domicilio'
      }
    ];
  } else {
    return [
      {
        provider: 'correo_argentino',
        serviceName: 'Correo Argentino Sucursal (Failsafe)',
        type: 'sucursal',
        cost: Math.round(baseCost * multiplier * 0.8),
        days: region === 'CABA' ? '2 a 3 días hábiles' : '4 a 5 días hábiles',
        code: 'correo_argentino_sucursal'
      },
      {
        provider: 'correo_argentino',
        serviceName: 'Correo Argentino Domicilio (Failsafe)',
        type: 'domicilio',
        cost: Math.round(baseCost * multiplier * 1.05),
        days: region === 'CABA' ? '3 a 4 días hábiles' : '5 a 7 días hábiles',
        code: 'correo_argentino_domicilio'
      }
    ];
  }
}
