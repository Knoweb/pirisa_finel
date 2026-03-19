import React, { useState, useEffect, useCallback } from "react";
import { X, Search, Loader, Building2, MapPin } from "lucide-react";

// ==================== Types & Interfaces ====================

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
  sendEmailNotifications?: boolean;
}

interface Department {
  id: number;
  dptName: string;
  dptCode?: string;
  dptDesc?: string;
  cmpId: number;
  subDepartments?: SubDepartment[];
}

interface SubDepartment {
  id: number;
  name: string;
  departmentId: number;
}

interface Employee {
  id: number;
  emp_no?: string;
  first_name: string;
  last_name: string;
  email: string;
  epf_no?: string;
  department?: string | { dptName: string; id: number };
  designation?: string | { designation: string; id: number };
  profile_image?: string;
  phone?: string;
  address?: string;
  joined_date?: string;
}

// ==================== Event Types ====================

const EVENT_TYPES = [
  { value: "MEETING", label: "Meeting", color: "#3B82F6" },
  { value: "HOLIDAY", label: "Holiday", color: "#10B981" },
  { value: "DEADLINE", label: "Deadline", color: "#EF4444" },
  { value: "REMINDER", label: "Reminder", color: "#F59E0B" },
  { value: "FUNCTION", label: "Function", color: "#8B5CF6" },
  { value: "TRAINING", label: "Training", color: "#06B6D4" },
  { value: "CUSTOM", label: "Custom", color: "#6B7280" },
];

const VISIBILITY_OPTIONS = [
  { value: "COMPANY_ONLY", label: "Company Only", description: "Visible to everyone in the company" },
  { value: "ALL_EMPLOYEES", label: "All Employees", description: "Visible to all employees" },
  { value: "SELECTED_EMPLOYEES", label: "Selected Employees", description: "Visible only to selected employees" },
  { value: "DEPARTMENT", label: "Departments", description: "Visible to specific departments" },
  { value: "DESIGNATION", label: "Designations", description: "Visible to specific designations" },
];

// ==================== Component ====================

interface EnhancedEventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: EventFormData) => Promise<void>;
  initialData?: Partial<EventFormData>;
  companyId: string;
  token: string;
}

export const EnhancedEventForm: React.FC<EnhancedEventFormProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  companyId,
  token
}) => {
  // ==================== State Management ====================
  
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
    sendEmailNotifications: true, // Default to true - send emails by default
    ...initialData
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Department and Employee data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  
  // Employee search
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Employee[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // ==================== Data Fetching ====================

  const fetchDepartments = useCallback(async () => {
    if (!companyId || !token) return;

    try {
      setDepartmentsLoading(true);
      const response = await fetch(
        `/api/department/company/${companyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.DepartmentList || data.UnitList || data.departments) {
          const rawDeps = data.DepartmentList || data.UnitList || data.departments || [];
          // Add "All Departments" option
          const allDepartmentsOption = {
            id: -1,
            dptName: "All Departments",
            dptCode: "ALL",
            dptDesc: "Select all departments",
            cmpId: parseInt(companyId),
          };
          setDepartments([allDepartmentsOption, ...departments]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    } finally {
      setDepartmentsLoading(false);
    }
  }, [companyId, token]);

  const searchEmployees = useCallback(async (query: string) => {
    if (!query || !companyId || !token) return;

    try {
      setSearchLoading(true);
      const response = await fetch(
        `/api/employees/search?query=${encodeURIComponent(query)}&companyId=${companyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.employees || []);
        setShowSearchResults(true);
      }
    } catch (err) {
      console.error('Failed to search employees:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [companyId, token]);

  // ==================== Event Handlers ====================

  const handleInputChange = <K extends keyof EventFormData>(field: K, value: EventFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEventTypeChange = (eventType: string) => {
    const selectedType = EVENT_TYPES.find(type => type.value === eventType);
    setFormData(prev => ({
      ...prev,
      eventType,
      color: selectedType?.color || "#3B82F6",
      customEventType: eventType === "CUSTOM" ? "" : prev.customEventType
    }));
  };

  const handleDepartmentToggle = (departmentId: number) => {
    setFormData(prev => {
      const selectedDepartments = prev.selectedDepartments || [];
      const isSelected = selectedDepartments.includes(departmentId);
      
      if (departmentId === -1) {
        // "All Departments" option
        return {
          ...prev,
          selectedDepartments: isSelected ? [] : departments.filter(d => d.id !== -1).map(d => d.id),
          includeAllSubDepartments: !isSelected
        };
      }
      
      const newSelection = isSelected
        ? selectedDepartments.filter(id => id !== departmentId)
        : [...selectedDepartments, departmentId];
      
      return {
        ...prev,
        selectedDepartments: newSelection,
        includeAllSubDepartments: false
      };
    });
  };

  const handleEmployeeSelect = (employee: Employee) => {
    setFormData(prev => ({
      ...prev,
      employeeIds: [...(prev.employeeIds || []), employee.id]
    }));
    setEmployeeSearchTerm("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleEmployeeRemove = (employeeId: number) => {
    setFormData(prev => ({
      ...prev,
      employeeIds: (prev.employeeIds || []).filter(id => id !== employeeId)
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.title.trim()) return "Title is required";
    if (!formData.startDate) return "Start date is required";
    
    if (!formData.isEndDateOptional && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) return "End date cannot be before start date";
    }
    
    if (formData.visibility === "SELECTED_EMPLOYEES" && (!formData.employeeIds || formData.employeeIds.length === 0)) {
      return "Please select at least one employee";
    }
    
    if (formData.visibility === "DEPARTMENT" && (!formData.selectedDepartments || formData.selectedDepartments.length === 0)) {
      return "Please select at least one department";
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  // ==================== Effects ====================

  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
    }
  }, [isOpen, fetchDepartments]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (employeeSearchTerm) {
        searchEmployees(employeeSearchTerm);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [employeeSearchTerm, searchEmployees]);

  // ==================== Render ====================

  if (!isOpen) return null;

  const selectedEmployees = searchResults.filter((emp: Employee) => formData.employeeIds?.includes(emp.id));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Create Event</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter event title"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Add event description (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
              <select
                value={formData.eventType}
                onChange={(e) => handleEventTypeChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {EVENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
                <option value="CUSTOM">Custom Event Type</option>
              </select>
              
              {formData.eventType === "CUSTOM" && (
                <input
                  type="text"
                  value={formData.customEventType || ""}
                  onChange={(e) => handleInputChange('customEventType', e.target.value)}
                  className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter custom event type"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add location (optional)"
                />
              </div>
            </div>
          </div>

          {/* Date and Time Settings */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Date & Time Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate ? formData.startDate.split('T')[0] : ''}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                
                <label className="flex items-center mt-3">
                  <input
                    type="checkbox"
                    checked={formData.hasTime}
                    onChange={(e) => handleInputChange('hasTime', e.target.checked)}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Add time (optional)</span>
                </label>
                
                {formData.hasTime && (
                  <div className="mt-2">
                    <input
                      type="time"
                      value={formData.startDate && formData.startDate.includes('T') ? formData.startDate.split('T')[1]?.substring(0, 5) : ''}
                      onChange={(e) => {
                        const datePart = formData.startDate ? formData.startDate.split('T')[0] : '';
                        handleInputChange('startDate', `${datePart}T${e.target.value}:00`);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={!formData.isEndDateOptional}
                      onChange={(e) => handleInputChange('isEndDateOptional', !e.target.checked)}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Add end date</span>
                  </label>
                </div>
                
                {formData.isEndDateOptional ? (
                  <div className="text-sm text-gray-500 italic p-3 bg-gray-50 rounded-lg">
                    Single-day event (no end date)
                  </div>
                ) : (
                  <div>
                    <input
                      type="date"
                      value={formData.endDate ? formData.endDate.split('T')[0] : ''}
                      onChange={(e) => {
                        const timePart = formData.endDate && formData.endDate.includes('T') ? formData.endDate.split('T')[1] : '';
                        handleInputChange('endDate', timePart ? `${e.target.value}T${timePart}` : e.target.value);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    
                    {formData.hasTime && (
                      <div className="mt-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.hasEndTime}
                            onChange={(e) => handleInputChange('hasEndTime', e.target.checked)}
                            className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Add end time</span>
                        </label>
                        
                        {formData.hasEndTime && (
                          <input
                            type="time"
                            value={formData.endDate && formData.endDate.includes('T') ? formData.endDate.split('T')[1]?.substring(0, 5) : ''}
                            onChange={(e) => {
                              const datePart = formData.endDate ? formData.endDate.split('T')[0] : '';
                              handleInputChange('endDate', `${datePart}T${e.target.value}:00`);
                            }}
                            className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Visibility Settings */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Visibility Settings</h3>
            
            <div className="space-y-3">
              {VISIBILITY_OPTIONS.map(option => (
                <label key={option.value} className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value={option.value}
                    checked={formData.visibility === option.value}
                    onChange={(e) => handleInputChange('visibility', e.target.value)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* Department Selection */}
            {formData.visibility === "DEPARTMENT" && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Select Departments</h4>
                
                {departmentsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader size={20} className="animate-spin mr-2" />
                    Loading departments...
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {/* All Departments Option */}
                    <label className="flex items-center p-2 hover:bg-white rounded cursor-pointer bg-blue-50 border border-blue-200">
                      <input
                        type="checkbox"
                        checked={formData.selectedDepartments?.includes(-1) || false}
                        onChange={() => handleDepartmentToggle(-1)}
                        className="mr-3"
                      />
                      <Building2 size={16} className="mr-2 text-blue-600" />
                      <span className="font-medium text-blue-900">All Departments</span>
                    </label>
                    
                    {/* Individual Departments */}
                    {departments.map(dept => (
                      <label key={dept.id} className="flex items-center p-2 hover:bg-white rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.selectedDepartments?.includes(dept.id) || false}
                          onChange={() => handleDepartmentToggle(dept.id)}
                          className="mr-3"
                          disabled={formData.selectedDepartments?.includes(-1)}
                        />
                        <Building2 size={16} className="mr-2 text-gray-400" />
                        <span className={formData.selectedDepartments?.includes(-1) ? "text-gray-400" : ""}>
                          {dept.dptName}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                
                {/* Sub-departments selection when specific departments are selected */}
                {formData.selectedDepartments && formData.selectedDepartments.length > 0 && !formData.selectedDepartments.includes(-1) && (
                  <div className="mt-4 p-3 bg-white rounded border">
                    <label className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={formData.includeAllSubDepartments || false}
                        onChange={(e) => handleInputChange('includeAllSubDepartments', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Include all sub-departments</span>
                    </label>
                    
                    {!formData.includeAllSubDepartments && (
                      <div className="text-sm text-gray-500">
                        Select specific sub-departments for each selected department
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Employee Selection */}
            {formData.visibility === "SELECTED_EMPLOYEES" && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Select Employees</h4>
                
                {/* Employee Search */}
                <div className="relative mb-4">
                  <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={employeeSearchTerm}
                    onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search by employee ID, name, email, department..."
                  />
                  
                  {employeeSearchTerm && (
                    <button
                      onClick={() => setEmployeeSearchTerm("")}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Email Notification Option */}
                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <input
                    type="checkbox"
                    id="sendEmailNotifications"
                    checked={formData.sendEmailNotifications || false}
                    onChange={(e) => handleInputChange('sendEmailNotifications', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="sendEmailNotifications" className="text-sm text-blue-800 font-medium cursor-pointer">
                    Send email notifications to selected employees
                  </label>
                </div>

                {/* Search Results Table */}
                {showSearchResults && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                    {searchLoading ? (
                      <div className="p-4 text-center">
                        <Loader size={20} className="animate-spin mx-auto" />
                      </div>
                    ) : searchResults.length > 0 ? (
                      <>
                        {/* Table Header */}
                        <div className="bg-gray-50 border-b border-gray-200 sticky top-0">
                          <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-gray-700">
                            <div className="col-span-1">Photo</div>
                            <div className="col-span-3">Name</div>
                            <div className="col-span-3">Email</div>
                            <div className="col-span-2">Department</div>
                            <div className="col-span-2">ID</div>
                            <div className="col-span-1">Action</div>
                          </div>
                        </div>
                        
                        {/* Table Body */}
                        <div className="divide-y divide-gray-100">
                          {searchResults.map(employee => (
                            <div
                              key={employee.id}
                              className="grid grid-cols-12 gap-2 px-3 py-2 items-center hover:bg-blue-50 cursor-pointer transition-colors"
                              onClick={() => handleEmployeeSelect(employee)}
                            >
                              {/* Photo */}
                              <div className="col-span-1 flex justify-center">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                                  {employee.profile_image ? (
                                    <img 
                                      src={employee.profile_image} 
                                      alt={`${employee.first_name} ${employee.last_name}`}
                                      className="w-full h-full rounded-full object-cover"
                                      onError={(e) => {
                                        const target = e.currentTarget;
                                        const nextElement = target.nextElementSibling as HTMLElement;
                                        target.style.display = 'none';
                                        if (nextElement) {
                                          nextElement.style.display = 'flex';
                                        }
                                      }}
                                    />
                                  ) : null}
                                  <div className="text-white text-xs font-semibold" style={{display: employee.profile_image ? 'none' : 'flex'}}>
                                    {employee.first_name?.charAt(0)}{employee.last_name?.charAt(0)}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Name */}
                              <div className="col-span-3">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {employee.first_name} {employee.last_name}
                                </div>
                                {employee.designation && (
                                  <div className="text-xs text-gray-500 truncate">
                                    {typeof employee.designation === 'object' ? employee.designation.designation : employee.designation}
                                  </div>
                                )}
                              </div>
                              
                              {/* Email */}
                              <div className="col-span-3">
                                <div className="text-sm text-gray-600 truncate">
                                  {employee.email}
                                </div>
                              </div>
                              
                              {/* Department */}
                              <div className="col-span-2">
                                <div className="text-sm text-gray-600 truncate">
                                  {employee.department ? (
                                    typeof employee.department === 'object' ? employee.department.dptName : employee.department
                                  ) : 'N/A'}
                                </div>
                              </div>
                              
                              {/* ID */}
                              <div className="col-span-2">
                                <div className="text-sm text-gray-600">
                                  {employee.emp_no || employee.epf_no || 'N/A'}
                                </div>
                              </div>
                              
                              {/* Action */}
                              <div className="col-span-1 flex justify-center">
                                {formData.employeeIds?.includes(employee.id) ? (
                                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEmployeeSelect(employee);
                                    }}
                                    className="w-6 h-6 rounded-full border-2 border-blue-500 hover:bg-blue-500 hover:border-blue-500 transition-colors flex items-center justify-center"
                                    title="Add employee"
                                  >
                                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No employees found matching "{employeeSearchTerm}"
                      </div>
                    )}
                  </div>
                )}

                {/* Selected Employees Table */}
                {selectedEmployees.length > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="text-sm font-medium text-gray-700">Selected Employees ({selectedEmployees.length})</h5>
                      <button
                        onClick={() => {
                          const updatedEmployeeIds: number[] = [];
                          setFormData(prev => ({ ...prev, employeeIds: updatedEmployeeIds }));
                        }}
                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                      >
                        Clear All
                      </button>
                    </div>
                    
                    {/* Table Header */}
                    <div className="bg-gray-50 border border-gray-200 rounded-t-lg">
                      <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-gray-700 border-b border-gray-200">
                        <div className="col-span-1">Photo</div>
                        <div className="col-span-3">Name</div>
                        <div className="col-span-3">Email</div>
                        <div className="col-span-2">Department</div>
                        <div className="col-span-2">ID</div>
                        <div className="col-span-1">Action</div>
                      </div>
                    </div>
                    
                    {/* Table Body */}
                    <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg overflow-hidden">
                      <div className="max-h-48 overflow-y-auto">
                        {selectedEmployees.map((employee: Employee) => (
                          <div key={employee.id} className="grid grid-cols-12 gap-2 px-3 py-2 items-center border-b border-gray-100 hover:bg-gray-50 last:border-b-0">
                            {/* Photo */}
                            <div className="col-span-1 flex justify-center">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                                {employee.profile_image ? (
                                  <img 
                                    src={employee.profile_image} 
                                    alt={`${employee.first_name} ${employee.last_name}`}
                                    className="w-full h-full rounded-full object-cover"
                                    onError={(e) => {
                                      const target = e.currentTarget;
                                      const nextElement = target.nextElementSibling as HTMLElement;
                                      target.style.display = 'none';
                                      if (nextElement) {
                                        nextElement.style.display = 'flex';
                                      }
                                    }}
                                  />
                                ) : null}
                                <div className="text-white text-xs font-semibold" style={{display: employee.profile_image ? 'none' : 'flex'}}>
                                  {employee.first_name?.charAt(0)}{employee.last_name?.charAt(0)}
                                </div>
                              </div>
                            </div>
                            
                            {/* Name */}
                            <div className="col-span-3">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {employee.first_name} {employee.last_name}
                              </div>
                              {employee.designation && (
                                <div className="text-xs text-gray-500 truncate">
                                  {typeof employee.designation === 'object' ? employee.designation.designation : employee.designation}
                                </div>
                              )}
                            </div>
                            
                            {/* Email */}
                            <div className="col-span-3">
                              <div className="text-sm text-gray-600 truncate">
                                {employee.email}
                              </div>
                            </div>
                            
                            {/* Department */}
                            <div className="col-span-2">
                              <div className="text-sm text-gray-600 truncate">
                                {employee.department ? (
                                  typeof employee.department === 'object' ? employee.department.dptName : employee.department
                                ) : 'N/A'}
                              </div>
                            </div>
                            
                            {/* ID */}
                            <div className="col-span-2">
                              <div className="text-sm text-gray-600">
                                {employee.emp_no || employee.epf_no || 'N/A'}
                              </div>
                            </div>
                            
                            {/* Action */}
                            <div className="col-span-1 flex justify-center">
                              <button
                                onClick={() => handleEmployeeRemove(employee.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                                title="Remove employee"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="border-t pt-4">
            <div className="text-sm font-medium text-gray-700 mb-3">Quick Actions</div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  // Add 3 default employees (1, 2, 3)
                  const defaultEmployees = [1, 2, 3];
                  setFormData(prev => ({ 
                    ...prev, 
                    employeeIds: defaultEmployees,
                    visibility: 'SELECTED_EMPLOYEES'
                  }));
                  // Show success message
                  alert('Added 3 employees to the event!');
                }}
                className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add 3 Employees
              </button>
              
              <button
                type="button"
                onClick={() => {
                  // Clear all employees
                  setFormData(prev => ({ 
                    ...prev, 
                    employeeIds: []
                  }));
                  alert('Cleared all employees!');
                }}
                className="px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear Employees
              </button>
              
              <button
                type="button"
                onClick={() => {
                  // Check current employees
                  const currentEmployees = formData.employeeIds || [];
                  alert(`Currently selected employees: ${currentEmployees.length}\nEmployee IDs: [${currentEmployees.join(', ')}]`);
                }}
                className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
              >
                Check Employees
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="border-t pt-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <Loader size={16} className="animate-spin mr-2" />
                  Creating Event...
                </div>
              ) : (
                "Create Event"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnhancedEventForm;
