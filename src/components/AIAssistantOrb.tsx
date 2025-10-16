import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const AIAssistantOrb = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-float">
      <Button
        size="lg"
        className="h-16 w-16 rounded-full bg-gradient-to-br from-primary via-accent to-secondary shadow-glow hover:shadow-neon transition-all duration-300 border-2 border-primary/20 hover:scale-110"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Sparkles 
          className={`h-7 w-7 text-white transition-transform duration-300 ${
            isHovered ? 'rotate-180 scale-110' : ''
          }`}
        />
      </Button>
      {isHovered && (
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-card/95 backdrop-blur-sm border border-primary/20 rounded-lg shadow-glow text-xs font-medium whitespace-nowrap animate-slide-up">
          AI Assistant
        </div>
      )}
    </div>
  );
};
