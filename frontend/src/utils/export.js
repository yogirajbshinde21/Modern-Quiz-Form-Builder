export const exportResponsesToCSV = (responses, formTitle = 'form') => {
  if (!responses || responses.length === 0) {
    alert('No responses to export');
    return;
  }

  // Get all unique question IDs from all responses
  const allQuestionIds = new Set();
  responses.forEach(response => {
    if (response.answers) {
      Object.keys(response.answers).forEach(questionId => {
        allQuestionIds.add(questionId);
      });
    }
  });

  const questionIdsArray = Array.from(allQuestionIds);

  // Create CSV headers
  const headers = [
    'Name',
    'Email', 
    'Score',
    'Max Score',
    'Percentage',
    'Time Spent (seconds)',
    'Submitted At',
    ...questionIdsArray.map(id => `Question ${id}`)
  ];

  // Create CSV rows
  const rows = responses.map(response => {
    const row = [
      response.submitterName || '',
      response.submitterEmail || '',
      response.score || 0,
      response.maxScore || 0,
      response.maxScore > 0 ? Math.round((response.score / response.maxScore) * 100) : 0,
      response.timeSpent || 0,
      new Date(response.submittedAt).toLocaleString(),
    ];

    // Add question answers
    questionIdsArray.forEach(questionId => {
      const answer = response.answers[questionId];
      if (answer === null || answer === undefined) {
        row.push('');
      } else if (typeof answer === 'object') {
        row.push(JSON.stringify(answer));
      } else if (Array.isArray(answer)) {
        row.push(answer.join('; '));
      } else {
        row.push(String(answer));
      }
    });

    return row;
  });

  // Convert to CSV format
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${formTitle}-responses-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportFormToJSON = (form) => {
  const dataStr = JSON.stringify(form, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${form.title || 'form'}-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
};
