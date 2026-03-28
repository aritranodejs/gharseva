const FAQ = require('../../models/FAQ');

const seedFAQs = async () => {
  await FAQ.deleteMany({});
  await FAQ.create([
    { question: 'How do I book a service?', answer: 'Select a service from the home screen, pick a slot, and confirm. A professional will be assigned and notified.', category: 'Booking' },
    { question: 'What is the "Deliver in 60 mins" promise?', answer: 'We aim to dispatch the nearest professional to your home within 60 minutes for express cleaning or repairs.', category: 'Services' },
    { question: 'How can I pay for services?', answer: 'We support UPI, Cards, and Cash on Delivery. All online payments are handled securely via Razorpay.', category: 'Payments' },
    { question: 'Can I cancel my booking?', answer: 'Yes, you can cancel for free up to 2 hours before the scheduled time. Later cancellations might attract a small fee.', category: 'Refunds' },
    { question: 'Are the professionals verified?', answer: 'Yes, every GharSeva partner undergoes a strict 3-step background check (Aadhaar, Criminal Records, and Skills Assessment).', category: 'Safety' },
    { question: 'How do service packages work?', answer: 'Packages bundle multiple services (like cleaning + laundry) at a discounted rate compared to booking individually.', category: 'Packages' },
    { question: 'What if I am not satisfied with the work?', answer: 'We offer a 100% satisfaction guarantee. If the job is not up to the mark, we will rework for free or provide a refund.', category: 'Service Quality' }
  ]);
};

module.exports = seedFAQs;
