import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="w-9 h-9"
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export function ThemeToggleWithLabel() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="text-sm font-medium">Theme</div>
          <div className="text-xs text-muted-foreground">
            Choose your preferred theme
          </div>
        </div>
        <Button variant="outline" size="sm" disabled>
          <Sun className="h-4 w-4 mr-2" />
          Loading...
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <div className="text-sm font-medium">Theme</div>
        <div className="text-xs text-muted-foreground">
          Choose your preferred theme
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        className="min-w-24"
      >
        {theme === "light" ? (
          <>
            <Moon className="h-4 w-4 mr-2" />
            Dark
          </>
        ) : (
          <>
            <Sun className="h-4 w-4 mr-2" />
            Light
          </>
        )}
      </Button>
    </div>
  );
}