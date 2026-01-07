# Welcome to your Convex functions directory!

Write your Convex functions here.
See https://docs.convex.dev/functions for more.

A query function that takes two arguments looks like:

```ts
// convex/myFunctions.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const myQueryFunction = query({
  // Validators for arguments.
  args: {
    first: v.number(),
    second: v.string(),
  },

  // Function implementation.
  handler: async (ctx, args) => {
    // Read the database as many times as you need here.
    // See https://docs.convex.dev/database/reading-data.
    const documents = await ctx.db.query("tablename").collect();

    // Arguments passed from the client are properties of the args object.
    console.log(args.first, args.second);

    // Write arbitrary JavaScript here: filter, aggregate, build derived data,
    // remove non-public properties, or create new objects.
    return documents;
  },
});
```

Using this query function in a React component looks like:

```ts
const data = useQuery(api.myFunctions.myQueryFunction, {
  first: 10,
  second: "hello",
});
```

A mutation function looks like:

```ts
// convex/myFunctions.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const myMutationFunction = mutation({
  // Validators for arguments.
  args: {
    first: v.string(),
    second: v.string(),
  },

  // Function implementation.
  handler: async (ctx, args) => {
    // Insert or modify documents in the database here.
    // Mutations can also read from the database like queries.
    // See https://docs.convex.dev/database/writing-data.
    const message = { body: args.first, author: args.second };
    const id = await ctx.db.insert("messages", message);

    // Optionally, return a value from your mutation.
    return await ctx.db.get("messages", id);
  },
});
```

Using this mutation function in a React component looks like:

```ts
const mutation = useMutation(api.myFunctions.myMutationFunction);
function handleButtonPress() {
  // fire and forget, the most common way to use mutations
  mutation({ first: "Hello!", second: "me" });
  // OR
  // use the result once the mutation has completed
  mutation({ first: "Hello!", second: "me" }).then((result) =>
    console.log(result),
  );
}
```

Use the Convex CLI to push your functions to a deployment. See everything
the Convex CLI can do by running `npx convex -h` in your project root
directory. To learn more, launch the docs with `npx convex docs`.

## Authentication Setup

This project uses Convex Auth with password authentication and Resend for email verification and password reset.

### Required Environment Variables

Set these environment variables in your Convex deployment:

```bash
# Site URL (already set, but verify it matches your app URL)
# For local development: http://localhost:3000
# For production: your production URL
npx convex env set SITE_URL http://localhost:3000

# Domain for auth.config.ts (should match SITE_URL)
npx convex env set CONVEX_SITE_URL http://localhost:3000
```

### Optional: Email Verification and Password Reset

Email verification and password reset via Resend are **disabled by default**. To enable them:

```bash
# Enable email verification and password reset
npx convex env set AUTH_ENABLE_EMAIL_VERIFICATION true

# Resend API key for sending verification and password reset emails
# (only required if AUTH_ENABLE_EMAIL_VERIFICATION is true)
npx convex env set AUTH_RESEND_KEY your_resend_api_key
```

When `AUTH_ENABLE_EMAIL_VERIFICATION` is not set or set to `false`, users can sign up and sign in without email verification, and password reset will not be available.

### Email Configuration

Update the sender email address in:
- `convex/ResendOTP.ts` - Change the `from` field in `sendVerificationRequest`
- `convex/ResendOTPPasswordReset.ts` - Change the `from` field in `sendVerificationRequest`

Make sure the sender email is verified in your Resend account.

### Routes

- `/sign-in` - Sign in page
- `/sign-up` - Sign up page  
- `/password-reset` - Password reset page
- `/app` - Protected page (requires authentication)
