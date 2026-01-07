# Forms Approach

This document outlines the correct approach for building forms in this application. The auth forms (`sign-in/`, `sign-up/`, `password-reset/`) serve as reference implementations.

## Core Principles

1. **Use TanStack Form** - All forms use `@tanstack/react-form` as the foundation
2. **Type-safe validation** - Forms use Zod for schema validation
3. **Predefined field components** - Reusable field components with consistent behavior
4. **Convex for backend** - Use Convex React hooks (`useQuery`, `useMutation`, `useAction`) for data operations
5. **Convex Auth for authentication** - Use `@convex-dev/auth/react` for auth-related forms
6. **Single location for all forms** - All forms live in the same folder

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
    email: '',
    password: '',
  },
  validators: {
    onChange: z.object({
      email: z.string().email('Please enter a valid email address'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
    })
  }
})
```

### 2. Form Component Structure

Forms fall into two categories: **Auth Forms** (using Convex Auth) and **Regular Forms** (using Convex React hooks).

#### Auth Forms (Convex Auth)

For authentication-related forms (sign in, sign up, password reset):

```typescript
import { useAppForm } from "@/hooks/form"
import { formOpts } from "./form-options"
import { useAuthActions } from "@convex-dev/auth/react"
import { useNavigate } from "@tanstack/react-router"

export function MyAuthForm() {
  // 1. Get Convex Auth actions
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  
  // 2. Setup form with useAppForm
  const form = useAppForm({
    ...formOpts,
    onSubmit: async ({ value }) => {
      // Build FormData from form values
      const formData = new FormData();
      formData.append("flow", "signIn"); // or "signUp", "email-verification", etc.
      formData.append("email", value.email);
      formData.append("password", value.password);
      
      // Call Convex Auth
      const result = await signIn("password", formData);
      
      if (result.signingIn) {
        // Handle success (e.g., navigate)
        navigate({ to: "/app" });
      } else {
        // Handle multi-step flow (e.g., email verification required)
        // Parent component should handle step state
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

#### Regular Forms (Convex React Hooks)

For non-auth forms that interact with Convex functions:

```typescript
import { useAppForm } from "@/hooks/form"
import { formOpts } from "./form-options"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"

export function MyForm() {
  // 1. Get Convex mutation
  const createItem = useMutation(api.items.create);
  
  // 2. Setup form with useAppForm
  const form = useAppForm({
    ...formOpts,
    onSubmit: async ({ value }) => {
      // Call Convex mutation directly
      const result = await createItem({
        name: value.name,
        description: value.description,
      });
      
      // Handle success
      if (result) {
        // Navigate or show success message
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

**For queries** (read-only data):

```typescript
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

export function MyComponent() {
  // Queries are typically used outside forms for data fetching
  const items = useQuery(api.items.list, { limit: 10 });
  
  // Use in your component
  return <div>{items?.map(item => ...)}</div>
}
```

## Key Requirements

### API Calls

#### Convex Auth Forms
- **Always use** `const { signIn } = useAuthActions()` from `@convex-dev/auth/react`
- **Always build FormData** from form values in `onSubmit`
- **Always append `flow`** to FormData (e.g., `"signIn"`, `"signUp"`, `"email-verification"`, `"reset"`, `"reset-verification"`)
- Pattern: `await signIn("password", formData)`

#### Regular Convex Forms
- **Always use** `useQuery`, `useMutation`, or `useAction` from `convex/react`
- **Always import** function references from `convex/_generated/api`
- Pattern: `const mutation = useMutation(api.module.functionName)`
- Pattern: `const query = useQuery(api.module.functionName, args)`

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
     children={(field) => <field.TextField label="Email" placeholder="you@example.com" type="email" />}
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

4. **TextareaField** - Multi-line text input
   ```typescript
   <form.AppField
     name="description"
     children={(field) => <field.TextareaField label="Description" placeholder="Enter description" />}
   />
   ```

5. **SelectField** - Dropdown select input
   ```typescript
   <form.AppField
     name="category"
     children={(field) => <field.SelectField label="Category" options={[...]} />}
   />
   ```

6. **CheckboxField** - Checkbox input
   ```typescript
   <form.AppField
     name="agree"
     children={(field) => <field.CheckboxField label="I agree to the terms" />}
   />
   ```

### Submit Button

Always use `form.SubmitButton` within `form.AppForm`. The standard pattern:

```typescript
<form.AppForm>
  <form.SubmitButton label="Submit" />
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

## Multi-Step Auth Flows

For authentication flows that require multiple steps (e.g., credentials → email verification), use a **wrapper component** pattern:

### Structure

1. **Wrapper Component** (e.g., `sign-in-form.tsx`)
   - Manages step state (`"signIn" | { email: string }`)
   - Renders shared layout (Card, FieldGroup, etc.)
   - Conditionally renders step-specific form components

2. **Step Form Components** (e.g., `credentials-form.tsx`, `verify-code-form.tsx`)
   - Each step is its own TanStack Form component
   - Has its own `form-options.ts` file
   - Handles its own validation and submission
   - Communicates with parent via callbacks

### Example: Sign In Flow

**Wrapper (`sign-in-form.tsx`):**

```typescript
import { useState } from "react"
import { SignInCredentialsForm } from "./credentials-form"
import { SignInVerifyCodeForm } from "./verify-code-form"

export function SignInForm({ redirectTo }: { redirectTo?: string }) {
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn")
  
  return (
    <Card>
      {step === "signIn" ? (
        <SignInCredentialsForm
          onVerificationRequired={(email) => setStep({ email })}
          redirectTo={redirectTo}
        />
      ) : (
        <SignInVerifyCodeForm
          email={step.email}
          onCancel={() => setStep("signIn")}
          redirectTo={redirectTo}
        />
      )}
    </Card>
  )
}
```

**Step Form (`credentials-form.tsx`):**

```typescript
import { useAppForm } from "@/hooks/form"
import { credentialsFormOpts } from "./credentials-form-options"
import { useAuthActions } from "@convex-dev/auth/react"

export function SignInCredentialsForm({
  onVerificationRequired,
  redirectTo,
}: {
  onVerificationRequired: (email: string) => void
  redirectTo?: string
}) {
  const { signIn } = useAuthActions()
  const navigate = useNavigate()
  
  const form = useAppForm({
    ...credentialsFormOpts,
    onSubmit: async ({ value }) => {
      const formData = new FormData()
      formData.append("flow", "signIn")
      formData.append("email", value.email)
      formData.append("password", value.password)
      
      const result = await signIn("password", formData)
      
      if (result.signingIn) {
        navigate({ to: redirectTo || "/app" })
      } else {
        onVerificationRequired(value.email)
      }
    }
  })
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      e.stopPropagation()
      form.handleSubmit()
    }}>
      <form.AppField
        name="email"
        children={(field) => <field.TextField label="Email" type="email" />}
      />
      <form.AppField
        name="password"
        children={(field) => <field.TextField label="Password" type="password" />}
      />
      <form.AppForm>
        <form.SubmitButton label="Sign in" />
      </form.AppForm>
    </form>
  )
}
```

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

## Complete Examples

### Auth Form Example

See `sign-in/` for a complete, correct implementation that demonstrates:
- ✅ Convex Auth usage with `useAuthActions()`
- ✅ FormData construction from TanStack Form values
- ✅ Multi-step flow with wrapper component pattern
- ✅ Form setup with `useAppForm` and separate `form-options.ts`
- ✅ `onSubmit` handler within `useAppForm`
- ✅ Form element with proper `onSubmit` handler
- ✅ Usage of `form.AppField` with predefined field components
- ✅ Usage of `form.SubmitButton` within `form.AppForm`

### Regular Form Example

For non-auth forms, see the pattern above in "Regular Forms (Convex React Hooks)" section.

## Don'ts

- ❌ Don't define `onSubmit` on the form element - it goes in `useAppForm`
- ❌ Don't use tRPC patterns - this project uses Convex
- ❌ Don't create custom field components without using `useFieldContext`
- ❌ Don't skip `preventDefault()` and `stopPropagation()` in form's onSubmit
- ❌ Don't mix form validation logic with component logic - keep it in `form-options.ts`
- ❌ Don't forget to append `flow` to FormData in Convex Auth forms
- ❌ Don't use React Query's `useMutation` for Convex - use `useMutation` from `convex/react` directly
