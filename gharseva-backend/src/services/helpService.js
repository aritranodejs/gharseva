const helpRepository = require('../repositories/helpRepository');

class HelpService {
  async getFaqs() {
    const faqs = await helpRepository.findAllFaqs();
    if (faqs.length === 0) {
      return [
        { _id: '1', question: 'How do I book a service?', answer: 'Simply select your desired category from the home screen, choose a specific service, and pick a convenient time slot. Our system will match you with the best professional nearby.', category: 'Booking' },
        { _id: '2', question: 'Are the professionals verified?', answer: 'Absolutely. Every professional on GharSeva undergo a rigorous background check, including Aadhaar verification and police clearance, to ensure your safety and quality of service.', category: 'Safety' },
        { _id: '3', question: 'What happens if I cancel a job?', answer: 'You can cancel a job before the professional starts. However, frequent cancellations may affect your platform rating. Please refer to our cancellation policy in the Privacy & Terms section.', category: 'Policies' }
      ];
    }
    return faqs;
  }

  async getPrivacyPolicy() {
    return {
      title: 'Privacy Policy & Terms of Service',
      lastUpdated: 'March 2026',
      content: `Welcome to GharSeva. We are committed to protecting your personal data and ensuring a safe platform for all.

1. DATA PROTECTION: We implement advanced encryption to secure your identity documents and personal information. All payment data is handled by PCI-DSS compliant providers.

2. SERVICE STANDARDS: GharSeva professionals are vetted through a rigorous verification process. We maintain strict quality control to ensure excellence in every service booked through our platform.

3. USER RESPONSIBILITIES: Users must provide accurate information and maintain professional conduct. Misuse of the platform may result in account suspension.

4. UPDATES: We may periodically update these terms to reflect service improvements or legal requirements.

By continuing to use GharSeva, you agree to these comprehensive terms of service.`
    };
  }
}

module.exports = new HelpService();
