# Forms Approach

This document outlines the correct approach for building forms in this application. The OTP form (`otp/otp.tsx`) serves as the reference implementation.

## Core Principles

1. **Use TanStack Form** - All forms use `@tanstack/react-form` as the foundation
2. **Type-safe validation** - Forms use Zod for schema validation
3. **Predefined field components** - Reusable field components with consistent behavior
4. **React Query integration** - All API calls use React Query mutations
5. **tRPC for API calls** - Use the tRPC client for type-safe server communication
6. **Single location for all forms - All forms live in the same folder

## Form Structure

### 1. Form Options File (`form-options.ts`)

Each form should have a separate `form-options.ts` file that defines:
- Default values
- Validation schema (using Zod)

```typescript
import { formOptions } from "@tanstack/react-form";
import z from "zod";

export const formOpts = formOptions({
  defaultValues: {
    code: '',
  },
  validators: {
    onChange: z.object({
      code: z.string().min(6, 'Code must be 6 characters long'),
    })
  }
})
```

### 2. Form Component Structure

Every form should follow this structure:

```typescript
import { useAppForm } from "@/hooks/form"
import { formOpts } from "./form-options"
import { useMutation } from "@tanstack/react-query"
import { useTRPC } from "@/integrations/trpc/react"

export function MyForm() {
  // 1. Get tRPC client
  const trpc = useTRPC();
  
  // 2. Setup React Query mutation with mutateAsync
  const { mutateAsync: myMutation } = useMutation({
    ...trpc.myEndpoint.mutationOptions(),
  });
  
  // 3. Setup form with useAppForm
  const form = useAppForm({
    ...formOpts,
    onSubmit: async ({value, formApi}) => {
      // Submit logic goes here
      const response = await myMutation(value);
      if (response.success) {
        // Handle success (e.g., navigate)
      }
    }
  })
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      e.stopPropagation()
      form.handleSubmit()
    }}>
      {/* Form fields go here */}
    </form>
  )
}
```

## Key Requirements

### API Calls

- **Always use** `const trpc = useTRPC();` to get the tRPC client
- **Always use** React Query's `useMutation` with the destructured `mutateAsync`
- Pattern: `const { mutateAsync: myMutation } = useMutation({...trpc.endpoint.mutationOptions()})`

### Form Submission

- The `onSubmit` handler **must be defined within** the `useAppForm` configuration
- The form element **must always have** the `onSubmit` handler that calls `form.handleSubmit()`
- Always `preventDefault()` and `stopPropagation()` in the form's onSubmit

```typescript
<form onSubmit={(e) => {
  e.preventDefault()
  e.stopPropagation()
  form.handleSubmit()
}}>
```

### Form Fields

Use `form.AppField` with predefined field components:

```typescript
<form.AppField
  name="code"
  children={(field) => <field.OtpField />}
/>
```

#### Available Predefined Fields

1. **TextField** - Standard text input with label and validation
   ```typescript
   <form.AppField
     name="email"
     children={(field) => <field.TextField label="Email" placeholder="you@example.com" />}
   />
   ```

2. **OtpField** - 6-digit OTP input
   ```typescript
   <form.AppField
     name="code"
     children={(field) => <field.OtpField />}
   />
   ```

3. **UrlField** - URL input with "https://" prefix
   ```typescript
   <form.AppField
     name="website"
     children={(field) => <field.UrlField label="Website" placeholder="example.com" />}
   />
   ```

### Submit Button

Always use `form.SubmitButton` within `form.AppForm`. The standard pattern (from `login/login.tsx`):

```typescript
<form.AppForm>
  <form.SubmitButton label="Login" />
</form.AppForm>
```

**With Loading Label:**

For better UX, provide a `loadingLabel` prop to show different text during submission:

```typescript
<form.AppForm>
  <form.SubmitButton 
    label="Save changes" 
    loadingLabel="Saving..." 
  />
</form.AppForm>
```

**The SubmitButton automatically:**
- Disables when form is invalid (`!canSubmit`)
- Disables during submission (`isSubmitting`)
- Shows loading label during submission (if provided)
- Handles form state subscription

**Important Notes:**
- **Do NOT** manually set `disabled={isPending}` or `disabled={isSubmitting}` - the form handles this automatically
- **Do NOT** use conditional labels like `label={isPending ? "Saving..." : "Save"}` - use `loadingLabel` instead
- **Only use** the `disabled` prop for business logic (e.g., `disabled={isLocked}` in OTP form), not for form state
- The form's submission state is automatically tracked and the button will be disabled during submission

## Creating New Field Components

To create a new predefined field component:

1. **Create the component in** `src/components/form-elements/`
2. **Use form context hooks:**
   ```typescript
   import { useFieldContext } from "@/hooks/form-content"
   import { useStore } from '@tanstack/react-form'
   
   export function MyField({ label }: { label: string }) {
     const field = useFieldContext<string>()
     const errors = useStore(field.store, (state) => state.meta.errors)
     
     return (
       <Field data-invalid={field.state.meta.errors.length > 0}>
         <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
         <input
           id={field.name}
           name={field.name}
           value={field.state.value}
           onBlur={field.handleBlur}
           onChange={(e) => field.handleChange(e.target.value)}
           aria-invalid={errors.length > 0}
         />
         <FieldError errors={errors} />
       </Field>
     )
   }
   ```

3. **Register in** `src/hooks/form.ts`:
   ```typescript
   export const { useAppForm } = createFormHook({
     fieldComponents: {
       TextField,
       OtpField,
       UrlField,
       MyField, // Add your new field
     },
     formComponents: {
       SubmitButton,
     },
     fieldContext,
     formContext,
   })
   ```

## Complete Example

See `otp/otp.tsx` for a complete, correct implementation that demonstrates:
- ✅ tRPC client usage with `useTRPC()`
- ✅ React Query mutation with `mutateAsync`
- ✅ Form setup with `useAppForm` and separate `form-options.ts`
- ✅ `onSubmit` handler within `useAppForm`
- ✅ Form element with proper `onSubmit` handler
- ✅ Usage of `form.AppField` with predefined field component
- ✅ Usage of `form.SubmitButton` within `form.AppForm`

## Don'ts

- ❌ Don't define `onSubmit` on the form element - it goes in `useAppForm`
- ❌ Don't use raw `useMutation` without tRPC mutation options
- ❌ Don't create custom field components without using `useFieldContext`
- ❌ Don't skip `preventDefault()` and `stopPropagation()` in form's onSubmit
- ❌ Don't mix form validation logic with component logic - keep it in `form-options.ts`

