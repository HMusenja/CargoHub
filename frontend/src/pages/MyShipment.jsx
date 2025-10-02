import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, Package, MapPin, Calendar, Clock } from "lucide-react";

const shipments = [
  {
    id: "CH-2025-789456",
    status: "in-transit",
    destination: "Lagos, Nigeria",
    date: "2025-01-15",
    weight: "5.2 kg",
    service: "Standard"
  },
  {
    id: "CH-2025-654321",
    status: "delivered",
    destination: "Nairobi, Kenya",
    date: "2025-01-10",
    weight: "3.8 kg",
    service: "Express"
  },
  {
    id: "CH-2025-123789",
    status: "pending",
    destination: "Accra, Ghana",
    date: "2025-01-20",
    weight: "7.5 kg",
    service: "Priority"
  },
  {
    id: "CH-2025-987654",
    status: "in-transit",
    destination: "Cairo, Egypt",
    date: "2025-01-12",
    weight: "4.1 kg",
    service: "Standard"
  }
];

const getStatusColor = (status) => {
  switch(status) {
    case "delivered": return "bg-green-500";
    case "in-transit": return "bg-blue-500";
    case "pending": return "bg-yellow-500";
    default: return "bg-gray-500";
  }
};

const getStatusText = (status) => {
  switch(status) {
    case "delivered": return "Delivered";
    case "in-transit": return "In Transit";
    case "pending": return "Pending";
    default: return status;
  }
};

const MyShipments = () => {
  const [selectedShipment, setSelectedShipment] = useState(null);

  return (
    <div className="min-h-screen flex flex-col">
    
      
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                My Shipments
              </h1>
              <p className="text-muted-foreground">
                Track and manage all your shipments
              </p>
            </div>
            <Button size="lg">
              New Shipment
            </Button>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Card className="shadow-lg">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border">
                      <tr className="bg-muted/50">
                        <th className="text-left py-4 px-6 font-semibold text-foreground">Reference</th>
                        <th className="text-left py-4 px-6 font-semibold text-foreground">Status</th>
                        <th className="text-left py-4 px-6 font-semibold text-foreground">Destination</th>
                        <th className="text-left py-4 px-6 font-semibold text-foreground">Date</th>
                        <th className="text-left py-4 px-6 font-semibold text-foreground">Weight</th>
                        <th className="text-left py-4 px-6 font-semibold text-foreground">Service</th>
                        <th className="text-left py-4 px-6 font-semibold text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shipments.map((shipment) => (
                        <tr key={shipment.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                          <td className="py-4 px-6">
                            <span className="font-mono text-sm text-foreground">{shipment.id}</span>
                          </td>
                          <td className="py-4 px-6">
                            <Badge className={getStatusColor(shipment.status)}>
                              {getStatusText(shipment.status)}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-foreground">{shipment.destination}</td>
                          <td className="py-4 px-6 text-muted-foreground">{shipment.date}</td>
                          <td className="py-4 px-6 text-muted-foreground">{shipment.weight}</td>
                          <td className="py-4 px-6 text-muted-foreground">{shipment.service}</td>
                          <td className="py-4 px-6">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setSelectedShipment(shipment)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                  <DialogTitle>Shipment Details</DialogTitle>
                                  <DialogDescription>
                                    Reference: {shipment.id}
                                  </DialogDescription>
                                </DialogHeader>
                                <ShipmentDetails shipment={shipment} />
                              </DialogContent>
                            </Dialog>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {shipments.map((shipment) => (
              <Card key={shipment.id} className="shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-mono">{shipment.id}</CardTitle>
                    <Badge className={getStatusColor(shipment.status)}>
                      {getStatusText(shipment.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{shipment.destination}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{shipment.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{shipment.weight} • {shipment.service}</span>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={() => setSelectedShipment(shipment)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Shipment Details</DialogTitle>
                        <DialogDescription>
                          Reference: {shipment.id}
                        </DialogDescription>
                      </DialogHeader>
                      <ShipmentDetails shipment={shipment} />
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

   
    </div>
  );
};

const ShipmentDetails = ({ shipment }) => (
  <div className="space-y-4">
    <Card>
      <CardContent className="pt-6 space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status</span>
          <Badge className={getStatusColor(shipment.status)}>
            {getStatusText(shipment.status)}
          </Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Destination</span>
          <span className="text-foreground font-medium">{shipment.destination}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Date</span>
          <span className="text-foreground">{shipment.date}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Weight</span>
          <span className="text-foreground">{shipment.weight}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Service</span>
          <span className="text-foreground">{shipment.service}</span>
        </div>
      </CardContent>
    </Card>

    <div>
      <h3 className="font-semibold mb-3 text-foreground">Tracking Timeline</h3>
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <div className="w-0.5 h-full bg-border" />
          </div>
          <div className="pb-4">
            <p className="font-medium text-foreground">Package Delivered</p>
            <p className="text-sm text-muted-foreground">Jan 18, 2025 - 14:30</p>
            <p className="text-sm text-muted-foreground">Lagos, Nigeria</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <div className="w-0.5 h-full bg-border" />
          </div>
          <div className="pb-4">
            <p className="font-medium text-foreground">Out for Delivery</p>
            <p className="text-sm text-muted-foreground">Jan 18, 2025 - 08:15</p>
            <p className="text-sm text-muted-foreground">Lagos, Nigeria</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <div className="w-0.5 h-full bg-border" />
          </div>
          <div className="pb-4">
            <p className="font-medium text-foreground">Arrived at Facility</p>
            <p className="text-sm text-muted-foreground">Jan 17, 2025 - 22:45</p>
            <p className="text-sm text-muted-foreground">Lagos, Nigeria</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-muted" />
          </div>
          <div>
            <p className="font-medium text-foreground">Package Picked Up</p>
            <p className="text-sm text-muted-foreground">Jan 15, 2025 - 10:00</p>
            <p className="text-sm text-muted-foreground">London, UK</p>
          </div>
        </div>
      </div>
    </div>

    <Button className="w-full">Track Shipment</Button>
  </div>
);

export default MyShipments;
