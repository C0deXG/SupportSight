# Setting Up Row Level Security (RLS) in Supabase

## Why You're Getting the 401 Error

The error message "new row violates row-level security policy" appears because Supabase has Row Level Security (RLS) enabled by default on your tables, but no policies have been created yet to allow insertions.

## Steps to Fix the Issue

1. Log into your Supabase dashboard
2. Go to the **Table Editor** in the left sidebar
3. Select the **clients** table
4. Click on the **Policies** tab

## Creating RLS Policies for the Clients Table

You need to create the following policies:

### 1. Allow users to insert their own clients

- Policy name: `Users can insert their own clients`
- Operation: `INSERT`
- Using expression: `auth.uid() = user_id`
- Check expression: Leave empty (or `true`)

### 2. Allow users to read only their own clients

- Policy name: `Users can view their own clients`
- Operation: `SELECT`
- Using expression: `auth.uid() = user_id`
- Check expression: Leave empty (or `true`)

### 3. Allow users to update only their own clients

- Policy name: `Users can update their own clients`
- Operation: `UPDATE`
- Using expression: `auth.uid() = user_id`
- Check expression: Leave empty (or `true`)

### 4. Allow users to delete only their own clients

- Policy name: `Users can delete their own clients`
- Operation: `DELETE`
- Using expression: `auth.uid() = user_id`
- Check expression: Leave empty (or `true`)

## Repeat for Projects and Issues Tables

You should also set up similar policies for your `projects` and `issues` tables. For these tables, you might need to implement policies that check the client's user_id through relationships.

## Testing Your Policies

After setting these policies, return to your application and try to create a client again. The 401 error should be resolved, and you should be able to insert data successfully.

## Troubleshooting

If you're still encountering issues after setting up these policies:

1. Verify that your user is properly authenticated (check the auth.getUser() response)
2. Ensure the user_id column in your clients table matches the auth.uid() value
3. Check the Supabase logs for additional error details 