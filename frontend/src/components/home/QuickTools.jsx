import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Search } from "lucide-react";

const QuickTools = () => {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [weight, setWeight] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  return (
    <section id="quick-tools" className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Quote Widget */}
          <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="h-5 w-5 text-primary" />
                <CardTitle>Get Instant Quote</CardTitle>
              </div>
              <CardDescription>Calculate shipping costs in seconds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Origin</label>
                <Input 
                  placeholder="e.g., London, UK" 
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Destination</label>
                <Input 
                  placeholder="e.g., Lagos, Nigeria" 
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Weight (kg)</label>
                <Input 
                  type="number" 
                  placeholder="e.g., 25" 
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              <Button className="w-full">Calculate Cost</Button>
            </CardContent>
          </Card>

          {/* Track Widget */}
          <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Search className="h-5 w-5 text-primary" />
                <CardTitle>Track Your Shipment</CardTitle>
              </div>
              <CardDescription>Real-time tracking for peace of mind</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tracking Reference</label>
                <Input 
                  placeholder="Enter your tracking number" 
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
              </div>
              <div className="pt-16">
                <Button className="w-full" variant="secondary">Track Now</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default QuickTools;
