import { jsx as _jsx } from "react/jsx-runtime";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
export function ModeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const isDark = (theme ?? resolvedTheme) === "dark";
    if (!mounted) {
        return (_jsx(Button, { variant: "outline", size: "icon", className: "h-9 w-9", disabled: true, children: _jsx(Sun, { className: "h-4 w-4" }) }));
    }
    return (_jsx(Button, { variant: "outline", size: "icon", className: "h-9 w-9", onClick: () => setTheme(isDark ? "light" : "dark"), "aria-label": "Toggle theme", children: isDark ? _jsx(Sun, { className: "h-4 w-4" }) : _jsx(Moon, { className: "h-4 w-4" }) }));
}
