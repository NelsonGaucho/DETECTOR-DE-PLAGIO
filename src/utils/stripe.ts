
import { toast } from "sonner";

// Datos del pago
export interface PaymentData {
  amount: number;
  plan: string;
  email: string;
}

// Interfaz para los elementos del formulario de Stripe
export interface StripeElements {
  stripe: any;
  elements: any;
  clientSecret: string;
}

// Función para cargar el script de Stripe
export const loadStripeScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).Stripe) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar Stripe"));
    document.body.appendChild(script);
  });
};

// Inicializar Stripe con la clave publicable
export const initializeStripe = async (): Promise<any> => {
  await loadStripeScript();
  return (window as any).Stripe("pk_live_51NG1WAApPssJbISHbPMcYV8oL8mnAK6lWO3tT0K20RQ1dR2tHqi5YboYlq6uJBT6YYY86F6CRgtmpYvPok9CGORA00qIxCoDjI");
};

// Crear un PaymentIntent simulado (en una implementación real, se haría desde el backend)
export const createPaymentIntent = async (paymentData: PaymentData): Promise<string> => {
  // Esta es una simulación. En una implementación real, esto se haría en el backend
  console.log("Creando PaymentIntent para:", paymentData);
  
  // Simulamos una respuesta del servidor con un clientSecret
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generamos un cliente secreto falso para la simulación
      const clientSecret = `pi_${Math.random().toString(36).substring(2)}_secret_${Math.random().toString(36).substring(2)}`;
      resolve(clientSecret);
    }, 1000);
  });
};

// Configurar los elementos de Stripe para el formulario de pago
export const setupStripeElements = async (paymentData: PaymentData): Promise<StripeElements> => {
  try {
    const stripe = await initializeStripe();
    const clientSecret = await createPaymentIntent(paymentData);
    
    const elements = stripe.elements({
      clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#0066cc',
          colorBackground: '#ffffff',
          colorText: '#333333',
          colorDanger: '#df1b41',
          fontFamily: 'Inter, system-ui, sans-serif',
          borderRadius: '8px',
        },
      },
    });
    
    return { stripe, elements, clientSecret };
  } catch (error) {
    console.error("Error al configurar Stripe:", error);
    toast.error("Error al configurar el pago");
    throw error;
  }
};

// Simular un proceso de pago exitoso
export const processPayment = async (
  stripe: any, 
  elements: any, 
  clientSecret: string
): Promise<boolean> => {
  try {
    // Simulamos un pago exitoso
    console.log("Procesando pago con:", { stripe, elements, clientSecret });
    
    // En una implementación real, confirmaríamos el pago con Stripe
    // const result = await stripe.confirmPayment({
    //   elements,
    //   clientSecret,
    //   confirmParams: {
    //     return_url: `${window.location.origin}/payment-success`,
    //   },
    // });
    
    // Simulación
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulamos un pago exitoso el 90% de las veces
        const isSuccess = Math.random() < 0.9;
        
        if (isSuccess) {
          toast.success("Pago procesado con éxito");
          resolve(true);
        } else {
          toast.error("Error al procesar el pago");
          resolve(false);
        }
      }, 2000);
    });
  } catch (error) {
    console.error("Error en el pago:", error);
    toast.error("Error al procesar el pago");
    return false;
  }
};
