import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Package, MapPin, Clock, CheckCircle } from "lucide-react";

const Track = () => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [showResult, setShowResult] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      setShowResult(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
     
      
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Track Your Shipment
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              Enter your tracking number to see real-time updates
            </p>
          </div>

          <Card className="shadow-lg mb-8">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tracking-number">Tracking Reference Number</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="tracking-number"
                      placeholder="e.g., CH-2025-789456"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="flex-1"
                      required
                    />
                    <Button type="submit" size="lg" className="px-8">
                      <Search className="h-4 w-4 mr-2" />
                      Track
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  You can find your tracking number in the confirmation email or on your shipping label.
                </p>
              </form>
            </CardContent>
          </Card>

          {showResult && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              {/* Shipment Status Overview */}
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <CardTitle className="text-xl font-mono">{trackingNumber || "CH-2025-789456"}</CardTitle>
                      <CardDescription className="mt-1">
                        Estimated delivery: Jan 22, 2025
                      </CardDescription>
                    </div>
                    <Badge className="bg-blue-500">In Transit</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">From</p>
                        <p className="font-medium text-foreground">London, UK</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">To</p>
                        <p className="font-medium text-foreground">Lagos, Nigeria</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Weight</p>
                        <p className="font-medium text-foreground">5.2 kg</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tracking Timeline */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Tracking Timeline</CardTitle>
                  <CardDescription>Real-time updates on your shipment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {/* Current Location */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                          <CheckCircle className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div className="w-0.5 h-full bg-border mt-2" />
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-foreground">In Transit to Destination</h3>
                          <Badge variant="outline" className="w-fit">Current Location</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Clock className="h-4 w-4" />
                          <span>Jan 18, 2025 - 09:45 AM</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>Lagos Distribution Center, Nigeria</span>
                        </div>
                        <p className="text-sm text-foreground mt-2">
                          Package is currently in transit and will be delivered soon.
                        </p>
                      </div>
                    </div>

                    {/* Past Events */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                          <CheckCircle className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div className="w-0.5 h-full bg-border mt-2" />
                      </div>
                      <div className="flex-1 pb-8">
                        <h3 className="font-semibold text-foreground mb-2">Arrived at Destination Country</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Clock className="h-4 w-4" />
                          <span>Jan 17, 2025 - 22:30 PM</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>Murtala Muhammed Airport, Lagos</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                          <CheckCircle className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div className="w-0.5 h-full bg-border mt-2" />
                      </div>
                      <div className="flex-1 pb-8">
                        <h3 className="font-semibold text-foreground mb-2">Departed from Origin</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Clock className="h-4 w-4" />
                          <span>Jan 16, 2025 - 18:15 PM</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>Heathrow Airport, London</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                          <CheckCircle className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div className="w-0.5 h-full bg-border mt-2" />
                      </div>
                      <div className="flex-1 pb-8">
                        <h3 className="font-semibold text-foreground mb-2">Package Processed</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Clock className="h-4 w-4" />
                          <span>Jan 16, 2025 - 14:00 PM</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>London Distribution Center, UK</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                          <CheckCircle className="h-6 w-6 text-primary-foreground" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-2">Package Picked Up</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Clock className="h-4 w-4" />
                          <span>Jan 15, 2025 - 10:00 AM</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>123 Main Street, London, UK</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Info */}
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-foreground mb-3">Need Help?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    If you have any questions about your shipment, our support team is here to help.
                  </p>
                  <Button variant="outline">Contact Support</Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

   
    </div>
  );
};

export default Track;
