# SupportSight

A comprehensive client and project management system designed specifically for freelancers and independent developers to track issues, manage client projects, and provide professional support. Built with React, Vite, and Supabase.

## Why SupportSight?

As a freelancer or independent developer, managing multiple clients and their projects can be challenging. SupportSight helps you:

- Keep all client communications and issues in one place
- Track and prioritize bugs and feature requests professionally
- Provide enterprise-level error tracking and analysis
- Maintain a clear history of all client projects and issues
- Look more professional with an organized support system

## How It Works

1. **Client Onboarding**
   - Add new clients with their details
   - Create dedicated project spaces for each client
   - Share a unique client portal link for issue reporting

2. **Project Management**
   - Track multiple projects per client
   - Set milestones and deadlines
   - Monitor project status and progress
   - Keep all project-related communications organized

3. **Smart Issue Tracking**
   - Clients can submit issues through their portal
   - Automatic error parsing and categorization
   - AI-powered analysis suggests solutions
   - Track issue status from submission to resolution

4. **Professional Reporting**
   - Generate detailed reports for clients
   - Track time spent on issues
   - Show error patterns and resolutions
   - Provide transparency in your work

## Features

- **Smart Error Handling**
  - Automatic error message parsing and categorization
  - Pattern matching to extract stack traces, error codes, and timestamps
  - Intelligent grouping of similar errors
  - AI-powered error analysis using OpenAI for:
    - Root cause identification
    - Potential solutions and best practices
    - Similar issue detection
    - Severity assessment

- **Client-Focused Dashboard**
  - Overview of active clients and projects
  - Recent activity feed
  - Priority issues at a glance
  - Quick statistics for better decision making

- **Professional Client Management**
  - Detailed client profiles
  - Project history and documentation
  - Communication tracking
  - Issue submission and tracking portal

- **Comprehensive Project Tracking**
  - Milestone and deadline management
  - Resource allocation
  - Issue pattern analysis
  - Project health monitoring

## Tech Stack

- Next.js 13+ (App Router)
- Supabase (Database & Authentication)
- Tailwind CSS
- shadcn/ui Components
- OpenAI API (GPT-3.5 for error analysis)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   cd SupportSight
   npm install
   ```
3. Set up environment variables:
   Create a `.env` file in the frontend directory with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   (optional)->OPENAI_API_KEY=your_openai_api_key `Working on it now`
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Setting Up For Your Clients

1. **Create Your Account**
   - Sign up and set up your profile
   - Configure your workspace settings

2. **Add Clients**
   - Create client profiles
   - Set up project spaces
   - Generate client portal links

3. **Customize Settings**
   - Set up notification preferences
   - Configure issue templates
   - Customize client portal appearance

4. **Start Managing**
   - Begin tracking issues
   - Monitor projects
   - Generate reports

## Database Schema

### Clients
- id (Primary Key)
- name
- email
- phone
- company
- notes
- created_at
- updated_at

### Projects
- id (Primary Key)
- client_id (Foreign Key)
- name
- description
- status (active, completed, on_hold)
- start_date
- end_date
- created_at
- updated_at

### Issues
- id (Primary Key)
- project_id (Foreign Key)
- title
- description
- type (bug, feature, task)
- severity (low, medium, high, critical)
- status (open, in_progress, resolved, closed)
- assigned_to
- due_date
- error_trace (Text, for storing parsed error messages)
- error_pattern (String, identified error pattern)
- ai_analysis (JSON, storing OpenAI analysis results)
- created_at
- updated_at

## Contributing

We welcome contributions! Please read our contributing guidelines before submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 