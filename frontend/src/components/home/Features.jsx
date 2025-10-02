import { Shield, Clock, Bell, Truck, DollarSign, Headphones } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Shield,
    title: "Secure Shipping",
    description: "Your cargo is fully insured and protected throughout the journey",
    bg: "bg-[url('/images/bg-shield.jpg')]",
  },
  {
    icon: Clock,
    title: "Real-Time Tracking",
    description: "Monitor your shipment 24/7 with live GPS tracking updates",
    bg: "bg-[url('/images/bg-clock.jpg')]",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Get instant alerts via SMS and email at every shipping milestone",
    bg: "bg-[url('/images/bg-bell.jpg')]",
  },
  {
    icon: Truck,
    title: "Multiple Delivery Options",
    description: "Choose from express, standard, or economy shipping methods",
    bg: "bg-[url('/images/bg-truck.jpg')]",
  },
  {
    icon: DollarSign,
    title: "Competitive Pricing",
    description: "Transparent pricing with no hidden fees or surprise charges",
    bg: "bg-[url('/images/bg-dollar.jpg')]",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Expert customer service team ready to assist anytime",
    bg: "bg-[url('/images/bg-headphones.jpg')]",
  },
];

const Features = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-blue-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-primary mb-4 animate-fade-in">
            Why Choose CargoHub?
          </h2>
          <p className="text-lg text-primary/70 max-w-2xl mx-auto animate-fade-in delay-200">
            We provide comprehensive shipping solutions with unmatched reliability
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className={`
                relative overflow-hidden shadow-lg hover:shadow-2xl transition-transform duration-500 
                hover:-translate-y-2 border-2 border-transparent hover:border-primary/40
                ${feature.bg} bg-cover bg-center
              `}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />
              <CardHeader className="flex flex-col items-center relative z-10">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 via-secondary/30 to-accent/30 flex items-center justify-center mb-4 animate-pulse-slow hover:animate-pulse-fast">
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-white text-center">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-white/90 text-center">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;




