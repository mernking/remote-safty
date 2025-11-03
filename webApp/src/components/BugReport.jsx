"use client"

import { useState } from "react"
import { AlertCircle, Upload } from "lucide-react"

export default function BugReport() {
  const [formData, setFormData] = useState({
    title: "",
    severity: "medium",
    description: "",
    steps: "",
    email: "",
    attachment: null,
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleFileChange = (e) => {
    setFormData({ ...formData, attachment: e.target.files[0] })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Bug report submitted:", formData)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mx-auto mb-4 text-white">
            <AlertCircle size={24} />
          </div>
          <h1 className="section-title">Report a Bug</h1>
          <p className="section-subtitle">Help us improve Saftz by reporting any issues you encounter</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text mb-2">Bug Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Brief description of the bug"
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Severity Level *</label>
                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="low">Low - Minor inconvenience</option>
                  <option value="medium">Medium - Affects functionality</option>
                  <option value="high">High - Major issue</option>
                  <option value="critical">Critical - System breaking</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Your Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the bug in detail..."
                rows="4"
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                required
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Steps to Reproduce</label>
              <textarea
                name="steps"
                value={formData.steps}
                onChange={handleChange}
                placeholder="1. Click on...&#10;2. Then...&#10;3. Bug occurs..."
                rows="4"
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Attachment (Screenshot/Video)</label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-input"
                  accept="image/*,video/*"
                />
                <label htmlFor="file-input" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-text-light mx-auto mb-2" />
                  <p className="text-text-light">Click to upload or drag and drop</p>
                  <p className="text-xs text-text-light mt-1">PNG, JPG, MP4 up to 10MB</p>
                  {formData.attachment && (
                    <p className="text-sm text-primary mt-2 font-semibold">{formData.attachment.name}</p>
                  )}
                </label>
              </div>
            </div>

            <button type="submit" className="w-full btn-primary">
              Submit Bug Report
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-text-light">
              <strong>Thank you!</strong> We review all bug reports and will contact you if we need more information.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
