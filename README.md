# [SupportSight](https://vite-project-nine-opal.vercel.app/login)

A comprehensive client and project management system designed specifically for freelancers and independent developers to track issues, manage client projects, and provide professional support.

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

## Security Features

- Row Level Security (RLS) enabled for all tables
- Data isolation between users
- Secure authentication via Supabase
- Environment variable protection
- Shared issue control

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/C0deXG/SupportSight.git
cd SupportSight
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your Supabase credentials

4. Run development server:
```bash
npm run dev
```

## Security Setup

1. RLS policies are automatically configured
2. Each user's data is isolated
3. Shared issues are controlled via policies
4. Regular security audits recommended

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 