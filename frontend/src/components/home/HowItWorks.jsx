import { FileText, CreditCard, MapPin, Package2 } from "lucide-react";

const steps = [
  {
    icon: FileText,
    title: "Book Your Shipment",
    description: "Get an instant quote and book your shipment online in minutes",
  },
  {
    icon: CreditCard,
    title: "Secure Payment",
    description: "Pay securely using multiple payment methods with full protection",
  },
  {
    icon: MapPin,
    title: "Track in Real-Time",
    description: "Monitor your shipment's journey with live tracking updates",
  },
  {
    icon: Package2,
    title: "Safe Delivery",
    description: "Receive your package safely at your destination address",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Simple, transparent process from booking to delivery
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 shadow-[var(--shadow-card)]">
                  <step.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="absolute top-8 left-1/2 w-full h-0.5 bg-border -z-10 hidden lg:block last:hidden" 
                     style={{ transform: 'translateX(50%)' }}></div>
                <span className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </span>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
