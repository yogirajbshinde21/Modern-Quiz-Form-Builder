import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FormList from './components/FormList';
import FormEditor from './components/FormEditor';
import FormRenderer from './components/FormRenderer';
import FormAnalytics from './components/FormAnalytics';
import GlobalAnalytics from './components/GlobalAnalytics';
import ResponseAnalytics from './components/ResponseAnalytics';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<FormList />} />
          <Route path="/editor" element={<FormEditor />} />
          <Route path="/editor/:formId" element={<FormEditor />} />
          <Route path="/form/:formId" element={<FormRenderer />} />
          <Route path="/analytics/:formId" element={<FormAnalytics />} />
          <Route path="/analytics" element={<GlobalAnalytics />} />
          <Route path="/response/:formId/:responseId" element={<ResponseAnalytics />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
