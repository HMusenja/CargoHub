import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Amara Okafor",
    role: "Business Owner, Lagos",
    content: "CargoHub has transformed my import business. Fast, reliable, and their tracking system gives me complete peace of mind.",
    rating: 5,
  },
  {
    name: "David Schmidt",
    role: "Logistics Manager, Berlin",
    content: "Best shipping service I've used for Europe-Africa routes. Professional team and excellent customer support.",
    rating: 5,
  },
  {
    name: "Fatima Hassan",
    role: "Entrepreneur, Nairobi",
    content: "Affordable rates without compromising on quality. I ship with CargoHub every month and never had an issue.",
    rating: 5,
  },
];

const Testimonials = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Trusted by Thousands
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See what our customers say about their experience
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="shadow-[var(--shadow-card)]">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-foreground mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;