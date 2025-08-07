import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  AcademicCapIcon,
  ClockIcon,
  ArrowLeftIcon,
  EyeIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { getAllForms, getFormResponses } from '../services/api';
import { exportResponsesToCSV } from '../utils/export';

const GlobalAnalytics = () => {
  const [forms, setForms] = useState([]);
  const [allResponses, setAllResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGlobalData();
  }, []);

  const loadGlobalData = async () => {
    try {
      const formsData = await getAllForms();
      setForms(formsData);

      // Load responses for all forms
      const responsePromises = formsData.map(form => 
        getFormResponses(form._id).catch(() => [])
      );
      const responsesArrays = await Promise.all(responsePromises);
      
      // Combine all responses with form info
      const allResponsesWithFormInfo = [];
      responsesArrays.forEach((responses, index) => {
        const form = formsData[index];
        responses.forEach(response => {
          allResponsesWithFormInfo.push({
            ...response,
            formTitle: form.title,
            formId: form._id
          });
        });
      });
      
      setAllResponses(allResponsesWithFormInfo);
    } catch (error) {
      console.error('Failed to load global analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateGlobalAnalytics = () => {
    if (!allResponses.length) return null;

    const totalResponses = allResponses.length;
    const totalForms = forms.length;
    const avgScore = allResponses.reduce((sum, r) => sum + (r.score || 0), 0) / totalResponses;
    const maxPossibleScore = allResponses.reduce((sum, r) => sum + (r.maxScore || 0), 0) / totalResponses;
    const avgTime = allResponses.reduce((sum, r) => sum + (r.timeSpent || 0), 0) / totalResponses;
    
    const formsWithResponses = forms.filter(form => 
      allResponses.some(response => response.formId === form._id)
    ).length;

    const responsesByForm = forms.map(form => {
      const formResponses = allResponses.filter(r => r.formId === form._id);
      const avgFormScore = formResponses.length > 0 
        ? formResponses.reduce((sum, r) => sum + (r.score || 0), 0) / formResponses.length 
        : 0;
      const maxFormScore = formResponses.length > 0 
        ? formResponses[0]?.maxScore || 0 
        : 0;
      
      return {
        ...form,
        responseCount: formResponses.length,
        avgScore: Math.round(avgFormScore * 10) / 10,
        maxScore: maxFormScore,
        successRate: maxFormScore > 0 ? Math.round((avgFormScore / maxFormScore) * 100) : 0
      };
    });

    // Recent activity (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentResponses = allResponses.filter(r => 
      new Date(r.submittedAt) > weekAgo
    ).length;

    return {
      totalResponses,
      totalForms,
      avgScore: Math.round(avgScore * 10) / 10,
      maxPossibleScore: Math.round(maxPossibleScore * 10) / 10,
      avgTime: Math.round(avgTime),
      formsWithResponses,
      responsesByForm,
      recentResponses
    };
  };

  const analytics = calculateGlobalAnalytics();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading global analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Global Analytics</h1>
              <p className="text-gray-600 mt-1">Overview of all your forms and responses</p>
            </div>
          </div>
          <div className="flex space-x-3">
            {allResponses.length > 0 && (
              <button
                onClick={() => exportResponsesToCSV(allResponses, 'all-responses')}
                className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span>Export All</span>
              </button>
            )}
            <Link
              to="/"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <DocumentTextIcon className="h-4 w-4" />
              <span>All Forms</span>
            </Link>
          </div>
        </div>

        {analytics ? (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Forms</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalForms}</p>
                    <p className="text-xs text-gray-400">
                      {analytics.formsWithResponses} with responses
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserGroupIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Responses</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalResponses}</p>
                    <p className="text-xs text-gray-400">
                      {analytics.recentResponses} this week
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AcademicCapIcon className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Average Score</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics.avgScore}/{analytics.maxPossibleScore}
                    </p>
                    <p className="text-xs text-gray-400">
                      {Math.round((analytics.avgScore / analytics.maxPossibleScore) * 100)}% success rate
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClockIcon className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Avg. Completion Time</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.floor(analytics.avgTime / 60)}m {analytics.avgTime % 60}s
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Forms Performance */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Form Performance</h3>
                <p className="text-gray-600 mt-1">Response counts and success rates for each form</p>
              </div>
              <div className="divide-y divide-gray-200">
                {analytics.responsesByForm
                  .sort((a, b) => b.responseCount - a.responseCount)
                  .map((form) => (
                    <div key={form._id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium text-gray-900">{form.title}</h4>
                            <span className="text-sm text-gray-500">
                              {form.questions?.length || 0} questions
                            </span>
                          </div>
                          {form.description && (
                            <p className="text-gray-600 text-sm mt-1 line-clamp-1">
                              {form.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{form.responseCount}</div>
                            <div className="text-xs text-gray-500">responses</div>
                          </div>
                          {form.responseCount > 0 && (
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${
                                form.successRate >= 80 ? 'text-green-600' :
                                form.successRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {form.successRate}%
                              </div>
                              <div className="text-xs text-gray-500">success rate</div>
                            </div>
                          )}
                          <div className="flex space-x-2">
                            <Link
                              to={`/analytics/${form._id}`}
                              className="flex items-center space-x-1 px-3 py-2 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors text-sm"
                            >
                              <ChartBarIcon className="h-4 w-4" />
                              <span>Details</span>
                            </Link>
                            <Link
                              to={`/form/${form._id}`}
                              className="flex items-center space-x-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm"
                            >
                              <EyeIcon className="h-4 w-4" />
                              <span>Preview</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress bar for response count */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Response volume</span>
                          <span>{form.responseCount} total</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ 
                              width: `${Math.min((form.responseCount / Math.max(...analytics.responsesByForm.map(f => f.responseCount))) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Responses</h3>
                <p className="text-gray-600 mt-1">Latest submissions across all forms</p>
              </div>
              <div className="divide-y divide-gray-200">
                {allResponses
                  .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
                  .slice(0, 10)
                  .map((response) => (
                    <div key={response._id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium text-gray-900">{response.submitterName}</h4>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-600">{response.formTitle}</span>
                          </div>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-gray-500">{response.submitterEmail}</span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">
                              {new Date(response.submittedAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {response.score}/{response.maxScore}
                            </div>
                            <div className="text-xs text-gray-500">
                              {Math.round((response.score / response.maxScore) * 100)}%
                            </div>
                          </div>
                          <Link
                            to={`/analytics/${response.formId}`}
                            className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                {allResponses.length === 0 && (
                  <div className="p-6 text-center text-gray-500">
                    No responses yet. Create and share your forms to start collecting data.
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChartBarIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Data Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first form and start collecting responses to see analytics.
            </p>
            <Link
              to="/editor"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <DocumentTextIcon className="h-5 w-5" />
              <span>Create First Form</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalAnalytics;
