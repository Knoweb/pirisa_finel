import { Pencil, Trash2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface Question {
  id: number;
  text: string;
}

interface DesignationData {
  name: string;
  questions: Question[];
}

interface DepartmentData {
  name: string;
  designations: DesignationData[];
}

const EmployeeEvaluationForm: React.FC = () => {
  const departments: DepartmentData[] = [
    {
      name: "Admin",
      designations: [
        {
          name: "HR Manager",
          questions: [
            {
              id: 1,
              text: "HR policies are clearly communicated to all employees",
            },
            {
              id: 2,
              text: "The onboarding process is effective for new hires",
            },
            {
              id: 3,
              text: "Employee concerns are addressed promptly and fairly",
            },
            {
              id: 4,
              text: "Performance review processes are transparent and fair",
            },
          ],
        },
        {
          name: "Office Administrator",
          questions: [
            {
              id: 1,
              text: "Office supplies are well-managed and readily available",
            },
            {
              id: 2,
              text: "The workspace environment is conducive to productivity",
            },
            {
              id: 3,
              text: "Administrative procedures are streamlined and efficient",
            },
            {
              id: 4,
              text: "Meeting rooms and shared spaces are properly maintained",
            },
          ],
        },
        {
          name: "Executive Assistant",
          questions: [
            { id: 1, text: "Calendars and scheduling are managed effectively" },
            {
              id: 2,
              text: "Communication between executives and teams is facilitated well",
            },
            { id: 3, text: "Travel arrangements are handled efficiently" },
            {
              id: 4,
              text: "Confidentiality is maintained for sensitive information",
            },
          ],
        },
      ],
    },
    {
      name: "Accounting",
      designations: [
        {
          name: "Financial Analyst",
          questions: [
            {
              id: 1,
              text: "Financial forecasts are accurate and useful for planning",
            },
            { id: 2, text: "Investment analyses provide valuable insights" },
            {
              id: 3,
              text: "Performance metrics are tracked and reported effectively",
            },
            {
              id: 4,
              text: "Financial models are reliable and well-constructed",
            },
          ],
        },
        {
          name: "Accountant",
          questions: [
            {
              id: 1,
              text: "Financial statements are prepared accurately and on time",
            },
            { id: 2, text: "Tax compliance is managed effectively" },
            {
              id: 3,
              text: "Accounts receivable and payable are handled efficiently",
            },
            {
              id: 4,
              text: "Audit support is comprehensive and well-organized",
            },
          ],
        },
        {
          name: "Payroll Specialist",
          questions: [
            { id: 1, text: "Payroll is processed accurately and on schedule" },
            {
              id: 2,
              text: "Tax withholdings and benefits are calculated correctly",
            },
            { id: 3, text: "Employee payroll questions are answered promptly" },
            {
              id: 4,
              text: "Time and attendance tracking systems are reliable",
            },
          ],
        },
      ],
    },
    {
      name: "Software",
      designations: [
        {
          name: "Senior Software Engineer",
          questions: [
            {
              id: 1,
              text: "Code quality standards are maintained across the team",
            },
            {
              id: 2,
              text: "Technical architecture decisions are well-documented",
            },
            { id: 3, text: "Junior developers receive adequate mentoring" },
            {
              id: 4,
              text: "System performance is regularly evaluated and optimized",
            },
            {
              id: 5,
              text: "Complex technical problems are resolved efficiently",
            },
            { id: 6, text: "Technical debt is appropriately managed" },
          ],
        },
        {
          name: "Junior Software Engineer",
          questions: [
            { id: 1, text: "Coding standards are followed consistently" },
            { id: 2, text: "Tasks are completed within estimated timeframes" },
            { id: 3, text: "Code documentation is thorough and clear" },
            { id: 4, text: "Unit tests are written for all new code" },
            { id: 5, text: "Technical skills are continuously improving" },
            {
              id: 6,
              text: "Code reviews provide valuable learning opportunities",
            },
          ],
        },
        {
          name: "UI/UX Designer",
          questions: [
            {
              id: 1,
              text: "User interface designs are intuitive and accessible",
            },
            { id: 2, text: "Design systems are consistent across products" },
            { id: 3, text: "User research informs design decisions" },
            { id: 4, text: "Prototypes effectively communicate design intent" },
            {
              id: 5,
              text: "Collaboration with developers is smooth and productive",
            },
            {
              id: 6,
              text: "Design work is delivered according to project timelines",
            },
          ],
        },
        {
          name: "DevOps Engineer",
          questions: [
            { id: 1, text: "Deployment processes are automated and reliable" },
            { id: 2, text: "Infrastructure is scalable and well-monitored" },
            { id: 3, text: "System uptime meets or exceeds SLA requirements" },
            { id: 4, text: "Security protocols are properly implemented" },
            { id: 5, text: "Incident response time is minimized" },
            { id: 6, text: "CI/CD pipelines are efficient and stable" },
          ],
        },
      ],
    },
    {
      name: "IT",
      designations: [
        {
          name: "IT Support Specialist",
          questions: [
            {
              id: 1,
              text: "Technical issues are resolved quickly and effectively",
            },
            { id: 2, text: "Communication with users is clear and helpful" },
            { id: 3, text: "Knowledge base documentation is up-to-date" },
            { id: 4, text: "Recurring problems are identified and addressed" },
          ],
        },
        {
          name: "Network Administrator",
          questions: [
            { id: 1, text: "Network performance meets business requirements" },
            { id: 2, text: "Network security measures are robust" },
            { id: 3, text: "Network documentation is comprehensive" },
            {
              id: 4,
              text: "Network outages are minimized and quickly resolved",
            },
          ],
        },
        {
          name: "System Engineer",
          questions: [
            {
              id: 1,
              text: "System architecture meets scalability requirements",
            },
            {
              id: 2,
              text: "System integrations are properly designed and maintained",
            },
            {
              id: 3,
              text: "Backup and disaster recovery systems are effective",
            },
            {
              id: 4,
              text: "Technical documentation is thorough and accessible",
            },
          ],
        },
      ],
    },
  ];

  const [selectedTab, setSelectedTab] = useState<string>("Software");
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentData>(
    departments.find((dept) => dept.name === "Software") || departments[0]
  );
  const [selectedDesignationName, setSelectedDesignationName] = useState<string>(
    departments.find((dept) => dept.name === "Software")?.designations[0].name || ""
  );
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const navigate = useNavigate();

  const handleTabChange = (tabName: string) => {
    setSelectedTab(tabName);
    const newDept = departments.find((dept) => dept.name === tabName) || departments[0];
    setSelectedDepartment(newDept);
    setSelectedDesignationName(newDept.designations[0].name);
  };

  const handleDesignationChange = (designationName: string) => {
    setSelectedDesignationName(designationName);
  };

  const handleEditClick = (question: Question) => {
    setSelectedQuestion(question);
    setIsModalOpen(true);
  };

  const handleSave = (updatedText: string) => {
    if (selectedQuestion) {
      const updatedQuestions = currentQuestions.map((q) =>
        q.id === selectedQuestion.id ? { ...q, text: updatedText } : q
      );
      setCurrentQuestions(updatedQuestions);
      setIsModalOpen(false);
    }
  };

  const handleNewForm = () => {
    navigate("/performance/newForm");
  }

  useEffect(() => {
    const designation = selectedDepartment.designations.find(
      (d) => d.name === selectedDesignationName
    );
    if (designation) {
      setCurrentQuestions(designation.questions);
    }
  }, [selectedDepartment, selectedDesignationName]);

  return (
    <div className="container mx-auto p-4">
      {/* Navigation Tabs */}
      <div className="flex border-b border-b-gray-400">
        {departments.map((dept) => (
          <div
            key={dept.name}
            className={`px-4 py-2 cursor-pointer ${
              selectedTab === dept.name
                ? "text-blue-500 border-b-2 border-sky-500"
                : "text-gray-500"
            }`}
            onClick={() => handleTabChange(dept.name)}
          >
            {dept.name}
          </div>
        ))}
      </div>

      {/* Form Header */}
      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-bold">Evaluation Form</h1>
      </div>

      {/* New Form Button */}
      <div className="mb-6">
        <button onClick={handleNewForm} className="bg-sky-500 text-white px-4 py-2 rounded-md flex items-center hover:bg-sky-600 hover:scale-105 cursor-pointer">
          <span className="mr-2">+</span>
          New Form
        </button>
      </div>

      {/* Designation Selection */}
      <div className="flex items-center mb-8">
        <div className="font-bold mr-4">Designation:</div>
        <div className="relative w-64">
          <select
            value={selectedDesignationName}
            onChange={(e) => handleDesignationChange(e.target.value)}
            className="block appearance-none w-full bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 pr-8 rounded leading-tight focus:outline-none"
          >
            {selectedDepartment.designations.map((designation) => (
              <option key={designation.name} value={designation.name}>
                {designation.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg
              className="fill-current h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>

        {/* New Question Button */}
        <div className="ml-auto">
          <button className="bg-green-500 text-white px-4 py-2 rounded-md flex items-center  hover:bg-green-600 hover:scale-105 cursor-pointer">
            <span className="mr-2">+</span>
            New Question
          </button>
        </div>
      </div>

      {/* Evaluation Table */}
      <div className="w-full overflow-auto">
        <table className="min-w-full bg-white border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-3 px-4 text-left text-gray-500 w-1/3">Question</th>
              <th className="py-3 px-4 text-center text-gray-500">Strongly Disagree</th>
              <th className="py-3 px-4 text-center text-gray-500">Disagree</th>
              <th className="py-3 px-4 text-center text-gray-500">Neutral</th>
              <th className="py-3 px-4 text-center text-gray-500">Agree</th>
              <th className="py-3 px-4 text-center text-gray-500">Agree</th>
              <th className="py-3 px-4 text-center text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody>
            {currentQuestions.map((question) => (
              <tr
                key={question.id}
                className="border-b border-b-neutral-300 last:border-b-0 hover:bg-gray-50 cursor-pointer"
              >
                <td className="py-4 px-4">{question.text}</td>
                <td className="py-4 px-4 text-center">
                  <input type="radio" name={`question-${question.id}`} className="h-4 w-4" />
                </td>
                <td className="py-4 px-4 text-center">
                  <input type="radio" name={`question-${question.id}`} className="h-4 w-4" />
                </td>
                <td className="py-4 px-4 text-center">
                  <input type="radio" name={`question-${question.id}`} className="h-4 w-4" />
                </td>
                <td className="py-4 px-4 text-center">
                  <input type="radio" name={`question-${question.id}`} className="h-4 w-4" />
                </td>
                <td className="py-4 px-4 text-center">
                  <input type="radio" name={`question-${question.id}`} className="h-4 w-4" />
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="flex justify-center space-x-2">
                    <button
                      className="p-2 rounded-lg bg-sky-100 hover:bg-sky-200 transition-colors"
                      aria-label="Edit"
                      onClick={() => handleEditClick(question)}
                    >
                      <Pencil size={16} className="text-sky-600" />
                    </button>
                    <button
                      className="p-2 rounded-lg bg-red-100 hover:bg-red-200 transition-colors"
                      aria-label="Delete"
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && selectedQuestion && (
  <div className="fixed inset-0 backdrop-blur-xl flex items-center justify-center">
    <div className="bg-white p-6 rounded-lg w-1/3 shadow-2xl">
      <div className="flex items-center mb-4">
        <img src="/public/logo.png" alt="Logo" className="h-6 w-28 mr-8" />
        <h2 className="text-xl font-bold text-neutral-400">Edit Question</h2>
      </div>
      <hr className="text-neutral-300 mb-4" />
      <textarea
        className="w-full p-2 border border-gray-300 rounded mb-4"
        value={selectedQuestion.text}
        onChange={(e) => setSelectedQuestion({ ...selectedQuestion, text: e.target.value })}
      />
      <div className="flex justify-end">
        <button
          className="bg-gray-500 text-white px-4 py-2 rounded mr-2 hover:bg-gray-600 transition-colors cursor-pointer hover:scale-105"
          onClick={() => setIsModalOpen(false)}
        >
          Cancel
        </button>
        <button
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors cursor-pointer hover:scale-105"
          onClick={() => handleSave(selectedQuestion.text)}
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default EmployeeEvaluationForm;
