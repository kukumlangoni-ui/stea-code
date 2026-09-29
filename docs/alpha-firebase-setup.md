# Alpha School Portal Firebase Setup

Alpha School Portal requires its own Firebase project so a teacher email can have an Alpha password independently from any STEA account using the same email.

## Firebase Console

1. Create a Firebase project dedicated to Alpha School Portal.
2. Add a Web app and copy its Firebase configuration.
3. Enable Authentication > Email/Password.
4. Create Firestore and Storage in the same project.
5. Add the production Alpha domain to Authentication > Authorized domains.

## Application Environment

Copy the values from `.env.alpha.example` into the production environment:

- `VITE_ALPHA_FIREBASE_API_KEY`
- `VITE_ALPHA_FIREBASE_AUTH_DOMAIN`
- `VITE_ALPHA_FIREBASE_PROJECT_ID`
- `VITE_ALPHA_FIREBASE_STORAGE_BUCKET`
- `VITE_ALPHA_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_ALPHA_FIREBASE_APP_ID`
- `ALPHA_FIREBASE_PROJECT_ID`

The `VITE_` values configure the browser client. `ALPHA_FIREBASE_PROJECT_ID` configures `/api/alpha/resolve-login`.

## Data Migration

Move these Alpha records from the STEA Firestore project into the dedicated Alpha project before switching production traffic:

- `schools/alpha`
- `schools/alpha/emailAccess/*`
- `schools/alpha/users/*`
- all other `schools/alpha/*` module collections

Do not migrate existing STEA Authentication users. School admins, teachers, and students create fresh credentials in Alpha Authentication.

## Server Access

The service account running the existing API must have Firestore access to the dedicated Alpha project. Alternatively, deploy the Alpha resolver API inside the Alpha Firebase project.

## Required Verification

1. Admin adds a new teacher email; only an `emailAccess` approval is created.
2. Teacher chooses Create Password and creates a new Alpha Authentication user.
3. The approved teacher profile attaches to the new Alpha UID.
4. Teacher signs out and signs in again with the same Alpha email and password.
5. A matching STEA account does not affect Alpha password creation.
