import React, { useState } from 'react';

interface Question {
  id: number;
  text: string;
}

interface NewEvaluationFormProps {
  onSave?: () => void;
  onCancel?: () => void;
}

const NewEvaluationForm: React.FC<NewEvaluationFormProps> = ({ onSave, onCancel }) => {
  const [department, setDepartment] = useState<string>('Software');
  const [designation, setDesignation] = useState<string>('Senior Software Engineer');
  const [questions, setQuestions] = useState<Question[]>([
    { id: 1, text: "The company's training programs adequately prepare employees for their roles" },
    { id: 2, text: "The company's training programs adequately prepare employees for their roles" },
    { id: 3, text: "The company's training programs adequately prepare employees for their roles" },
  ]);

  const handleAddQuestion = () => {
    const newId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
    setQuestions([...questions, { id: newId, text: '' }]);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">New Evaluation Form</h1>

      {/* Department and Designation Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
          <div className="relative">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-4 py-2 appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="Software">Software</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Marketing">Marketing</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
          <div className="relative">
            <select
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-4 py-2 appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="Senior Software Engineer">Senior Software Engineer</option>
              <option value="Software Engineer">Software Engineer</option>
              <option value="Principal Engineer">Principal Engineer</option>
              <option value="Tech Lead">Tech Lead</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-medium text-gray-700">Questions</label>
          <button
            onClick={handleAddQuestion}
            className="bg-sky-500 text-white rounded-md px-4 py-2 flex items-center hover:bg-sky-600 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Add Question
          </button>
        </div>

        <div className="space-y-4">
          {questions.map((question, idx) => (
            <div key={question.id} className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <input
                type="text"
                value={question.text}
                onChange={(e) => {
                  const newQuestions = [...questions];
                  newQuestions[idx].text = e.target.value;
                  setQuestions(newQuestions);
                }}
                className="w-full bg-white border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Enter a question"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save and Cancel Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={onCancel}
          className="bg-gray-500 text-white px-8 py-2 rounded-md hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          className="bg-green-500 text-white px-8 py-2 rounded-md hover:bg-green-600 transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default NewEvaluationForm;
