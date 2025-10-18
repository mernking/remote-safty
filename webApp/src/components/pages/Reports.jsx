import { useState, useEffect } from 'react';
import { Download, FileText, TrendingUp, Calendar, Filter } from 'lucide-react';

const Reports = () => {
  const [reportType, setReportType] = useState('combined');
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [siteFilter, setSiteFilter] = useState('');
  const [generating, setGenerating] = useState(false);
  const [sites, setSites] = useState([]);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await fetch('/api/v1/sites', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setSites(data.sites || []);
        }
      } catch (error) {
        console.error('Failed to fetch sites:', error);
      }
    };

    fetchSites();
  }, []);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const params = new URLSearchParams({
        type: 'csv',
        reportType,
        from: dateRange.from,
        to: dateRange.to,
        ...(siteFilter && { siteId: siteFilter })
      });

      const response = await fetch(`/api/v1/reports/export?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `safety-report-${reportType}-${dateRange.from}-to-${dateRange.to}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to generate report:', errorData.message || 'Unknown error');
        alert('Failed to generate report: ' + (errorData.message || 'Please try again'));
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const reportTypes = [
    {
      id: 'combined',
      name: 'Combined Report',
      description: 'All safety activities in one report',
      icon: FileText,
      color: 'text-primary'
    },
    {
      id: 'inspections',
      name: 'Inspection Report',
      description: 'Safety inspection records',
      icon: TrendingUp,
      color: 'text-success'
    },
    {
      id: 'incidents',
      name: 'Incident Report',
      description: 'Safety incidents and near-misses',
      icon: Calendar,
      color: 'text-error'
    },
    {
      id: 'toolbox-talks',
      name: 'Toolbox Talks Report',
      description: 'Safety training sessions',
      icon: FileText,
      color: 'text-secondary'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-base-content">Reports</h1>
        <p className="text-base-content/70 mt-2">
          Generate comprehensive safety compliance reports.
        </p>
      </div>

      {/* Report Configuration */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title">Report Configuration</h2>

          {/* Report Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {reportTypes.map((type) => (
              <div
                key={type.id}
                className={`card cursor-pointer transition-all ${
                  reportType === type.id
                    ? 'bg-primary/10 border-primary'
                    : 'bg-base-200 hover:bg-base-300'
                }`}
                onClick={() => setReportType(type.id)}
              >
                <div className="card-body p-4">
                  <div className="flex items-center gap-3">
                    <type.icon className={`w-6 h-6 ${type.color}`} />
                    <div>
                      <h3 className="font-semibold">{type.name}</h3>
                      <p className="text-sm text-base-content/70">{type.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">From Date</span>
              </label>
              <input
                type="date"
                className="input input-bordered"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">To Date</span>
              </label>
              <input
                type="date"
                className="input input-bordered"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Site (Optional)</span>
              </label>
              <select
                className="select select-bordered"
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value)}
              >
                <option value="">All Sites</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <div className="card-actions justify-end mt-6">
            <button
              onClick={handleGenerateReport}
              disabled={generating}
              className="btn btn-primary gap-2"
            >
              <Download className="w-4 h-4" />
              {generating ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Report Preview/Info */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Report Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="stat">
              <div className="stat-title">Report Type</div>
              <div className="stat-value text-lg">
                {reportTypes.find(t => t.id === reportType)?.name}
              </div>
              <div className="stat-desc">
                {reportTypes.find(t => t.id === reportType)?.description}
              </div>
            </div>

            <div className="stat">
              <div className="stat-title">Date Range</div>
              <div className="stat-value text-lg">
                {new Date(dateRange.from).toLocaleDateString()} - {new Date(dateRange.to).toLocaleDateString()}
              </div>
              <div className="stat-desc">
                {Math.ceil((new Date(dateRange.to) - new Date(dateRange.from)) / (1000 * 60 * 60 * 24))} days
              </div>
            </div>

            <div className="stat">
              <div className="stat-title">Site Filter</div>
              <div className="stat-value text-lg">
                {siteFilter ? 'Specific Site' : 'All Sites'}
              </div>
              <div className="stat-desc">Scope of the report</div>
            </div>
          </div>

          {/* Report Features */}
          <div className="divider">Report Features</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Included Data:</h3>
              <ul className="list-disc list-inside text-sm text-base-content/70 space-y-1">
                <li>All safety activities within date range</li>
                <li>User attribution and timestamps</li>
                <li>Site location information</li>
                <li>Status and severity indicators</li>
                <li>Attachment counts and metadata</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Export Format:</h3>
              <ul className="list-disc list-inside text-sm text-base-content/70 space-y-1">
                <li>CSV format for easy analysis</li>
                <li>Compatible with Excel and Google Sheets</li>
                <li>Automatic filename with date range</li>
                <li>UTF-8 encoding for international characters</li>
                <li>Ready for compliance reporting</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title">Quick Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card bg-base-200">
              <div className="card-body text-center">
                <h3 className="font-semibold">Last 7 Days</h3>
                <p className="text-sm text-base-content/70 mb-4">Recent safety activities</p>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    setDateRange({
                      from: sevenDaysAgo.toISOString().split('T')[0],
                      to: new Date().toISOString().split('T')[0]
                    });
                    setReportType('combined');
                    setTimeout(() => handleGenerateReport(), 100);
                  }}
                >
                  Generate
                </button>
              </div>
            </div>

            <div className="card bg-base-200">
              <div className="card-body text-center">
                <h3 className="font-semibold">Last 30 Days</h3>
                <p className="text-sm text-base-content/70 mb-4">Monthly safety overview</p>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                    setDateRange({
                      from: thirtyDaysAgo.toISOString().split('T')[0],
                      to: new Date().toISOString().split('T')[0]
                    });
                    setReportType('combined');
                    setTimeout(() => handleGenerateReport(), 100);
                  }}
                >
                  Generate
                </button>
              </div>
            </div>

            <div className="card bg-base-200">
              <div className="card-body text-center">
                <h3 className="font-semibold">Current Month</h3>
                <p className="text-sm text-base-content/70 mb-4">This month's activities</p>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    const now = new Date();
                    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    setDateRange({
                      from: firstDayOfMonth.toISOString().split('T')[0],
                      to: new Date().toISOString().split('T')[0]
                    });
                    setReportType('combined');
                    setTimeout(() => handleGenerateReport(), 100);
                  }}
                >
                  Generate
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;