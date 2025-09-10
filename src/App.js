import React, { useEffect, useState, useRef } from 'react';
import { Analytics } from '@vercel/analytics/react';
import './App.css';

function App() {
  const [numSubjects, setNumSubjects] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [cgpa, setCgpa] = useState(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [percentage, setPercentage] = useState(null);
  const resultRef = useRef(null);
  const subjectsRef = useRef(null);
  const [studentName, setStudentName] = useState('');
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return 'light';
  });

  useEffect(() => {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);


  const gradeMapping = {
    'Ex': 10,
    'A': 9,
    'B': 8,
    'C': 7,
    'D': 6,
    'E': 5,
    'F': 0
  };

  const handleNumSubjectsChange = (e) => {
    const num = parseInt(e.target.value);
    setNumSubjects(num);
    
    if (num > 0) {
      const newSubjects = Array.from({ length: num }, (_, index) => ({
        id: index,
        name: `Subject ${index + 1}`,
        grade: '',
        credits: '',
        excluded: false
      }));
      setSubjects(newSubjects);
      setShowCalculator(true);
      // Scroll to subjects section after rendering
      setTimeout(() => {
        if (subjectsRef.current) {
          subjectsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 0);
    } else {
      setSubjects([]);
      setShowCalculator(false);
    }
    setCgpa(null);
    setPercentage(null);
  };

  const handleSubjectChange = (index, field, value) => {
    const updatedSubjects = subjects.map((subject, i) => 
      i === index ? { ...subject, [field]: value } : subject
    );
    setSubjects(updatedSubjects);
    setCgpa(null);
    setPercentage(null);
  };

  const calculateCGPA = () => {
    let totalGradePoints = 0;
    let totalCredits = 0;
    let isValid = true;
    let includedSubjects = 0;

    subjects.forEach(subject => {
      // Skip excluded subjects
      if (subject.excluded) {
        return;
      }

      if (!subject.grade || !subject.credits) {
        isValid = false;
        return;
      }
      
      const gradePoint = gradeMapping[subject.grade];
      const credits = parseFloat(subject.credits);
      
      if (gradePoint !== undefined && credits > 0) {
        totalGradePoints += gradePoint * credits;
        totalCredits += credits;
        includedSubjects++;
      } else {
        isValid = false;
      }
    });

    if (isValid && totalCredits > 0 && includedSubjects > 0) {
      const calculatedCGPA = totalGradePoints / totalCredits;
      setCgpa(calculatedCGPA.toFixed(2));
      // Calculate percentage (CGPA * 9.5 is a common conversion)
      const calculatedPercentage = (calculatedCGPA * 9.5).toFixed(2);
      setPercentage(calculatedPercentage);
      // Smooth scroll to results
      setTimeout(() => {
        if (resultRef.current) {
          resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 0);
    } else {
      alert('Please fill in all non-excluded fields with valid values');
    }
  };

  const resetCalculator = () => {
    setNumSubjects('');
    setSubjects([]);
    setCgpa(null);
    setPercentage(null);
    setShowCalculator(false);
  };

  const saveToLocalStorage = () => {
    const data = {
      numSubjects,
      subjects,
      cgpa,
      percentage,
      studentName,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cgpaData', JSON.stringify(data));
    alert('Data saved successfully!');
  };


  const loadFromLocalStorage = () => {
    const savedData = localStorage.getItem('cgpaData');
    if (savedData) {
      const data = JSON.parse(savedData);
      setNumSubjects(data.numSubjects);
      setSubjects(data.subjects);
      setCgpa(data.cgpa);
      setPercentage(data.percentage);
      setStudentName(data.studentName || '');
      setShowCalculator(true);
      // Auto scroll to subjects if data is present
      setTimeout(() => {
        if (subjectsRef.current) {
          subjectsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 0);
    } else {
      alert('No saved data found!');
    }
  };

  const buildReportHtml = () => {
    const included = subjects.filter(s => !s.excluded);
    const date = new Date().toLocaleString();
    return `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>CGPA_Report${studentName ? '_' + studentName.replace(/[^a-z0-9-]/gi, '_') : ''}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #1a202c; }
          h1 { margin: 0 0 4px 0; font-size: 28px; }
          h2 { margin: 24px 0 12px 0; font-size: 20px; }
          .muted { color: #4a5568; }
          .header { display:flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px; }
          .summary { display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin: 12px 0 20px; }
          .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
          .value { font-size: 24px; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
          th { background: #f7fafc; }
          .footer { margin-top: 24px; font-size: 12px; color: #718096; }

          /* Print styles for better mobile Save as PDF */
          @page { size: A4; margin: 16mm; }
          @media print {
            body { padding: 0; }
            .header { page-break-after: avoid; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>CGPA Report</h1>
            <div class="muted">Generated on ${date}</div>
          </div>
          <div class="muted">${studentName ? 'Student: ' + studentName : ''}</div>
        </div>
        <div class="summary">
          <div class="card">
            <div class="muted">CGPA</div>
            <div class="value">${cgpa ?? '-'}</div>
          </div>
        </div>
        <h2>Subjects Included</h2>
        <table>
          <thead><tr><th>#</th><th>Subject</th><th>Grade</th><th>Credits</th></tr></thead>
          <tbody>
            ${included.map((s, i) => `<tr><td>${i + 1}</td><td>${s.name}</td><td>${s.grade}</td><td>${s.credits}</td></tr>`).join('')}
          </tbody>
        </table>
        <div class="footer">Excluded subjects are omitted from this report.</div>
      </body>
    </html>`;
  };

  const exportToPDF = () => {
    const html = buildReportHtml();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    const fileSafeName = `CGPA_Report${studentName ? '_' + studentName.replace(/[^a-z0-9-]/gi, '_') : ''}.pdf`;
    try {
      printWindow.document.title = fileSafeName;
    } catch {}
    printWindow.focus();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const exportToDoc = () => {
    const html = buildReportHtml();
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fileSafeName = studentName ? studentName.replace(/[^a-z0-9-]/gi, '_') : 'cgpa_report';
    a.href = url;
    a.download = `${fileSafeName}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="App">
      <Analytics />
      <div className="top-controls">
        <a
          href="https://www.linkedin.com/in/bhanu-chandra-kolluru-195474232/"
          className="linkedin-fab"
          aria-label="LinkedIn Profile"
          title="LinkedIn Profile"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </a>
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="theme-fab"
          aria-label="Toggle theme"
          title={theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
        >
          {theme === 'light' ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
              <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.8 1.42-1.42zm10.48 0l1.79-1.8 1.41 1.41-1.8 1.79-1.4-1.4zM12 4V1h-1v3h1zm0 19v-3h-1v3h1zm8-8h3v-1h-3v1zM1 12H4v-1H1v1zm15.24 7.16l1.8 1.79 1.41-1.41-1.79-1.8-1.42 1.42zM4.84 17.24l-1.79 1.8 1.41 1.41 1.8-1.79-1.42-1.42zM12 7a5 5 0 100 10 5 5 0 000-10z"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
              <path d="M20.742 13.045A8.002 8.002 0 0110.955 3.258 8.5 8.5 0 1020.742 13.045z"/>
            </svg>
          )}
        </button>
      </div>
      <div className="container">
        <header className="header">
          <h1 className="title">CGPA Calculator</h1>
          <p className="subtitle">Calculate your Cumulative Grade Point Average</p>
        </header>

        {/* Moved Grade Reference under Advanced Features as collapsible */}

        <div className="calculator-section">
          <div className="input-group">
            <label htmlFor="studentName">Student Name:</label>
            <input
              type="text"
              id="studentName"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter your name"
              className="num-input"
            />
          </div>
          <div className="input-group">
            <label htmlFor="numSubjects">Number of Subjects:</label>
            <input
              type="number"
              id="numSubjects"
              value={numSubjects}
              onChange={handleNumSubjectsChange}
              min="1"
              max="20"
              placeholder="Enter number of subjects"
              className="num-input"
            />
          </div>

          <div className="advanced-features">
            <h4>Advanced Features</h4>
            <div className="advanced-buttons">
              <button onClick={saveToLocalStorage} className="save-btn">
                Save Data
              </button>
              <button onClick={loadFromLocalStorage} className="load-btn">
                Load Data
              </button>
              <button onClick={exportToPDF} className="export-btn pdf">
                Export / Print PDF
              </button>
              <button onClick={exportToDoc} className="export-btn doc">
                Export DOC
              </button>
            </div>

            <details className="grade-reference">
              <summary>Grade Reference Table</summary>
              <div className="grade-table">
                {Object.entries(gradeMapping).map(([grade, points]) => (
                  <div key={grade} className="grade-item">
                    <span className="grade">{grade}</span>
                    <span className="points">{points}</span>
                  </div>
                ))}
              </div>
            </details>
          </div>

          {showCalculator && (
            <div className="subjects-container" ref={subjectsRef}>
              <h3>Enter Subject Details</h3>
              <div className="subjects-grid">
                {subjects.map((subject, index) => (
                  <div key={subject.id} className={`subject-card ${subject.excluded ? 'excluded' : ''}`}>
                    <div className="subject-header">
                      <div className="subject-name-section">
                        <input
                          type="text"
                          value={subject.name}
                          onChange={(e) => handleSubjectChange(index, 'name', e.target.value)}
                          className="subject-name-input"
                          placeholder="Enter subject name"
                        />
                      </div>
                      <div className="exclude-checkbox">
                        <input
                          type="checkbox"
                          id={`exclude-${subject.id}`}
                          checked={subject.excluded}
                          onChange={(e) => handleSubjectChange(index, 'excluded', e.target.checked)}
                          className="exclude-input"
                        />
                        <label htmlFor={`exclude-${subject.id}`} className="exclude-label">
                          Exclude from CGPA
                        </label>
                      </div>
                    </div>
                    {!subject.excluded && (
                      <div className="input-row">
                        <div className="input-group">
                          <label>Grade:</label>
                          <select
                            value={subject.grade}
                            onChange={(e) => handleSubjectChange(index, 'grade', e.target.value)}
                            className="grade-select"
                          >
                            <option value="">Select Grade</option>
                            {Object.keys(gradeMapping).map(grade => (
                              <option key={grade} value={grade}>{grade}</option>
                            ))}
                          </select>
                        </div>
                        <div className="input-group">
                          <label>Credits:</label>
                          <input
                            type="number"
                            value={subject.credits}
                            onChange={(e) => handleSubjectChange(index, 'credits', e.target.value)}
                            min="1"
                            max="10"
                            step="0.5"
                            placeholder="Credits"
                            className="credits-input"
                          />
                        </div>
                      </div>
                    )}
                    {subject.excluded && (
                      <div className="excluded-message">
                        <span>This subject will be excluded from CGPA calculation</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="action-buttons">
                <button onClick={calculateCGPA} className="calculate-btn">
                  Calculate CGPA
                </button>
                <button onClick={resetCalculator} className="reset-btn">
                  Reset
                </button>
              </div>

              {cgpa && (
                <div className="result" ref={resultRef}>
                  <h3>Your Results</h3>
                  <div className="results-grid">
                    <div className="result-item">
                      <div className="result-label">CGPA</div>
                      <div className="result-value cgpa-value">{cgpa}</div>
                      <div className="result-unit">out of 10</div>
                    </div>
                    <div className="result-item">
                      <div className="result-label">Percentage</div>
                      <div className="result-value percentage-value">{percentage}%</div>
                      <div className="result-unit">approximate</div>
                    </div>
                  </div>
                  <div className="grade-analysis">
                    <h4>Grade Analysis</h4>
                    <div className="grade-stats">
                      {Object.entries(gradeMapping).map(([grade, points]) => {
                        const count = subjects.filter(s => !s.excluded && s.grade === grade).length;
                        if (count > 0) {
                          return (
                            <div key={grade} className="grade-stat">
                              <span className="grade">{grade}</span>
                              <span className="count">{count} subject{count > 1 ? 's' : ''}</span>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="formula-section">
          <h3>CGPA Formula</h3>
          <div className="formula">
            <p>CGPA = Σ(Grade × Credits) / Σ(Credits)</p>
            <p className="formula-explanation">
              Where: Grade is the grade point (Ex=10, A=9, B=8, C=7, D=6, E=5, F=0)
            </p>
          </div>
        </div>
      </div>
      <footer className="footer">
        <span>Made with love </span>
        <a href="https://bhanuchandra.dev" className="footer-link" target="_blank" rel="noopener noreferrer">Bhanuchandra</a>
      </footer>
    </div>
  );
}

export default App;
