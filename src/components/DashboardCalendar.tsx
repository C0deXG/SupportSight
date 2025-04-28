import { useState } from 'react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth,
  isSameDay, 
  addMonths, 
  subMonths,
  addDays
} from 'date-fns'
import { 
  ChevronLeft, 
  ChevronRight,
  CalendarDays
} from 'lucide-react'
import { Button } from './ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'
import type { Project } from '../lib/supabase'
import type { Issue } from '../services/issueService'

interface CalendarEvent {
  id: string;
  type: 'project' | 'issue';
  title: string;
  date: Date;
  status: string;
  client?: string;
  severity?: string;
}

interface DashboardCalendarProps {
  projects: Project[];
  issues: Issue[];
}

export default function DashboardCalendar({ projects, issues }: DashboardCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }
  
  const prevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }
  
  // Generate days for the current month view
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  // Create events from projects and issues
  const events: CalendarEvent[] = [
    ...projects
      .filter(project => project.end_date) // Only include projects with end dates
      .map(project => ({
        id: project.id,
        type: 'project' as const,
        title: project.name,
        date: new Date(project.end_date!),
        status: project.status,
        client: project.clients?.name
      })),
    ...issues
      .filter(issue => issue.due_date) // Only include issues with due dates
      .map(issue => ({
        id: issue.id,
        type: 'issue' as const,
        title: issue.title,
        date: new Date(issue.due_date!),
        status: issue.status,
        severity: issue.severity,
        client: issue.projects?.clients?.name
      }))
  ]
  
  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(event.date, day))
  }
  
  // Get status color for events
  const getStatusColor = (type: string, status: string) => {
    if (type === 'project') {
      switch (status) {
        case 'active':
          return 'bg-blue-100 text-blue-800'
        case 'completed':
          return 'bg-green-100 text-green-800'
        case 'on_hold':
          return 'bg-yellow-100 text-yellow-800'
        default:
          return 'bg-gray-100 text-gray-800'
      }
    } else {
      switch (status) {
        case 'open':
          return 'bg-red-100 text-red-800'
        case 'in_progress':
          return 'bg-blue-100 text-blue-800'
        case 'resolved':
          return 'bg-green-100 text-green-800'
        default:
          return 'bg-gray-100 text-gray-800'
      }
    }
  }
  
  return (
    <div className="space-y-4">
      {/* Header with month navigation */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-1">
          <CalendarDays className="h-4 w-4" />
          {format(currentDate, 'MMMM yyyy')}
        </h3>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden border border-gray-200">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div 
            key={day} 
            className="bg-gray-50 py-2 text-center text-xs font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
        
        {/* Calendar cells */}
        {days.map((day, dayIdx) => {
          const dayEvents = getEventsForDay(day)
          const isToday = isSameDay(day, new Date())
          const isCurrentMonth = isSameMonth(day, currentDate)
          
          return (
            <div
              key={day.toISOString()}
              className={`
                min-h-[80px] p-1 bg-white
                ${!isCurrentMonth ? 'text-gray-300' : ''}
                ${isToday ? 'bg-blue-50' : ''}
              `}
            >
              <div className="font-medium text-sm">
                {format(day, 'd')}
              </div>
              <div className="mt-1 space-y-1 max-h-[60px] overflow-y-auto">
                {dayEvents.length > 0 ? (
                  <TooltipProvider>
                    {dayEvents.slice(0, 2).map((event) => (
                      <Tooltip key={`${event.type}-${event.id}`}>
                        <TooltipTrigger asChild>
                          <div 
                            className={`
                              px-1 py-0.5 text-xs rounded truncate cursor-pointer
                              ${getStatusColor(event.type, event.status)}
                            `}
                          >
                            {event.title.length > 14 
                              ? `${event.title.substring(0, 12)}...` 
                              : event.title}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <div className="text-sm">
                            <p className="font-semibold">{event.title}</p>
                            <p className="text-xs">{event.type === 'project' ? 'Project' : 'Issue'}</p>
                            {event.client && (
                              <p className="text-xs">Client: {event.client}</p>
                            )}
                            <p className="text-xs">
                              Status: <span className="capitalize">{event.status.replace('_', ' ')}</span>
                            </p>
                            {event.severity && (
                              <p className="text-xs">Severity: {event.severity}</p>
                            )}
                            <p className="text-xs">Due: {format(event.date, 'MMM d, yyyy')}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {dayEvents.length > 2 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="px-1 py-0.5 text-xs bg-gray-100 text-gray-800 rounded cursor-pointer">
                            +{dayEvents.length - 2} more
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <div className="text-sm">
                            <p className="font-semibold">{dayEvents.length - 2} more events</p>
                            <ul className="text-xs space-y-1 mt-1">
                              {dayEvents.slice(2).map((event, idx) => (
                                <li key={idx} className="truncate">
                                  • {event.title} ({event.type})
                                </li>
                              ))}
                            </ul>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TooltipProvider>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
} 