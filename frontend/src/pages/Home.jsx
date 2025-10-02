
import Hero from "@/components/home/Hero";
import QuickTools from "@/components/home/QuickTools";
import HowItWorks from "@/components/home/HowItWorks";
import Features from "@/components/home/Features";
import Testimonials from "@/components/home/Testimonials";
import CTA from "@/components/home/CTA";


const Home = () => {
  return (
    <div className="min-h-screen">
     
      <Hero />
      <QuickTools />
      <HowItWorks />
      <Features />
      <Testimonials />
      <CTA />
 
    </div>
  );
};

export default Home;