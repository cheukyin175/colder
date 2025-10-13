import React from "react"
import "./styles/global.css"

function IndexPopup() {
  return (
    <div className="w-96 p-4">
      <h1 className="text-xl font-bold text-linkedin-blue mb-4">
        Colder - LinkedIn Outreach Assistant
      </h1>
      <div className="space-y-4">
        <p className="text-gray-600">
          Visit a LinkedIn profile to generate personalized outreach messages.
        </p>
        <button className="btn-primary w-full">
          Get Started
        </button>
      </div>
    </div>
  )
}

export default IndexPopup