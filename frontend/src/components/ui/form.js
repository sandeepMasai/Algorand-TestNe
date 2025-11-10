import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Controller } from "react-hook-form";
import { cn } from "../../lib/utils";
const Form = ({ ...props }) => _jsx("form", { ...props });
const FormFieldContext = React.createContext(undefined);
const FormItemContext = React.createContext(undefined);
const useFormField = () => {
    const fieldContext = React.useContext(FormFieldContext);
    const itemContext = React.useContext(FormItemContext);
    if (!fieldContext) {
        throw new Error("useFormField should be used within <FormField>");
    }
    const id = itemContext?.id;
    return {
        id,
        name: fieldContext.name
    };
};
const FormField = ({ ...props }) => (_jsx(FormFieldContext.Provider, { value: { name: props.name }, children: _jsx(Controller, { ...props }) }));
const FormItem = React.forwardRef(({ className, ...props }, ref) => {
    const id = React.useId();
    return (_jsx(FormItemContext.Provider, { value: { id }, children: _jsx("div", { ref: ref, className: cn("space-y-1.5", className), ...props }) }));
});
FormItem.displayName = "FormItem";
const FormLabel = React.forwardRef(({ className, ...props }, ref) => {
    const { id } = useFormField();
    return (_jsx(LabelPrimitive.Root, { ref: ref, className: cn(className), htmlFor: id, ...props }));
});
FormLabel.displayName = "FormLabel";
const FormControl = React.forwardRef(({ ...props }, ref) => {
    const { id } = useFormField();
    return _jsx("div", { ref: ref, id: id, ...props });
});
FormControl.displayName = "FormControl";
const FormDescription = React.forwardRef(({ className, ...props }, ref) => (_jsx("p", { ref: ref, className: cn("text-xs text-muted-foreground", className), ...props })));
FormDescription.displayName = "FormDescription";
const FormMessage = React.forwardRef(({ className, children, ...props }, ref) => {
    const body = children ?? props.children;
    return body ? (_jsx("p", { ref: ref, className: cn("text-xs font-medium text-destructive", className), ...props, children: body })) : null;
});
FormMessage.displayName = "FormMessage";
export { Form, FormItem, FormField, FormLabel, FormControl, FormDescription, FormMessage };
