import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Clock, CheckCircle } from "lucide-react";

const Quote = () => {
  const [showResult, setShowResult] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowResult(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
   
      
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Get an Instant Quote
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              Calculate shipping costs in seconds
            </p>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Shipment Details</CardTitle>
              <CardDescription>Fill in the information below to get your quote</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="origin">Origin Country</Label>
                    <select 
                      id="origin"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      required
                    >
                      <option value="">Select country</option>
                      <option value="uk">United Kingdom</option>
                      <option value="germany">Germany</option>
                      <option value="france">France</option>
                      <option value="italy">Italy</option>
                      <option value="spain">Spain</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="destination">Destination Country</Label>
                    <select 
                      id="destination"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      required
                    >
                      <option value="">Select country</option>
                      <option value="nigeria">Nigeria</option>
                      <option value="kenya">Kenya</option>
                      <option value="ghana">Ghana</option>
                      <option value="south-africa">South Africa</option>
                      <option value="egypt">Egypt</option>
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input id="weight" type="number" placeholder="0.0" min="0" step="0.1" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="length">Length (cm)</Label>
                    <Input id="length" type="number" placeholder="0" min="0" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="width">Width (cm)</Label>
                    <Input id="width" type="number" placeholder="0" min="0" required />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input id="height" type="number" placeholder="0" min="0" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service">Service Type</Label>
                    <select 
                      id="service"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      required
                    >
                      <option value="">Select service</option>
                      <option value="standard">Standard (7-14 days)</option>
                      <option value="express">Express (3-5 days)</option>
                      <option value="priority">Priority (1-2 days)</option>
                    </select>
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full">
                  Calculate Quote
                </Button>
              </form>

              {showResult && (
                <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="border-t border-border pt-6">
                    <h3 className="text-xl font-semibold mb-4 text-foreground">Your Quote</h3>
                    
                    <div className="space-y-4">
                      <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-muted-foreground">Base Shipping Cost</span>
                            <span className="text-foreground font-semibold">£89.50</span>
                          </div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-muted-foreground">Service Fee</span>
                            <span className="text-foreground font-semibold">£12.00</span>
                          </div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-muted-foreground">Insurance</span>
                            <span className="text-foreground font-semibold">£5.50</span>
                          </div>
                          <div className="border-t border-border pt-4 flex items-center justify-between">
                            <span className="text-lg font-bold text-foreground">Total Cost</span>
                            <span className="text-2xl font-bold text-primary">£107.00</span>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-3 mb-2">
                              <Clock className="h-5 w-5 text-primary" />
                              <span className="font-semibold text-foreground">Estimated Delivery</span>
                            </div>
                            <p className="text-muted-foreground ml-8">7-14 business days</p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-3 mb-2">
                              <CheckCircle className="h-5 w-5 text-primary" />
                              <span className="font-semibold text-foreground">Tracking Included</span>
                            </div>
                            <p className="text-muted-foreground ml-8">Real-time updates</p>
                          </CardContent>
                        </Card>
                      </div>

                      <Button size="lg" className="w-full" variant="default">
                        Book This Shipment
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

 
    </div>
  );
};

export default Quote;
