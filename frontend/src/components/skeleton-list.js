import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Skeleton } from "./ui/skeleton";
export function SkeletonList() {
    return (_jsx("div", { className: "space-y-4", children: Array.from({ length: 5 }).map((_, idx) => (_jsxs("div", { className: "grid gap-3 rounded-lg border bg-muted/40 p-4", children: [_jsx(Skeleton, { className: "h-4 w-1/3" }), _jsx(Skeleton, { className: "h-3 w-2/5" }), _jsxs("div", { className: "flex gap-3", children: [_jsx(Skeleton, { className: "h-3 w-20" }), _jsx(Skeleton, { className: "h-3 w-24" }), _jsx(Skeleton, { className: "h-3 w-28" })] })] }, idx))) }));
}
