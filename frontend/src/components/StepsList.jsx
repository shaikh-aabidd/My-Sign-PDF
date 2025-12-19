import React from 'react';

const steps = [
  { title: 'Measure', description: 'Enter your measurements online', icon: 'images/measure.jpg' },
  { title: 'Select Tailor', description: 'Choose from verified tailors', icon: 'images/tailor2.jpg' },
  { title: 'Deliver', description: 'Enjoy your handcrafted garment', icon: 'images/delivery.jpg' },
];

const StepsList = () => (
  <section className="py-12 bg-neutral-default">
    <div className="container mx-auto px-4">
      <h2 className="text-2xl font-bold text-primary mb-8 text-center">How It Works</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map(step => (
          <div key={step.title} className="flex flex-col items-center text-center p-4 bg-white rounded-xl shadow">
            <img src={step.icon} alt={step.title} className="w-25 h-25 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
            <p className="text-gray-700 mt-2">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default StepsList;
