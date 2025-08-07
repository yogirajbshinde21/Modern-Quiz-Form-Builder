import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon, 
  DocumentDuplicateIcon,
  ChartBarIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { getAllForms, deleteForm, saveForm, getAllResponses } from '../services/api';
import { exportResponsesToCSV } from '../utils/export';

const FormList = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      const formsData = await getAllForms();
      setForms(formsData);
    } catch (error) {
      console.error('Failed to load forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteForm = async (formId) => {
    if (!window.confirm('Are you sure you want to delete this form?')) {
      return;
    }

    try {
      await deleteForm(formId);
      setForms(forms.filter(form => form._id !== formId));
    } catch (error) {
      console.error('Failed to delete form:', error);
      alert('Failed to delete form');
    }
  };

  const exportAllResponses = async () => {
    try {
      const responses = await getAllResponses();
      if (responses.length === 0) {
        alert('No responses to export');
        return;
      }
      exportResponsesToCSV(responses, 'all-responses');
    } catch (error) {
      console.error('Failed to export responses:', error);
      alert('Failed to export responses');
    }
  };

  const duplicateForm = async (form) => {
    try {
      const newForm = {
        ...form,
        title: `${form.title} (Copy)`,
        _id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        isPublished: false
      };
      
      const savedForm = await saveForm(newForm);
      await loadForms(); // Reload the forms list
    } catch (error) {
      console.error('Failed to duplicate form:', error);
      alert('Failed to duplicate form');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading forms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Forms</h1>
            <p className="text-gray-600 mt-2">Create and manage interactive forms</p>
          </div>
          <Link
            to="/editor"
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Create New Form</span>
          </Link>
        </div>

        {/* Forms Grid */}
        {forms.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PlusIcon className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No forms yet</h3>
              <p className="text-gray-600 mb-6">
                Get started by creating your first interactive form with our unique question types.
              </p>
              <Link
                to="/editor"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Create Your First Form</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form) => (
              <div key={form._id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                {/* Form Header Image */}
                {form.headerImage ? (
                  <img 
                    src={form.headerImage} 
                    alt="Form header" 
                    className="w-full h-40 object-cover rounded-t-lg"
                  />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="text-3xl font-bold mb-1">{form.title.charAt(0)}</div>
                      <div className="text-sm opacity-80">Form</div>
                    </div>
                  </div>
                )}

                <div className="p-6">
                  {/* Form Title & Description */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                      {form.title || 'Untitled Form'}
                    </h3>
                    {form.description && (
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {form.description}
                      </p>
                    )}
                  </div>

                  {/* Form Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>{form.questions?.length || 0} questions</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      form.isPublished 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {form.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {/* Primary Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/form/${form._id}`}
                        className="flex items-center space-x-1 px-2 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-xs flex-shrink-0"
                        title="Preview Form"
                      >
                        <EyeIcon className="h-3.5 w-3.5" />
                        <span>Preview</span>
                      </Link>
                      <Link
                        to={`/editor/${form._id}`}
                        className="flex items-center space-x-1 px-2 py-1.5 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors text-xs flex-shrink-0"
                        title="Edit Form"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </Link>
                      <Link
                        to={`/analytics/${form._id}`}
                        className="flex items-center space-x-1 px-2 py-1.5 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors text-xs flex-shrink-0"
                        title="View Analytics"
                      >
                        <ChartBarIcon className="h-3.5 w-3.5" />
                        <span>Analytics</span>
                      </Link>
                    </div>

                    {/* Secondary Actions */}
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => duplicateForm(form)}
                          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                          title="Duplicate Form"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteForm(form._id)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete Form"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Created Date */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                      Created {new Date(form.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="font-medium text-gray-900 mb-1">Import from JSON</div>
              <div className="text-sm text-gray-600">Upload a form configuration file</div>
            </button>
            <Link
              to="/analytics"
              className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors block"
            >
              <div className="flex items-center space-x-2 text-gray-900 font-medium mb-1">
                <ChartBarIcon className="h-4 w-4" />
                <span>Global Analytics</span>
              </div>
              <div className="text-sm text-gray-600">See overall response statistics</div>
            </Link>
            <button 
              onClick={exportAllResponses}
              className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-2 text-gray-900 font-medium mb-1">
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span>Export Responses</span>
              </div>
              <div className="text-sm text-gray-600">Download submission data as CSV</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormList;
