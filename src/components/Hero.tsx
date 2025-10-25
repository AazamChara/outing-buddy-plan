import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import heroImage from "@/assets/hero-friends.jpg";

export const Hero = () => {
  return (
    <section className="relative w-full h-[250px] md:h-[400px] overflow-hidden rounded-2xl mb-8 animate-fade-in">
      {/* Background Image */}
      <img
        src={heroImage}
        alt="Friends planning outings together"
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
      
      {/* Content */}
      <div className="relative h-full flex flex-col justify-center px-6 md:px-12 max-w-2xl">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 md:mb-4 animate-slide-up">
          Plan Perfect Outings
          <br />
          <span className="text-[hsl(var(--mint))]">Together</span>
        </h1>
        <p className="text-base md:text-xl text-white/90 mb-6 md:mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          Create groups, vote on activities, and make memories with friends.
        </p>
        <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <Button variant="hero" size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Create Your First Group
          </Button>
        </div>
      </div>
    </section>
  );
};
