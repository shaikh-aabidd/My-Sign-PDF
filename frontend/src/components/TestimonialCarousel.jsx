import React from 'react';

const testimonials = [
  { name: 'Alice', rating: 5, text: 'Perfect fit and amazing quality!', avatar: '/images/profile1.jpg' },
  { name: 'Bob', rating: 4, text: 'Great experience, will order again.', avatar: '/images/profile2.jpg' },
  { name: 'Carol', rating: 5, text: 'Lovely tailoring service!', avatar: '/images/profile3.jpg' },
];

const TestimonialCards = () => {
  return (
    <section className="py-12 bg-secondary-light-bg">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-secondary text-center mb-8">
          What Our Customers Say
        </h2>
        <div className="flex flex-wrap justify-center gap-6">
          {testimonials.map(({ name, rating, text, avatar }, index) => (
            <div
              key={index}
              className="flex flex-col md:flex-row items-center bg-white p-6 rounded-xl shadow-md max-w-md w-full md:w-[30%] transition-transform hover:scale-105"
            >
              <img
                src={avatar}
                alt={name}
                className="w-16 h-16 rounded-full mb-4 md:mb-0 md:mr-4 object-cover"
              />
              <div className="text-center md:text-left">
                <p className="text-gray-700 italic mb-2">“{text}”</p>
                <p className="font-semibold text-gray-900">{name}</p>
                <p className="text-yellow-500 text-sm">
                  {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialCards;
