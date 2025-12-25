import React, { useState } from 'react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { Mail, Phone, MapPin } from 'lucide-react';
import SEO from '../components/common/SEO';
import { useToast } from '../hooks/useToast';

const ContactPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = 'Full Name is required.';
    if (!formData.email.trim()) {
      newErrors.email = 'Email Address is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email address is invalid.';
    }
    if (!formData.message.trim()) newErrors.message = 'Message is required.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    if (errors[e.target.id]) {
      setErrors({ ...errors, [e.target.id]: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('Form submitted:', formData);
    addToast('Your message has been sent successfully!', 'success');
    setFormData({ name: '', email: '', message: '' });
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <SEO 
        title="Contact Us"
        description="Get in touch with the Tripzy Lifestyle Adventures team. We'd love to hear from you!"
      />
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-serif text-primary mb-4">Get In Touch</h1>
          <p className="text-lg text-gray-700 mb-12">
            Have a question, suggestion, or just want to say hello? We'd love to hear from you!
          </p>
        </div>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                <input type="text" id="name" value={formData.name} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary ${errors.name ? 'border-red-500' : 'border-gray-300'}`} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                <input type="email" id="email" value={formData.email} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary ${errors.email ? 'border-red-500' : 'border-gray-300'}`} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                <textarea id="message" value={formData.message} onChange={handleChange} rows={5} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary ${errors.message ? 'border-red-500' : 'border-gray-300'}`}></textarea>
                {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-primary text-white py-3 rounded-md hover:bg-blue-800 transition-colors disabled:bg-opacity-70 disabled:cursor-not-allowed">
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          </div>
          <div className="space-y-8">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-12 w-12 bg-primary text-white rounded-full flex items-center justify-center">
                <Mail size={24} />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold">Email</h3>
                <p className="text-gray-600">contact@tripzyadventures.com</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-12 w-12 bg-primary text-white rounded-full flex items-center justify-center">
                <Phone size={24} />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold">Phone</h3>
                <p className="text-gray-600">(123) 456-7890</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-12 w-12 bg-primary text-white rounded-full flex items-center justify-center">
                <MapPin size={24} />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold">Address</h3>
                <p className="text-gray-600">123 Adventure Lane, Wanderlust City, 90210</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;