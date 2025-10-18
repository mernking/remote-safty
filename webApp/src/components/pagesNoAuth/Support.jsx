"use client"

import { useState } from "react"
import { ChevronDown, Search, BookOpen, MessageSquare, Zap } from "lucide-react"

export default function Support() {
  const [openFaq, setOpenFaq] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

  const faqs = [
    {
      question: "How do I get started with Saftz?",
      answer:
        "Sign up for a free account, invite your team, and start logging safety incidents immediately. Our onboarding guide will walk you through the setup process.",
    },
    {
      question: "Is my data secure?",
      answer:
        "Yes, we use bank-level encryption (AES-256) and comply with GDPR, HIPAA, and SOC 2 standards. All data is backed up daily.",
    },
    {
      question: "Can I use Saftz offline?",
      answer: "Saftz works seamlessly offline. Your data syncs automatically when connectivity is restored.",
    },
    {
      question: "What integrations does Saftz support?",
      answer:
        "We integrate with Slack, Microsoft Teams, Google Workspace, and popular HR systems. Custom integrations are available for enterprise plans.",
    },
    {
      question: "How much does Saftz cost?",
      answer:
        "We offer flexible pricing starting at $99/month for small teams. Enterprise plans are available with custom pricing.",
    },
    {
      question: "Do you offer training and support?",
      answer: "Yes! We provide 24/7 email support, video tutorials, and dedicated onboarding for enterprise customers.",
    },
  ]

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="section-title">Support Center</h1>
          <p className="section-subtitle">Find answers and get help when you need it</p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow cursor-pointer">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4 text-white">
              <BookOpen size={24} />
            </div>
            <h3 className="font-semibold mb-2">Documentation</h3>
            <p className="text-text-light text-sm">Read our comprehensive guides and tutorials</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow cursor-pointer">
            <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mx-auto mb-4 text-white">
              <MessageSquare size={24} />
            </div>
            <h3 className="font-semibold mb-2">Live Chat</h3>
            <p className="text-text-light text-sm">Chat with our support team in real-time</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow cursor-pointer">
            <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mx-auto mb-4 text-white">
              <Zap size={24} />
            </div>
            <h3 className="font-semibold mb-2">Status Page</h3>
            <p className="text-text-light text-sm">Check system status and incidents</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-4 text-text-light" size={20} />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-2xl font-bold text-text">Frequently Asked Questions</h2>
          </div>

          <div className="divide-y divide-border">
            {filteredFaqs.map((faq, idx) => (
              <div key={idx} className="border-b border-border last:border-b-0">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="font-semibold text-text">{faq.question}</span>
                  <ChevronDown
                    size={20}
                    className={`text-primary transition-transform ${openFaq === idx ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === idx && <div className="px-6 py-4 bg-gray-50 text-text-light">{faq.answer}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center">
          <p className="text-text-light mb-4">Didn't find what you're looking for?</p>
          <a href="/contact" className="btn-primary inline-block">
            Contact Support
          </a>
        </div>
      </div>
    </div>
  )
}
