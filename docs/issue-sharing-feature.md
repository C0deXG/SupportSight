# Issue Sharing Feature

This feature allows you to share individual issues with clients by generating a unique URL. The client doesn't need to log in to view the shared issue.

## Database Setup

To enable this feature, you need to run the SQL migrations in the Supabase dashboard:

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the contents of `init-supabase-sharing.sql` into the editor
5. Run the query

The migration will:
- Add a `client_note` column to store notes visible to clients
- Add an `is_shared` column to track if an issue is shared
- Create an index for faster queries on shared issues
- Add a Row Level Security (RLS) policy to allow anonymous access to shared issues

## How to Use

1. Navigate to the Issues page in your application
2. Click on an issue to open its details
3. Go to the "Share" tab
4. Toggle "Enable sharing for this issue"
5. Add any notes you want the client to see
6. Click "Save & Generate Link"
7. Copy the generated link and share it with your client

The client will be able to view the issue details without logging in, but won't be able to make any changes.

## Security Considerations

- Only issues explicitly marked as shared are publicly accessible
- The sharing URLs use the issue's UUID, making them difficult to guess
- You can disable sharing at any time by toggling off the "Enable sharing" switch and saving
- No sensitive information is exposed on the shared view 