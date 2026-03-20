// Alternative approach: Use native WebSocket implementation to avoid sockjs issues
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  addMonths,
  subMonths,
  isToday,
  isValid
} from "date-fns";
import { parseISO } from "date-fns/parseISO";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Edit2,
  Trash2,
  MapPin,
  Clock,
  Save,
  Calendar,
  Check,
  AlertCircle,
  Search,
  Loader,
  Wifi,
  WifiOff,
  Building2,
  Users
} from "lucide-react";

// ==================== Types & Interfaces ====================

interface CalendarEvent {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  eventType: string;
  customEventType?: string;
  color: string;
  allDay: boolean;
  hasTime: boolean;
  hasEndTime: boolean;
  isEndDateOptional: boolean;
  location?: string;
  createdBy?: number;
  companyId: number;
  createdAt: string;
  updatedAt?: string;
  status?: 'COMPLETED' | 'IN_PROGRESS' | 'CANCELLED' | 'PENDING';
  completionPercentage?: number;
  visibility?: string;
  selectedDepartments?: number[];
  selectedSubDepartments?: number[];
  includeAllSubDepartments?: boolean;
  employeeIds?: number[];
  departmentId?: number;
  designationIds?: number[];
}

interface EventFormData {
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  eventType: string;
  customEventType?: string;
  color: string;
  allDay: boolean;
  hasTime: boolean;
  hasEndTime: boolean;
  isEndDateOptional: boolean;
  location: string;
  visibility?: string;
  selectedDepartments?: number[];
  selectedSubDepartments?: number[];
  includeAllSubDepartments?: boolean;
  employeeIds?: number[];
  departmentId?: number | null;
  designationIds?: number[];
  sendEmailNotifications?: boolean;
}

interface Department {
  id: number;
  dptName: string; // Fixed from dpt_name to match backend
  dptCode?: string; // Fixed from dpt_code to match backend
  dptDesc?: string; // Fixed from dpt_desc to match backend
  cmpId: number;
  designationList?: Designation[];
}

interface Designation {
  id: number;
  designation: string;
  dptId: number;
}

interface Employee {
  id: number;
  emp_no?: string;
  epf_no?: string;
  first_name: string;
  last_name: string;
  email: string;
  dptId?: number;
  designationId?: number;
  department?: Department | string;
  designation?: Designation | string;
  position?: string;
  profilePicture?: string;
}

interface EventTypeRule {
  requiresEndTime: boolean;
  defaultDuration: number;
  color: string;
  isMultiDay: boolean;
  canHaveTime: boolean;
}

interface WebSocketMessage {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_UPDATE';
  event?: CalendarEvent;
  eventId?: number;
  status?: string;
}

interface RawDepartment {
  id: number;
  dpt_name?: string;
  dptName?: string;
  unit_name?: string;
  dpt_code?: string;
  dptCode?: string;
  unit_code?: string;
  dpt_desc?: string;
  dptDesc?: string;
  unit_desc?: string;
  cmpId?: number | string;
  designationList?: Designation[];
}

// ==================== Constants ====================

const EVENT_TYPES = [
  { value: "MEETING", label: "Meeting", color: "#3B82F6" },
  { value: "HOLIDAY", label: "Holiday", color: "#10B981" },
  { value: "DEADLINE", label: "Deadline", color: "#EF4444" },
  { value: "REMINDER", label: "Reminder", color: "#F59E0B" },
  { value: "FUNCTION", label: "Function", color: "#8B5CF6" },
  { value: "TRAINING", label: "Training", color: "#06B6D4" },
  { value: "LEAVE", label: "Leave", color: "#FF6B6B" },
  { value: "OTHER", label: "Other", color: "#6B7280" }
] as const;

const VISIBILITY_OPTIONS = [
  { value: "ALL_EMPLOYEES", label: "All Employees", description: "Visible to all employees in the company" },
  { value: "SELECTED_EMPLOYEES", label: "Selected Employees", description: "Visible only to selected employees" },
  { value: "COMPANY_ONLY", label: "Company Only", description: "Visible only to event creator and admins" },
  { value: "DEPARTMENT", label: "Department", description: "Visible to all employees in selected department" },
  { value: "DESIGNATION", label: "Designation", description: "Visible to employees with selected designations" }
] as const;

const EVENT_TYPE_RULES: Record<string, EventTypeRule> = {
  HOLIDAY: {
    requiresEndTime: false,
    defaultDuration: 1,
    color: "#10B981",
    isMultiDay: true,
    canHaveTime: false
  },
  MEETING: {
    requiresEndTime: true,
    defaultDuration: 60,
    color: "#3B82F6",
    isMultiDay: false,
    canHaveTime: true
  },
  DEADLINE: {
    requiresEndTime: false,
    defaultDuration: 0,
    color: "#EF4444",
    isMultiDay: false,
    canHaveTime: true
  },
  REMINDER: {
    requiresEndTime: false,
    defaultDuration: 0,
    color: "#F59E0B",
    isMultiDay: false,
    canHaveTime: true
  },
  FUNCTION: {
    requiresEndTime: true,
    defaultDuration: 180,
    color: "#8B5CF6",
    isMultiDay: false,
    canHaveTime: true
  },
  TRAINING: {
    requiresEndTime: true,
    defaultDuration: 240,
    color: "#06B6D4",
    isMultiDay: false,
    canHaveTime: true
  },
  LEAVE: {
    requiresEndTime: false,
    defaultDuration: 1,
    color: "#FF6B6B",
    isMultiDay: true,
    canHaveTime: false
  },
  OTHER: {
    requiresEndTime: true,
    defaultDuration: 60,
    color: "#6B7280",
    isMultiDay: false,
    canHaveTime: true
  }
};

const STATUS_CONFIG = {
  PENDING: { color: '#6B7280', icon: Clock, label: 'Pending' },
  IN_PROGRESS: { color: '#F59E0B', icon: AlertCircle, label: 'In Progress' },
  COMPLETED: { color: '#10B981', icon: Check, label: 'Completed' },
  CANCELLED: { color: '#EF4444', icon: X, label: 'Cancelled' }
} as const;

// ==================== Utility Functions ====================

const formatEventDate = (dateStr: string, includeTime: boolean = true): string => {
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return dateStr;
    return includeTime ? format(date, "MMM dd, yyyy HH:mm") : format(date, "MMM dd, yyyy");
  } catch {
    return dateStr;
  }
};

const getEventStatus = (event: CalendarEvent): string => {

  if (event.status) {
    return event.status;
  }

  // If no status is set, calculate based on dates (fallback logic)
  const now = new Date();
  const startDate = new Date(event.startDate);
  const endDate = event.endDate ? new Date(event.endDate) : startDate;

  if (now < startDate) return 'PENDING';
  if (now >= startDate && now <= endDate) return 'IN_PROGRESS';
  if (now > endDate) return 'COMPLETED';

  return 'PENDING';
};

// ==================== Main Component ====================

const DashboardCalendar: React.FC = () => {
  // ==================== State ====================
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayEvents, setShowDayEvents] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState<number | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Employee[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [showNewEmployeeOption, setShowNewEmployeeOption] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [designationsLoading, setDesignationsLoading] = useState(false);

  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    eventType: "MEETING",
    customEventType: "",
    color: "#3B82F6",
    allDay: false,
    hasTime: false, // Default to false - time only shown when user requests
    hasEndTime: false,
    isEndDateOptional: true, // Default to true - end date is optional
    location: "",
    visibility: "COMPANY_ONLY", // Default to COMPANY_ONLY
    selectedDepartments: [],
    selectedSubDepartments: [],
    includeAllSubDepartments: false,
    employeeIds: [],
    departmentId: undefined,
    designationIds: [],
    sendEmailNotifications: true
  });

  // ==================== Refs ====================
  const clientRef = useRef<Client | null>(null);

  // ==================== Local Storage Data ====================
  const companyId = localStorage.getItem("cmpnyId");
  const token = localStorage.getItem("token");
  // userId is used in event creation
  const userId = localStorage.getItem("userId");

  // ==================== Memoized Values ====================
  const filteredEvents = useMemo(() => {
    return events.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.eventType.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [events, searchTerm]);

  // ==================== Helper Functions ====================
  const isPastDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const getStatusColor = (status: string): string => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.color || '#3B82F6';
  };

  const getStatusIcon = (status: string) => {
    const Icon = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.icon;
    return Icon ? Icon && <Icon size={12} className="mr-1" /> : null;
  };

  // ==================== API Calls ====================
  const fetchEmployees = useCallback(async (): Promise<void> => {
    if (!companyId || !token) return;

    try {
      setEmployeesLoading(true);
      const response = await fetch(
          `/api/employee/EmpDetailsList/${companyId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.EmployeeList && Array.isArray(data.EmployeeList)) {
          setEmployees(data.EmployeeList);
        }
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      setEmployeesLoading(false);
    }
  }, [companyId, token]);

  const searchEmployees = useCallback(async (searchTerm: string): Promise<void> => {
    if (!searchTerm.trim() || !companyId || !token) {
      setSearchResults([]);
      setShowSearchResults(false);
      setShowNewEmployeeOption(false);
      return;
    }

    try {
      const response = await fetch(
          `/api/employees/search?companyId=${companyId}&query=${encodeURIComponent(searchTerm)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.EmployeeList && Array.isArray(data.EmployeeList)) {
          const foundEmployees = data.EmployeeList;
          setSearchResults(foundEmployees);
          setShowSearchResults(true);
          
          // Show new employee option if no exact match found
          const exactMatch = foundEmployees.some((emp: Employee) => 
            emp.first_name.toLowerCase() === searchTerm.toLowerCase() ||
            emp.last_name.toLowerCase() === searchTerm.toLowerCase() ||
            `${emp.first_name} ${emp.last_name}`.toLowerCase() === searchTerm.toLowerCase() ||
            emp.emp_no === searchTerm ||
            emp.epf_no === searchTerm
          );
          
          setShowNewEmployeeOption(!exactMatch && searchTerm.trim().length > 0);
          setNewEmployeeName(searchTerm);
        }
      }
    } catch (err) {
      console.error('Failed to search employees:', err);
      setSearchResults([]);
      setShowNewEmployeeOption(false);
    }
  }, [companyId, token]);

  const addNewEmployee = useCallback((employeeName: string): void => {
    // Create a temporary employee object for new entries
    const newEmployee: Employee = {
      id: Date.now(), // Temporary ID
      first_name: employeeName.split(' ')[0] || employeeName,
      last_name: employeeName.split(' ').slice(1).join(' ') || '',
      email: '',
      emp_no: `NEW-${Date.now()}`,
      epf_no: '',
      department: 'New Employee',
      position: '',
      profilePicture: undefined
    };

    const employeeIds = formData.employeeIds || [];
    if (!employeeIds.includes(newEmployee.id)) {
      setFormData({ ...formData, employeeIds: [...employeeIds, newEmployee.id] });
      setEmployees([...employees, newEmployee]);
    }
    
    setEmployeeSearchTerm('');
    setSearchResults([]);
    setShowSearchResults(false);
    setShowNewEmployeeOption(false);
    setNewEmployeeName('');
  }, [formData.employeeIds, employees]);

  const selectEmployee = useCallback((employee: Employee): void => {
    const employeeIds = formData.employeeIds || [];
    if (!employeeIds.includes(employee.id)) {
      setFormData({ ...formData, employeeIds: [...employeeIds, employee.id] });
    }
    setEmployeeSearchTerm('');
    setSearchResults([]);
    setShowSearchResults(false);
    setShowNewEmployeeOption(false);
  }, [formData.employeeIds]);

  const removeEmployee = useCallback((employeeId: number): void => {
    const employeeIds = formData.employeeIds || [];
    setFormData({
      ...formData,
      employeeIds: employeeIds.filter(id => id !== employeeId)
    });
  }, [formData.employeeIds]);

  const fetchDepartments = useCallback(async (): Promise<void> => {
    if (!companyId || !token) return;

    try {
      setDepartmentsLoading(true);
      console.log(`Fetching departments for company ID: ${companyId}`);
      
      const response = await fetch(
          `/api/department/company/${companyId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
      );

      console.log(`Departments response status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log('Departments response data:', data);
        
        // Look for any of the possible response keys
        const rawDepartments = data.DepartmentList || data.UnitList || data.departments;
        
        if (rawDepartments && Array.isArray(rawDepartments)) {
          // Normalize department objects to match our interface
          const mappedDepartments = rawDepartments.map((d: RawDepartment) => ({
            id: d.id,
            dptName: d.dpt_name || d.dptName || d.unit_name || 'Unknown',
            dptCode: d.dpt_code || d.dptCode || d.unit_code || '',
            dptDesc: d.dpt_desc || d.dptDesc || d.unit_desc || '',
            cmpId: Number(d.cmpId || companyId || 0),
            designationList: d.designationList || []
          }));
          console.log(`Found ${mappedDepartments.length} departments:`, mappedDepartments);
          const allDepartmentsOption: Department = { id: 0, dptName: 'All Departments', dptCode: 'ALL', dptDesc: 'All Departments', cmpId: Number(companyId || 0), designationList: [] };
          setDepartments([allDepartmentsOption, ...mappedDepartments]);
        } else {
          console.error('Departments API error:', data.resultDesc);
          setError(`Failed to fetch departments: ${data.resultDesc}`);
        }
      } else {
        const errorText = await response.text();
        console.error('Departments HTTP error:', response.status, errorText);
        setError(`Failed to fetch departments: HTTP ${response.status}`);
      }
    } catch (err) {
      console.error('Failed to fetch departments:', err);
      setError('Failed to fetch departments. Please try again.');
    } finally {
      setDepartmentsLoading(false);
    }
  }, [companyId, token]);

  const fetchDesignations = useCallback(async (departmentId?: number): Promise<void> => {
    if (!departments.length) return;

    setDesignationsLoading(true);
    try {
      if (departmentId) {
        const dept = departments.find(d => d.id === departmentId);
        setDesignations(dept?.designationList || []);
      } else {
        // Flatten all designations from all departments
        const allDesignations = departments.flatMap(d => d.designationList || []);
        setDesignations(allDesignations);
      }
    } finally {
      setDesignationsLoading(false);
    }
  }, [departments]);

  const updateEventStatusInBackend = async (eventId: number, newStatus: string): Promise<void> => {
    try {
      console.log(`Updating event ${eventId} status to ${newStatus}`);
      
      const response = await fetch(`/api/calendar/events/${eventId}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Status update failed:', errorData);
        throw new Error(errorData.resultDesc || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Status update successful:', result);
    } catch (error) {
      console.error('Failed to update event status:', error);
      throw error;
    }
  };

  const testBackendConnectivity = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/actuator/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  // ==================== Event Handlers ====================
  const handleStatusChange = async (eventId: number, newStatus: string): Promise<void> => {
    const isConfirmed = window.confirm(`Are you sure you want to update the event status to ${newStatus}?`);

    if (!isConfirmed) return;

    setStatusUpdateLoading(eventId);

    try {

      setEvents(prev =>
          prev.map(event =>
              event.id === eventId ? { ...event, status: newStatus as CalendarEvent['status'] } : event
          )
      );

      // Update selectedEvent if it's the current event
      if (selectedEvent?.id === eventId) {
        setSelectedEvent(prev => prev ? { ...prev, status: newStatus as CalendarEvent['status'] } : null);
      }

      await updateEventStatusInBackend(eventId, newStatus);

      setSuccessMessage(`Event status updated to ${newStatus}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setError('Failed to update status');
      setTimeout(() => setError(null), 3000);

      // Revert to original status from database if available, otherwise keep current
      setEvents(prev =>
          prev.map(event =>
              event.id === eventId ? { ...event, status: event.status || 'PENDING' } : event
          )
      );

      // Revert selectedEvent status
      if (selectedEvent?.id === eventId) {
        setSelectedEvent(prev => prev ? { ...prev, status: prev.status || 'PENDING' } : null);
      }
    } finally {
      setStatusUpdateLoading(null);
    }
  };

  const handleEventTypeChange = (eventType: string): void => {
    const rules = EVENT_TYPE_RULES[eventType];
    const currentStart = formData.startDate ? new Date(formData.startDate) : new Date();

    let newEndDate = formData.startDate;
    if (rules.requiresEndTime && formData.startDate) {
      const endTime = new Date(currentStart.getTime() + rules.defaultDuration * 60000);
      newEndDate = format(endTime, "yyyy-MM-dd'T'HH:mm");
    } else if (rules.isMultiDay && formData.startDate) {
      const endDay = addDays(currentStart, 1);
      newEndDate = format(endDay, "yyyy-MM-dd");
    }

    setFormData({
      ...formData,
      eventType,
      color: rules.color,
      endDate: newEndDate,
      allDay: !rules.canHaveTime,
      hasTime: rules.canHaveTime
    });
  };

  const toggleTimePicker = (): void => {
    setFormData(prev => ({
      ...prev,
      hasTime: !prev.hasTime,
      allDay: !prev.hasTime
    }));
  };

  const toggleEndDateOptional = (): void => {
    setFormData(prev => ({
      ...prev,
      isEndDateOptional: !prev.isEndDateOptional
    }));
  };

  const handleDateClick = (date: Date): void => {
    setSelectedDate(date);
    setShowDayEvents(true);
  };

  const handleAddEvent = (date: Date): void => {
    // Check if the date is in the past
    if (isPastDate(date)) {
      setError('Cannot add events to past dates. Events can only be added to today or future dates.');
      setTimeout(() => setError(null), 5000);
      return;
    }

    setIsEditing(false);
    const dateStr = format(date, "yyyy-MM-dd");
    const timeStr = format(date, "HH:mm");

    const rules = EVENT_TYPE_RULES.MEETING;
    const startDateTime = rules.canHaveTime ? `${dateStr}T${timeStr}` : dateStr;

    let endDateTime = startDateTime;
    if (rules.requiresEndTime && rules.canHaveTime) {
      const endTime = new Date(date.getTime() + rules.defaultDuration * 60000);
      endDateTime = format(endTime, "yyyy-MM-dd'T'HH:mm");
    }

    setFormData({
      title: "",
      description: "",
      startDate: startDateTime,
      endDate: endDateTime,
      eventType: "MEETING",
      color: "#3B82F6",
      allDay: !rules.canHaveTime,
      location: "",
      hasTime: rules.canHaveTime,
      hasEndTime: rules.requiresEndTime && rules.canHaveTime,
      isEndDateOptional: false,
      visibility: "ALL_EMPLOYEES",
      employeeIds: [],
      departmentId: null,
      designationIds: []
    });
    setShowEventModal(true);
  };

  const handleEventClick = (event: CalendarEvent): void => {
    setSelectedEvent(event);
    setShowEventDetails(true);

    const eventDate = new Date(event.startDate);
    if (!isSameMonth(eventDate, currentMonth)) {
      setCurrentMonth(eventDate);
    }
  };

  const handleCreateEvent = async (): Promise<void> => {
    if (!companyId || !token) return;

    if (!formData.title.trim()) {
      setError('Event title is required');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (!formData.startDate) {
      setError('Start date is required');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const endDateToUse = formData.isEndDateOptional && !formData.endDate
        ? formData.startDate
        : formData.endDate;

    try {
      const eventData = {
        ...formData,
        endDate: endDateToUse,
        status: 'PENDING',
        completionPercentage: 0,
        companyId: parseInt(companyId),
        createdBy: parseInt(userId || "0"),
        hasTime: formData.hasTime,
        hasEndTime: formData.hasEndTime,
        isEndDateOptional: formData.isEndDateOptional,
        visibility: formData.visibility,
        employeeIds: formData.visibility === 'SELECTED_EMPLOYEES' ? formData.employeeIds : [],
        departmentId: formData.departmentId || null,
        designationIds: formData.designationIds && formData.designationIds.length > 0 
          ? JSON.stringify(formData.designationIds) 
          : null,
        selectedDepartments: formData.selectedDepartments && formData.selectedDepartments.length > 0
          ? JSON.stringify(formData.selectedDepartments)
          : null,
        selectedSubDepartments: formData.selectedSubDepartments && formData.selectedSubDepartments.length > 0
          ? JSON.stringify(formData.selectedSubDepartments)
          : null,
        includeAllSubDepartments: formData.includeAllSubDepartments || false,
        customEventType: formData.eventType === 'CUSTOM' ? formData.customEventType : null,
        sendEmailNotifications: formData.sendEmailNotifications || true
      };

      const response = await fetch(
          "/api/calendar/events",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(eventData),
          }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.resultDesc || "Failed to create event");
      }

      const result = await response.json();

      if (result.event) {
        setEvents(prev => [...prev, result.event]);
      }

      await fetchEvents();
      resetForm();
      setShowEventModal(false);
      setSuccessMessage('Event created successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleUpdateEvent = async (): Promise<void> => {
    if (!selectedEvent || !token) return;

    if (!formData.title.trim()) {
      setError('Event title is required');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (!formData.startDate) {
      setError('Start date is required');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const endDateToUse = formData.isEndDateOptional && !formData.endDate
        ? formData.startDate
        : formData.endDate;

    try {
      const response = await fetch(
          `/api/calendar/events/${selectedEvent.id}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...formData,
              endDate: endDateToUse,
              hasTime: formData.hasTime,
              isEndDateOptional: formData.isEndDateOptional,
              visibility: formData.visibility,
              employeeIds: formData.visibility === 'SELECTED_EMPLOYEES' ? formData.employeeIds : [],
              departmentId: formData.departmentId || null,
              designationIds: formData.designationIds && formData.designationIds.length > 0 
                ? JSON.stringify(formData.designationIds) 
                : null
            }),
          }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.resultDesc || "Failed to update event");
      }

      const result = await response.json();

      if (result.event) {
        setEvents(prev =>
            prev.map(e =>
                e.id === selectedEvent.id ? { ...e, ...result.event } : e
            )
        );
        setSelectedEvent(result.event);
      }

      await fetchEvents();
      resetForm();
      setShowEventModal(false);
      setShowEventDetails(false);
      setIsEditing(false);
      setSuccessMessage('Event updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update event");
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleDeleteEvent = async (eventId: number): Promise<void> => {
    if (!token) return;

    if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;

    try {
      const response = await fetch(
          `/api/calendar/events/${eventId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
      );

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      setEvents(prev => prev.filter(e => e.id !== eventId));

      await fetchEvents();
      setShowEventDetails(false);
      setSuccessMessage('Event deleted successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleEditEvent = async (): Promise<void> => {
    if (!selectedEvent) return;

    // Fetch departments and designations for the current company
    await fetchDepartments();
    await fetchDesignations();
    
    // If department is selected, fetch designations for that department
    if (selectedEvent.departmentId) {
      await fetchDesignations(selectedEvent.departmentId);
    }

    let startDateTime, endDateTime;
    const hasTime = selectedEvent.hasTime !== false;

    try {
      const startDate = new Date(selectedEvent.startDate);
      const endDate = selectedEvent.endDate ? new Date(selectedEvent.endDate) : startDate;

      const dateStr = format(startDate, "yyyy-MM-dd");
      const startTimeStr = format(startDate, "HH:mm");
      const endTimeStr = format(endDate, "HH:mm");

      startDateTime = hasTime ? `${dateStr}T${startTimeStr}` : dateStr;
      endDateTime = hasTime ? `${dateStr}T${endTimeStr}` : dateStr;
    } catch {
      startDateTime = selectedEvent.startDate.replace(" ", "T");
      endDateTime = selectedEvent.endDate ? selectedEvent.endDate.replace(" ", "T") : startDateTime;
    }

    // Parse designation IDs from JSON string if present
    let parsedDesignationIds: number[] = [];
    if (selectedEvent.designationIds) {
      if (Array.isArray(selectedEvent.designationIds)) {
        parsedDesignationIds = selectedEvent.designationIds;
      } else if (typeof selectedEvent.designationIds === 'string') {
        try {
          parsedDesignationIds = JSON.parse(selectedEvent.designationIds);
        } catch (error) {
          console.warn('Failed to parse designationIds:', error);
          parsedDesignationIds = [];
        }
      }
    }

    setFormData({
      title: selectedEvent.title,
      description: selectedEvent.description,
      startDate: startDateTime,
      endDate: endDateTime,
      eventType: selectedEvent.eventType,
      color: selectedEvent.color,
      allDay: !hasTime,
      location: selectedEvent.location || "",
      hasTime: hasTime,
      hasEndTime: selectedEvent.hasEndTime || false,
      isEndDateOptional: selectedEvent.isEndDateOptional || false,
      visibility: selectedEvent.visibility || "ALL_EMPLOYEES",
      employeeIds: [],
      departmentId: selectedEvent.departmentId,
      designationIds: parsedDesignationIds
    });
    setIsEditing(true);
    setShowEventDetails(false);
    setShowEventModal(true);
  };

  const resetForm = (): void => {
    setFormData({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      eventType: "MEETING",
      color: "#3B82F6",
      allDay: false,
      location: "",
      hasTime: true,
      hasEndTime: false,
      isEndDateOptional: false,
      visibility: "ALL_EMPLOYEES",
      employeeIds: [],
      departmentId: null,
      designationIds: []
    });
  };

  const prevMonth = (): void => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = (): void => setCurrentMonth(addMonths(currentMonth, 1));

  // ==================== WebSocket Connection ====================
  const connectWebSocket = useCallback((): (() => void) => {
    if (!companyId || !token) {
      console.log('WebSocket connection skipped: missing companyId or token');
      return () => {};
    }

    setWsStatus('connecting');

    try {
      const client = new Client({
        webSocketFactory: () => new SockJS('/ws'),
        connectHeaders: { 'Authorization': `Bearer ${token}` },
        debug: (str) => console.log('STOMP Debug:', str),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      client.onConnect = () => {
        console.log('Connected to WebSocket');
        setWsStatus('connected');

        client.subscribe(`/topic/calendar/${companyId}`, (message: IMessage) => {
          try {
            const data: WebSocketMessage = JSON.parse(message.body);

            switch(data.action) {
              case "CREATE":
                if (data.event) {
                  setEvents(prev => [...prev, data.event!]);
                  setSuccessMessage('New event added!');
                }
                break;
              case "UPDATE":
                if (data.event) {
                  setEvents(prev =>
                      prev.map(e => e.id === data.event!.id ? { ...e, ...data.event } : e)
                  );
                  if (selectedEvent?.id === data.event.id) {
                    setSelectedEvent(data.event);
                  }
                  setSuccessMessage('Event updated!');
                }
                break;
              case "DELETE":
                if (data.eventId) {
                  setEvents(prev => prev.filter(e => e.id !== data.eventId));
                  if (selectedEvent?.id === data.eventId) {
                    setShowEventDetails(false);
                    setSelectedEvent(null);
                  }
                  setSuccessMessage('Event deleted!');
                }
                break;
              case "STATUS_UPDATE":
                if (data.eventId && data.status) {
                  setEvents(prev =>
                      prev.map(e =>
                          e.id === data.eventId ? { ...e, status: data.status as 'COMPLETED' | 'IN_PROGRESS' | 'CANCELLED' | 'PENDING' } : e
                      )
                  );
                  if (selectedEvent?.id === data.eventId) {
                    setSelectedEvent(prev => prev ? { ...prev, status: data.status as 'COMPLETED' | 'IN_PROGRESS' | 'CANCELLED' | 'PENDING' } : null);
                  }
                }
                break;
            }

            setTimeout(() => setSuccessMessage(null), 3000);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        });
      };

      client.onStompError = (frame) => {
        console.error('STOMP error:', frame);
        setWsStatus('disconnected');
        setError('Real-time updates unavailable. Using HTTP polling instead.');
        setTimeout(() => setError(null), 5000);
      };

      client.onDisconnect = () => {
        console.log('WebSocket disconnected');
        setWsStatus('disconnected');
      };

      client.activate();
      clientRef.current = client;

      return () => {
        if (client.connected) {
          client.deactivate();
        }
      };
    } catch {
      setWsStatus('disconnected');
      setError('Real-time updates unavailable. Using HTTP polling instead.');
      setTimeout(() => setError(null), 5000);
      return () => {};
    }
  }, [companyId, token, selectedEvent]);

  // ==================== Data Fetching ====================
  const fetchEvents = useCallback(async (): Promise<void> => {
    if (!companyId || !token) {
      console.log('Missing companyId or token');
      return;
    }

    try {
      setLoading(true);
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;

      const isBackendHealthy = await testBackendConnectivity();
      if (!isBackendHealthy) {
        throw new Error('Backend server is not running or not accessible');
      }

      let allEvents: CalendarEvent[] = [];
      
      // Try to get events including leaves for the current employee
      if (userId && userId !== 'null') {
        try {
          const response = await fetch(
              `/api/calendar/events/company/${companyId}/employee/${userId}/including-leaves`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.resultCode === 100) {
              allEvents = data.events || [];
            }
          }
        } catch (error) {
          console.warn('Failed to fetch employee events with leaves, falling back to company events:', error);
        }
      }
      
      // If employee-specific fetch failed or userId is not available, get all company events
      if (allEvents.length === 0) {
        try {
          const response = await fetch(
              `/api/calendar/events/company/${companyId}/month/${year}/${month}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.resultCode === 100) {
              allEvents = data.events || [];
            }
          }
        } catch (error) {
          console.warn('Failed to fetch monthly events, trying all events:', error);
          
          // Final fallback - get all company events
          const response = await fetch(
              `/api/calendar/events/company/${companyId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.resultCode === 100) {
              allEvents = data.events || [];
            }
          } else {
            throw new Error(`Backend not responding. Status: ${response.status}`);
          }
        }
      }
      
      // Filter events for the current month if we got all events
      if (allEvents.length > 0) {
        const filteredEvents = allEvents.filter(event => {
          try {
            const eventDate = new Date(event.startDate);
            return eventDate.getFullYear() === year && eventDate.getMonth() + 1 === month;
          } catch {
            return false;
          }
        });
        setEvents(filteredEvents);
      } else {
        setEvents([]);
      }
    } catch (err) {
      let userMessage = 'Failed to fetch events';
      if (err instanceof Error) {
        if (err.message.includes('Backend server is not running')) {
          userMessage = 'Backend server is not running. Please start the server.';
        } else if (err.message.includes('Failed to fetch')) {
          userMessage = 'Network error. Please check your connection.';
        } else {
          userMessage = err.message;
        }
      }
      setError(userMessage);
      setTimeout(() => setError(null), 10000);
    } finally {
      setLoading(false);
    }
  }, [companyId, token, currentMonth, userId]);

  // ==================== Auto-update Statuses ====================
  const updateEventStatuses = useCallback((): void => {
    // Disabled automatic status updates to respect database status
    // Users should manually update status through the UI
    console.log('Auto status update disabled - using database status');
  }, []);

  // ==================== Effects ====================
  useEffect(() => {
    updateEventStatuses();
    const interval = setInterval(updateEventStatuses, 60000);
    return () => clearInterval(interval);
  }, [updateEventStatuses]);

  useEffect(() => {
    fetchEvents();
    fetchEmployees();
    fetchDepartments();
    const disconnectWebSocket = connectWebSocket();

    const intervalId = setInterval(fetchEvents, 30000);

    const handleFocus = () => fetchEvents();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchEvents();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (disconnectWebSocket) disconnectWebSocket();
    };
  }, [fetchEvents, connectWebSocket]);

  // Debounce employee search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchEmployees(employeeSearchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [employeeSearchTerm, searchEmployees]);

  // ==================== Render Functions ====================
  const renderDays = (): JSX.Element[] => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days: Date[] = [];
    let currentDay = startDate;
    while (currentDay <= endDate) {
      days.push(new Date(currentDay));
      currentDay = addDays(currentDay, 1);
    }

    return days.map((day, index) => {
      const dayEvents = filteredEvents.filter(event => {
        try {
          return isSameDay(new Date(event.startDate), day);
        } catch {
          return false;
        }
      });

      return (
          <div
              key={index}
              className={`min-h-[100px] border border-gray-200 p-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !isSameMonth(day, currentMonth) ? "bg-gray-50 text-gray-400" : ""
              } ${isToday(day) ? "bg-blue-50" : ""}`}
              onClick={() => handleDateClick(day)}
          >
            <div className={`text-sm font-medium mb-1 ${
                isToday(day) ? "text-blue-600" : ""
            }`}>
              {format(day, "d")}
            </div>
            <div className="space-y-1">
              {dayEvents.slice(0, 3).map((event, eventIndex) => {
                const status = getEventStatus(event);

                return (
                    <div
                        key={eventIndex}
                        className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 relative group"
                        style={{ backgroundColor: event.color + "20", color: event.color }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                    >
                      <div className="flex items-center space-x-1">
                        {event.eventType === 'LEAVE' && (
                          <span className="text-xs" title="Leave Event">🏖️</span>
                        )}
                        <div
                            className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
                            style={{ backgroundColor: getStatusColor(status) }}
                            title={`Status: ${status}`}
                        />
                        {event.allDay ? (
                            <span className="font-medium truncate">{event.title}</span>
                        ) : (
                            <span className="font-medium truncate">{event.title}</span>
                        )}
                      </div>
                      <div className="hidden group-hover:block absolute bottom-full left-0 mb-1 p-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10">
                        {event.title} - {STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label || status}
                      </div>
                    </div>
                );
              })}
              {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{dayEvents.length - 3} more
                  </div>
              )}
            </div>
          </div>
      );
    });
  };

  // ==================== Loading State ====================
  if (loading) {
    return (
        <div className="flex justify-center items-center h-64">
          <Loader className="animate-spin text-sky-500" size={48} />
        </div>
    );
  }

  // ==================== Main Render ====================
  return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Company Calendar</h2>
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search events..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            </div>

            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              {wsStatus === 'connected' ? (
                  <Wifi className="text-green-500" size={16} />
              ) : wsStatus === 'connecting' ? (
                  <Loader className="text-yellow-500 animate-spin" size={16} />
              ) : (
                  <WifiOff className="text-gray-400" size={16} />
              )}
              <span className="text-sm text-gray-600">
              {wsStatus === 'connected' ? 'Live' :
                  wsStatus === 'connecting' ? 'Connecting...' : 'Offline'}
            </span>
            </div>

            {/* Add Event Button */}
            <button
                onClick={() => handleAddEvent(new Date())}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              <span>Add Event</span>
            </button>
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <button
                onClick={prevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Previous month"
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-lg font-medium text-gray-800">
              {format(currentMonth, "MMMM yyyy")}
            </h3>
            <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Next month"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Legends */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {/* Event Types Legend */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-gray-500">Event Types:</span>
              {EVENT_TYPES.slice(0, 4).map((type) => (
                  <div key={type.value} className="flex items-center space-x-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                    <span className="text-gray-600">{type.label}</span>
                  </div>
              ))}
            </div>
            
            {/* Status Legend */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-gray-500">Status:</span>
              {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map((status) => (
                  <div key={status} className="flex items-center space-x-1">
                    <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: STATUS_CONFIG[status].color }} />
                    <span className="text-gray-600">{STATUS_CONFIG[status].label}</span>
                  </div>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0 border border-gray-200">
          {/* Weekday headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 border-r border-b border-gray-200 bg-gray-50">
                {day}
              </div>
          ))}

          {/* Calendar days */}
          {renderDays()}
        </div>

        {/* No Events Message */}
        {!loading && filteredEvents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium mb-2">No events for this month</p>
              <p className="text-sm mb-4">Click on any day to add an event</p>
              <button
                  onClick={() => handleAddEvent(new Date())}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Your First Event
              </button>
            </div>
        )}

        {/* Day Events Modal */}
        {showDayEvents && selectedDate && (
            <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto border border-gray-200">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-800">
                      Events for {format(selectedDate, "MMMM dd, yyyy")}
                    </h3>
                    <button
                        onClick={() => setShowDayEvents(false)}
                        className="text-gray-500 hover:text-gray-700"
                        aria-label="Close"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(() => {
                      const dayEvents = filteredEvents.filter(event => {
                        try {
                          return isSameDay(new Date(event.startDate), selectedDate);
                        } catch {
                          return false;
                        }
                      });

                      if (dayEvents.length === 0) {
                        const isPast = isPastDate(selectedDate);
                        return (
                            <div className="text-center py-8 text-gray-500">
                              <p>No events for this day</p>
                              {isPast ? (
                                <p className="text-sm text-gray-400 mt-2">Cannot add events to past dates</p>
                              ) : (
                                <button
                                    onClick={() => {
                                      setShowDayEvents(false);
                                      handleAddEvent(selectedDate);
                                    }}
                                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  Add Event
                                </button>
                              )}
                            </div>
                        );
                      }

                      return dayEvents.map((event) => {
                        const status = getEventStatus(event);

                        return (
                            <div
                                key={event.id}
                                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-all hover:shadow-md"
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setShowEventDetails(true);
                                  setShowDayEvents(false);
                                }}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2 flex-wrap gap-2">
                                    {event.eventType === 'LEAVE' && (
                                      <span className="text-lg" title="Leave Event">🏖️</span>
                                    )}
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: event.color }}
                                    />
                                    <h4 className="font-semibold text-gray-800">{event.title}</h4>
                                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                {event.eventType}
                              </span>
                                    <div className="flex items-center space-x-1">
                                      <div
                                          className="w-2 h-2 rounded-full animate-pulse"
                                          style={{ backgroundColor: getStatusColor(status) }}
                                      />
                                      <span
                                          className="text-xs px-2 py-1 rounded-full text-white flex items-center"
                                          style={{ backgroundColor: getStatusColor(status) }}
                                      >
                                  {getStatusIcon(status)}
                                        {STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label || status}
                                </span>
                                    </div>
                                  </div>

                                  {event.description && (
                                      <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                                  )}

                                  <div className="flex items-center space-x-4 text-sm text-gray-500 flex-wrap gap-2">
                                    <div className="flex items-center space-x-1">
                                      <Clock size={14} />
                                      <span>
                                  {event.allDay ? "All Day" :
                                      (() => {
                                        try {
                                          const startDate = new Date(event.startDate);
                                          const endDate = event.endDate ? new Date(event.endDate) : startDate;
                                          return `${format(startDate, "HH:mm")} - ${format(endDate, "HH:mm")}`;
                                        } catch {
                                          return event.startDate;
                                        }
                                      })()
                                  }
                                </span>
                                    </div>

                                    {event.location && (
                                        <div className="flex items-center space-x-1">
                                          <MapPin size={14} />
                                          <span><strong>Destination:</strong> {event.location}</span>
                                        </div>
                                    )}

                                    {event.departmentId && (() => {
                                      const department = departments.find(dept => dept.id === event.departmentId);
                                      return department && (
                                        <div className="flex items-center space-x-1">
                                          <Building2 size={14} />
                                          <span><strong>Department:</strong> {department.dptName}</span>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>
                        );
                      });
                    })()}
                  </div>

                  <div className="mt-6 flex justify-end">
                    {isPastDate(selectedDate) ? (
                      <span className="text-sm text-gray-400">Cannot add events to past dates</span>
                    ) : (
                      <button
                          onClick={() => {
                            setShowDayEvents(false);
                            handleAddEvent(selectedDate);
                          }}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus size={16} />
                        <span>Add Event</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* Event Modal */}
        {showEventModal && (
            <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {isEditing ? "Edit Event" : "Create Event"}
                  </h3>
                  <button
                      onClick={() => {
                        setShowEventModal(false);
                        resetForm();
                      }}
                      className="p-1 hover:bg-gray-100 rounded-lg"
                      aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Event title"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Event description"
                    />
                  </div>

                  {/* Event Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                    <select
                        value={formData.eventType}
                        onChange={(e) => handleEventTypeChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {EVENT_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                      ))}
                    </select>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                        type={formData.hasTime ? "datetime-local" : "date"}
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Include Time Toggle */}
                  <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="hasTime"
                        checked={formData.hasTime}
                        onChange={toggleTimePicker}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="hasTime" className="text-sm font-medium text-gray-700">
                      Include time (not all day)
                    </label>
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                        type={formData.hasTime ? "datetime-local" : "date"}
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={formData.isEndDateOptional}
                    />
                    {formData.isEndDateOptional && (
                        <p className="text-xs text-gray-500 mt-1">End date is optional, event will use start date</p>
                    )}
                  </div>

                  {/* End Date Optional Toggle */}
                  <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="isEndDateOptional"
                        checked={formData.isEndDateOptional}
                        onChange={toggleEndDateOptional}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isEndDateOptional" className="text-sm font-medium text-gray-700">
                      End date is optional
                    </label>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Event location (optional)"
                    />
                  </div>

                  {/* Visibility */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                    <select
                        value={formData.visibility}
                        onChange={(e) => {
                          setFormData({ 
                            ...formData, 
                            visibility: e.target.value, 
                            employeeIds: [], 
                            departmentId: null,
                            designationIds: []
                          });
                          if (e.target.value === 'DEPARTMENT') {
                            fetchDesignations(); // Fetch all designations when department is selected
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {VISIBILITY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {VISIBILITY_OPTIONS.find(opt => opt.value === formData.visibility)?.description}
                    </p>
                  </div>

                  {/* Department Selection */}
                  {formData.visibility === 'DEPARTMENT' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Select Department
                        </label>
                        <select
                            value={formData.departmentId || ''}
                            onChange={(e) => {
                              const deptId = e.target.value ? parseInt(e.target.value) : null;
                              setFormData({ ...formData, departmentId: deptId });
                              if (deptId) {
                                fetchDesignations(deptId);
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select a department</option>
                          {departmentsLoading ? (
                              <option>Loading departments...</option>
                          ) : departments.length === 0 ? (
                              <option>No departments found</option>
                          ) : (
                              departments.map((dept) => (
                                  <option key={dept.id} value={dept.id}>
                                    {dept.dptName}
                                  </option>
                              ))
                          )}
                        </select>
                      </div>
                  )}

                  {/* Designation Selection */}
                  {(formData.visibility === 'DESIGNATION' || (formData.visibility === 'DEPARTMENT' && formData.departmentId)) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {formData.visibility === 'DESIGNATION' ? 'Select Designations' : 'Select Designations (Optional)'}
                        </label>
                        <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                          {designationsLoading ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader className="animate-spin text-gray-400" size={16} />
                                <span className="ml-2 text-sm text-gray-500">Loading designations...</span>
                              </div>
                          ) : designations.length === 0 ? (
                              <p className="text-sm text-gray-500 text-center py-2">
                                {formData.visibility === 'DEPARTMENT' ? 'No designations found for this department' : 'No designations found'}
                              </p>
                          ) : (
                              designations.map((designation) => (
                                  <div key={designation.id} className="flex items-center space-x-2 py-1">
                                    <input
                                        type="checkbox"
                                        id={`designation-${designation.id}`}
                                        checked={formData.designationIds?.includes(designation.id) || false}
                                        onChange={(e) => {
                                          const designationIds = formData.designationIds || [];
                                          if (e.target.checked) {
                                            setFormData({ ...formData, designationIds: [...designationIds, designation.id] });
                                          } else {
                                            setFormData({ 
                                              ...formData, 
                                              designationIds: designationIds.filter(id => id !== designation.id) 
                                            });
                                          }
                                        }}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor={`designation-${designation.id}`} className="text-sm text-gray-700 cursor-pointer flex-1">
                                      {designation.designation}
                                    </label>
                                  </div>
                              ))
                          )}
                        </div>
                        {formData.designationIds && formData.designationIds.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              {formData.designationIds.length} designation{formData.designationIds.length > 1 ? 's' : ''} selected
                            </p>
                        )}
                      </div>
                  )}

                  {/* Employee Selection */}
                  {formData.visibility === 'SELECTED_EMPLOYEES' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Select Employees
                        </label>
                        
                        {/* Search Input */}
                        <div className="relative">
                          <input
                              type="text"
                              value={employeeSearchTerm}
                              onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                              onFocus={() => (employeeSearchTerm && (searchResults.length > 0 || showNewEmployeeOption)) && setShowSearchResults(true)}
                              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (showNewEmployeeOption && newEmployeeName) {
                                    addNewEmployee(newEmployeeName);
                                  } else if (searchResults.length > 0) {
                                    selectEmployee(searchResults[0]);
                                  }
                                }
                              }}
                              placeholder="Search by employee ID, name, or email..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {employeeSearchTerm && (
                              <button
                                  onClick={() => {
                                    setEmployeeSearchTerm('');
                                    setSearchResults([]);
                                    setShowSearchResults(false);
                                    setShowNewEmployeeOption(false);
                                  }}
                                  className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                              >
                                <X size={16} />
                              </button>
                          )}
                        </div>

                        {/* Search Results Dropdown */}
                        {showSearchResults && (searchResults.length > 0 || showNewEmployeeOption) && (
                            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                              
                              {/* New Employee Option */}
                              {showNewEmployeeOption && (
                                  <div
                                      onClick={() => addNewEmployee(newEmployeeName)}
                                      className="flex items-center p-3 hover:bg-green-50 cursor-pointer border-b border-gray-100 bg-green-50"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                                      <Plus size={16} className="text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium text-green-700">
                                        Add "{newEmployeeName}" as new employee
                                      </div>
                                      <div className="text-sm text-green-600">
                                        Click to add or press Enter
                                      </div>
                                    </div>
                                  </div>
                              )}

                              {/* Search Results Table */}
                              {searchResults.length > 0 && (
                                  <div className="p-2">
                                    <table className="w-full">
                                      <thead>
                                        <tr className="text-left text-xs font-medium text-gray-500 border-b">
                                          <th className="pb-2">Employee</th>
                                          <th className="pb-2">ID</th>
                                          <th className="pb-2">Department</th>
                                          <th className="pb-2">Designation</th>
                                          <th className="pb-2">Action</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {searchResults.map((employee) => (
                                            <tr
                                                key={employee.id}
                                                onClick={() => selectEmployee(employee)}
                                                className="hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                                            >
                                              <td className="py-2 pr-3">
                                                <div className="flex items-center">
                                                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                                                    {employee.profilePicture ? (
                                                        <img
                                                            src={employee.profilePicture}
                                                            alt={`${employee.first_name} ${employee.last_name}`}
                                                            className="w-6 h-6 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-blue-600 font-semibold text-xs">
                                                          {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
                                                        </span>
                                                    )}
                                                  </div>
                                                  <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                      {employee.first_name} {employee.last_name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                      {employee.email}
                                                    </div>
                                                  </div>
                                                </div>
                                              </td>
                                              <td className="py-2 text-sm text-gray-600">
                                                {employee.emp_no || employee.epf_no || '-'}
                                              </td>
                                              <td className="py-2 text-sm text-gray-600">
                                                {typeof employee.department === 'object' ? employee.department.dptName : employee.department || '-'}
                                              </td>
                                              <td className="py-2 text-sm text-gray-600">
                                                {typeof employee.designation === 'object' ? employee.designation.designation : employee.designation || '-'}
                                              </td>
                                              <td className="py-2">
                                                <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      selectEmployee(employee);
                                                    }}
                                                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                                >
                                                  Add
                                                </button>
                                              </td>
                                            </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                              )}
                            </div>
                        )}

                        {/* Selected Employees */}
                        <div className="mt-3 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                          {employeesLoading ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader className="animate-spin text-gray-400" size={16} />
                                <span className="ml-2 text-sm text-gray-500">Loading employees...</span>
                              </div>
                          ) : employees.length === 0 && (!formData.employeeIds || formData.employeeIds.length === 0) ? (
                              <p className="text-sm text-gray-500 text-center py-2">Search and select employees above</p>
                          ) : (
                              <div className="space-y-2">
                                {/* Display selected employees */}
                                {formData.employeeIds && formData.employeeIds.length > 0 && employees
                                    .filter((emp: Employee) => formData.employeeIds!.includes(emp.id))
                                    .map((employee) => (
                                        <div key={employee.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                            {employee.profilePicture ? (
                                                <img
                                                    src={employee.profilePicture}
                                                    alt={`${employee.first_name} ${employee.last_name}`}
                                                    className="w-6 h-6 rounded-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-blue-600 font-semibold text-xs">
                                                  {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
                                                </span>
                                            )}
                                          </div>
                                          <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-900">
                                              {employee.first_name} {employee.last_name}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                              {employee.emp_no || employee.epf_no || 'New Employee'}
                                              {typeof employee.department === 'object' && employee.department?.dptName && ` • ${employee.department.dptName}`}
                                              {typeof employee.department === 'string' && ` • ${employee.department}`}
                                              {typeof employee.designation === 'object' && employee.designation?.designation && ` • ${employee.designation.designation}`}
                                              {typeof employee.designation === 'string' && ` • ${employee.designation}`}
                                            </div>
                                          </div>
                                          <button
                                              onClick={() => removeEmployee(employee.id)}
                                              className="text-red-500 hover:text-red-700"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </div>
                                    ))}
                              </div>
                          )}
                        </div>
                        
                        {formData.employeeIds && formData.employeeIds.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              {formData.employeeIds.length} employee{formData.employeeIds.length > 1 ? 's' : ''} selected
                            </p>
                        )}
                      </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                        onClick={() => {
                          setShowEventModal(false);
                          resetForm();
                        }}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                        onClick={isEditing ? handleUpdateEvent : handleCreateEvent}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Save size={16} />
                      <span>{isEditing ? "Update" : "Create"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* Event Details Modal */}
        {showEventDetails && selectedEvent && (
            <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Event Details</h3>
                  <button
                      onClick={() => setShowEventDetails(false)}
                      className="p-1 hover:bg-gray-100 rounded-lg"
                      aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Title and Status */}
                  <div>
                    <div className="flex items-center space-x-2 mb-2 flex-wrap gap-2">
                      <h4 className="font-medium text-lg" style={{ color: selectedEvent.color }}>
                        {selectedEvent.title}
                      </h4>
                      {(() => {
                        const status = getEventStatus(selectedEvent);

                        return (
                            <div className="flex items-center space-x-1">
                              <div
                                  className="w-3 h-3 rounded-full animate-pulse"
                                  style={{ backgroundColor: getStatusColor(status) }}
                              />
                              <span
                                  className="text-xs px-2 py-1 rounded-full text-white flex items-center"
                                  style={{ backgroundColor: getStatusColor(status) }}
                              >
                          {getStatusIcon(status)}
                                {STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label || status}
                        </span>
                            </div>
                        );
                      })()}
                    </div>
                    <span
                        className="inline-block px-2 py-1 text-xs rounded-full text-white"
                        style={{ backgroundColor: selectedEvent.color }}
                    >
                  {EVENT_TYPES.find(t => t.value === selectedEvent.eventType)?.label || selectedEvent.eventType}
                </span>
                  </div>

                  {/* Description */}
                  {selectedEvent.description && (
                      <div>
                        <p className="text-sm text-gray-600">{selectedEvent.description}</p>
                      </div>
                  )}

                  {/* Date/Time */}
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock size={16} />
                    <span>
                  {selectedEvent.allDay ? "All Day" :
                      formatEventDate(selectedEvent.startDate, true) +
                      (selectedEvent.isEndDateOptional ? " (No end date)" :
                          selectedEvent.endDate ? " - " + formatEventDate(selectedEvent.endDate, true) : "")
                  }
                </span>
                  </div>

                  {/* Location */}
                  {selectedEvent.location && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin size={16} />
                        <span><strong>Destination:</strong> {selectedEvent.location}</span>
                      </div>
                  )}

                  {/* Department */}
                  {selectedEvent.departmentId && (() => {
                    const department = departments.find(dept => dept.id === selectedEvent.departmentId);
                    return department && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Building2 size={16} />
                          <span><strong>Department:</strong> {department.dptName}</span>
                        </div>
                    );
                  })()}

                  {/* Visibility */}
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Building2 size={16} />
                    <span><strong>Visibility:</strong> {
                      selectedEvent.visibility === 'COMPANY_ONLY' ? 'Company Only' :
                      selectedEvent.visibility === 'ALL_EMPLOYEES' ? 'All Employees' :
                      selectedEvent.visibility === 'SELECTED_EMPLOYEES' ? 'Selected Employees' :
                      selectedEvent.visibility === 'DEPARTMENT' ? 'Departments' :
                      selectedEvent.visibility === 'DESIGNATION' ? 'Designations' :
                      selectedEvent.visibility || 'Not Set'
                    }</span>
                  </div>

                  {/* Selected Departments (if visibility is DEPARTMENT) */}
                  {selectedEvent.visibility === 'DEPARTMENT' && selectedEvent.selectedDepartments && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Building2 size={16} />
                      <span><strong>Departments:</strong> {
                        (() => {
                          try {
                            let deptIds: number[] = [];
                            if (Array.isArray(selectedEvent.selectedDepartments)) {
                              deptIds = selectedEvent.selectedDepartments;
                            } else if (typeof selectedEvent.selectedDepartments === 'string') {
                              deptIds = JSON.parse(selectedEvent.selectedDepartments || '[]');
                            }
                            
                            if (deptIds.includes(-1)) {
                              return 'All Departments';
                            }
                            
                            const deptNames = deptIds.map((id: number) => {
                              const dept = departments.find(d => d.id === id);
                              return dept ? dept.dptName : `Dept ${id}`;
                            });
                            return deptNames.join(', ');
                          } catch {
                            return selectedEvent.selectedDepartments;
                          }
                        })()
                      }</span>
                    </div>
                  )}

                  {/* Selected Employees (if visibility is SELECTED_EMPLOYEES) */}
                  {selectedEvent.visibility === 'SELECTED_EMPLOYEES' && selectedEvent.employeeIds && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Users size={16} />
                      <span><strong>Employees:</strong> {
                        Array.isArray(selectedEvent.employeeIds) 
                          ? `${selectedEvent.employeeIds.length} selected`
                          : `${selectedEvent.employeeIds || '0'} selected`
                      }</span>
                    </div>
                  )}

                  {/* Status Control */}
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map((status) => {
                        const Icon = STATUS_CONFIG[status].icon;
                        const isCurrentStatus = getEventStatus(selectedEvent) === status;
                        const isLoading = statusUpdateLoading === selectedEvent.id;

                        return (
                            <button
                                key={status}
                                onClick={() => handleStatusChange(selectedEvent.id, status)}
                                disabled={isLoading}
                                className={`px-3 py-1 text-xs rounded-full transition-colors flex items-center ${
                                    isCurrentStatus
                                        ? 'text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                style={{
                                  backgroundColor: isCurrentStatus ? getStatusColor(status) : undefined
                                }}
                            >
                              {isLoading ? (
                                  <Loader size={12} className="animate-spin mr-1" />
                              ) : (
                                  Icon && <Icon size={12} className="mr-1" />
                              )}
                              {STATUS_CONFIG[status].label}
                            </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4">
                    {selectedEvent.eventType !== 'LEAVE' ? (
                      <>
                        <button
                            onClick={handleEditEvent}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Edit2 size={16} />
                          <span>Edit</span>
                        </button>
                        <button
                            onClick={() => handleDeleteEvent(selectedEvent.id)}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <Trash2 size={16} />
                          <span>Delete</span>
                        </button>
                      </>
                    ) : (
                      <div className="text-sm text-gray-500 italic">
                        🏖️ Leave events are managed through the leave system and cannot be edited here.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* Success Toast */}
        {successMessage && (
            <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg z-50 animate-slide-in">
              <div className="flex justify-between items-center">
                <span>{successMessage}</span>
                <button
                    onClick={() => setSuccessMessage(null)}
                    className="ml-4 text-green-500 hover:text-green-700"
                    aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
        )}

        {/* Error Toast */}
        {error && (
            <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg z-50 animate-slide-in">
              <div className="flex justify-between items-center">
                <span>{error}</span>
                <button
                    onClick={() => setError(null)}
                    className="ml-4 text-red-500 hover:text-red-700"
                    aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
        )}
      </div>
  );
};

export default DashboardCalendar;

