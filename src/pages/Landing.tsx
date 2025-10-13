import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { 
  BarChart3, 
  Package, 
  QrCode, 
  FileText, 
  TrendingUp, 
  Shield,
  Smartphone,
  Zap
} from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Package,
      title: "Smart Inventory",
      description: "Track stock levels, get low-stock alerts, and manage items effortlessly"
    },
    {
      icon: QrCode,
      title: "UPI Payments",
      description: "Generate dynamic QR codes and accept payments instantly"
    },
    {
      icon: FileText,
      title: "Digital Invoices",
      description: "Auto-generate professional invoices and stock papers as PDFs"
    },
    {
      icon: BarChart3,
      title: "Sales Analytics",
      description: "Visualize trends with interactive charts and downloadable reports"
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Your data is protected with industry-standard security"
    },
    {
      icon: Smartphone,
      title: "Mobile First",
      description: "Works perfectly on any device - phone, tablet, or desktop"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            <Zap className="h-4 w-4" />
            Built for Indian Small Businesses
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Manage Your Shop
            <span className="block text-primary mt-2">With Confidence</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Complete inventory management, UPI payments, and analytics designed specifically for small shop owners. Simple, powerful, and affordable.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              onClick={() => navigate("/login")}
              className="text-lg px-8 shadow-lg hover:shadow-xl transition-all"
            >
              Get Started Free
              <TrendingUp className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/login")}
              className="text-lg px-8"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto mt-24 grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-all hover:-translate-y-1">
              <CardContent className="pt-6">
                <div className="p-3 bg-primary/10 text-primary rounded-lg w-fit mb-4">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto mt-24 text-center">
          <Card className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-xl">
            <CardContent className="pt-6 pb-8 px-8">
              <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h2>
              <p className="text-lg mb-6 opacity-90">
                Join thousands of shop owners who trust our platform for their daily operations
              </p>
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => navigate("/login")}
                className="text-lg px-8"
              >
                Start Your Free Trial
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Landing;
