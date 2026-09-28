import { useEffect, useState } from "react";

type Summary = {
  total: number;
  applied: number;
  assessment: number;
  interview: number;
  offer: number;
  rejected: number;
};

type JobApplication = {
  id: number;
  company: string;
  job_title: string;
  status: string;
  application_date: string | null;
  source: string | null;
  job_url: string | null;
  notes: string | null;
};

function App() {
  const [summary, setSummary] = useState<Summary>({
    total: 0,
    applied: 0,
    assessment: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
  });

  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [editingApplicationId, setEditingApplicationId] = useState<
    number | null
  >(null);

  const [selectedApplication, setSelectedApplication] =
    useState<JobApplication | null>(null);

  const [newApplication, setNewApplication] = useState({
    company: "",
    job_title: "",
    status: "Applied",
    application_date: "",
    source: "",
    job_url: "",
    notes: "",
  });

  useEffect(() => {
    fetch("http://127.0.0.1:8000/dashboard/summary")
      .then((response) => response.json())
      .then((data) => setSummary(data))
      .catch((error) => console.error("Error loading summary:", error));

    fetch("http://127.0.0.1:8000/applications")
      .then((response) => response.json())
      .then((data) => setApplications(data))
      .catch((error) => console.error("Error loading applications:", error));
  }, []);

  const refreshSummary = async () => {
    const summaryResponse = await fetch(
      "http://127.0.0.1:8000/dashboard/summary",
    );

    const summaryData = await summaryResponse.json();
    setSummary(summaryData);
  };

  const resetForm = () => {
    setNewApplication({
      company: "",
      job_title: "",
      status: "Applied",
      application_date: "",
      source: "",
      job_url: "",
      notes: "",
    });

    setEditingApplicationId(null);
  };

  const handleOpenAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEditApplication = (application: JobApplication) => {
    setEditingApplicationId(application.id);

    setNewApplication({
      company: application.company,
      job_title: application.job_title,
      status: application.status,
      application_date: application.application_date || "",
      source: application.source || "",
      job_url: application.job_url || "",
      notes: application.notes || "",
    });

    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleSaveApplication = async () => {
    try {
      const payload = {
        ...newApplication,
        application_date: newApplication.application_date || null,
        source: newApplication.source || null,
        job_url: newApplication.job_url || null,
        notes: newApplication.notes || null,
      };

      const isEditing = editingApplicationId !== null;

      const url = isEditing
        ? `http://127.0.0.1:8000/applications/${editingApplicationId}`
        : "http://127.0.0.1:8000/applications";

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          isEditing
            ? "Failed to update application"
            : "Failed to save application",
        );
      }

      const savedApplication = await response.json();

      if (isEditing) {
        setApplications((current) =>
          current.map((application) =>
            application.id === editingApplicationId
              ? savedApplication
              : application,
          ),
        );
      } else {
        setApplications((current) => [...current, savedApplication]);
      }

      await refreshSummary();
      handleCloseForm();
    } catch (error) {
      console.error("Error saving application:", error);
    }
  };

  const handleDeleteApplication = async (applicationId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this application?",
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/applications/${applicationId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete application");
      }

      setApplications((current) =>
        current.filter((application) => application.id !== applicationId),
      );

      await refreshSummary();
    } catch (error) {
      console.error("Error deleting application:", error);
    }
  };

  const filteredApplications = applications.filter((application) => {
    const searchValue = search.toLowerCase();

    const matchesSearch =
      application.company.toLowerCase().includes(searchValue) ||
      application.job_title.toLowerCase().includes(searchValue);

    const matchesStatus =
      statusFilter === "" || application.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>Job Tracker</h2>

        <nav>
          <p>Dashboard</p>
          <p>Applications</p>
          <p onClick={handleOpenAddForm}>Add Application</p>
          <p>Email Sync</p>
        </nav>
      </aside>

      <main className="main-content">
        <h1>Dashboard</h1>
        <p>Track and manage your job applications.</p>

        <div className="stats">
          <div className="card">
            <h3>{summary.total}</h3>
            <p>Total Applications</p>
          </div>

          <div className="card">
            <h3>{summary.applied}</h3>
            <p>Applied</p>
          </div>

          <div className="card">
            <h3>{summary.assessment}</h3>
            <p>Assessments</p>
          </div>

          <div className="card">
            <h3>{summary.interview}</h3>
            <p>Interviews</p>
          </div>

          <div className="card">
            <h3>{summary.offer}</h3>
            <p>Offers</p>
          </div>

          <div className="card">
            <h3>{summary.rejected}</h3>
            <p>Rejections</p>
          </div>
        </div>

        <div className="applications-section">
          <div className="section-header">
            <h2>Job Applications</h2>
          </div>

          <div className="table-controls">
            <input
              type="text"
              placeholder="Search company or job title"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Applied">Applied</option>
              <option value="Assessment">Assessment</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
            </select>

            <button type="button" onClick={handleOpenAddForm}>
              Add Application
            </button>
          </div>

          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Job Title</th>
                <th>Status</th>
                <th>Application Date</th>
                <th>Source</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredApplications.map((application) => (
                <tr
                  key={application.id}
                  className="clickable-row"
                  onClick={() => setSelectedApplication(application)}
                >
                  <td>{application.company}</td>
                  <td>{application.job_title}</td>
                  <td>{application.status}</td>
                  <td>{application.application_date || "-"}</td>
                  <td>{application.source || "-"}</td>

                  <td>
                    <div className="action-buttons">
                      <button
                        type="button"
                        className="edit-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditApplication(application);
                        }}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="delete-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteApplication(application.id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredApplications.length === 0 && (
                <tr>
                  <td colSpan={6} className="no-results">
                    No applications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>
                {editingApplicationId
                  ? "Edit Application"
                  : "Add New Application"}
              </h2>

              <button
                type="button"
                className="close-button"
                onClick={handleCloseForm}
              >
                ×
              </button>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label>Company</label>
                <input
                  type="text"
                  value={newApplication.company}
                  onChange={(e) =>
                    setNewApplication({
                      ...newApplication,
                      company: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-field">
                <label>Job Title</label>
                <input
                  type="text"
                  value={newApplication.job_title}
                  onChange={(e) =>
                    setNewApplication({
                      ...newApplication,
                      job_title: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-field">
                <label>Status</label>
                <select
                  value={newApplication.status}
                  onChange={(e) =>
                    setNewApplication({
                      ...newApplication,
                      status: e.target.value,
                    })
                  }
                >
                  <option value="Applied">Applied</option>
                  <option value="Assessment">Assessment</option>
                  <option value="Interview">Interview</option>
                  <option value="Offer">Offer</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="form-field">
                <label>Application Date</label>
                <input
                  type="date"
                  value={newApplication.application_date}
                  onChange={(e) =>
                    setNewApplication({
                      ...newApplication,
                      application_date: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-field">
                <label>Source</label>
                <input
                  type="text"
                  value={newApplication.source}
                  onChange={(e) =>
                    setNewApplication({
                      ...newApplication,
                      source: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-field">
                <label>Job URL</label>
                <input
                  type="text"
                  value={newApplication.job_url}
                  onChange={(e) =>
                    setNewApplication({
                      ...newApplication,
                      job_url: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-field full-width">
                <label>Notes</label>
                <textarea
                  value={newApplication.notes}
                  onChange={(e) =>
                    setNewApplication({
                      ...newApplication,
                      notes: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={handleCloseForm}
              >
                Cancel
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={handleSaveApplication}
              >
                {editingApplicationId
                  ? "Update Application"
                  : "Save Application"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedApplication && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Application Details</h2>

              <button
                type="button"
                className="close-button"
                onClick={() => setSelectedApplication(null)}
              >
                ×
              </button>
            </div>

            <div className="details-grid">
              <div>
                <strong>Company</strong>
                <p>{selectedApplication.company}</p>
              </div>

              <div>
                <strong>Job Title</strong>
                <p>{selectedApplication.job_title}</p>
              </div>

              <div>
                <strong>Status</strong>
                <p>{selectedApplication.status}</p>
              </div>

              <div>
                <strong>Application Date</strong>
                <p>{selectedApplication.application_date || "-"}</p>
              </div>

              <div>
                <strong>Source</strong>
                <p>{selectedApplication.source || "-"}</p>
              </div>

              <div>
                <strong>Job URL</strong>
                <p>
                  {selectedApplication.job_url ? (
                    <a
                      href={selectedApplication.job_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open Job Posting
                    </a>
                  ) : (
                    "-"
                  )}
                </p>
              </div>

              <div className="full-width">
                <strong>Notes</strong>
                <p>{selectedApplication.notes || "-"}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
