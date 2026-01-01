import React, { useState } from 'react';
import { MdAdd, MdRemove, MdKeyboardArrowDown } from 'react-icons/md';
import './FAQSection.css';

const faqData = [
    {
        answer: 'Gram Pragati Setu is a digital platform under PM–AJAY designed to monitor village development, track projects, collect villager feedback, and enable transparent coordination between officials, volunteers, and departments.',
        question: 'What is the Gram Pragati Setu Portal?',
    },
    {
        answer: 'Villagers can raise issues, submit surveys, give voice-based feedback, check local projects, and use the mobile app offline. Their inputs helps identify priority needs in the village.',
        question: 'What services does the portal offer to villagers?',
    },
    {
        answer: 'Volunteers verify villager issues, upload checkpoint photos for ongoing projects, support offline data collection, and help officers monitor real progress at the village level.',
        question: 'What is the role of volunteers?',
    },
    {
        answer: 'Each sanctioned project gets a dedicated workspace showing checkpoints, a horizontal progress tracker, documents, photos, and updates. Public progress can also be viewed through a QR code.',
        question: 'How does project tracking work?',
    },
    {
        answer: 'Projects automatically connect to relevant departments—Education for school projects and Health for medical infrastructure. Departments can chat, share documents, and provide technical support within the workspace.',
        question: 'What is the Department Linkage feature?',
    },
    {
        answer: 'The system calculates a score based on amenities, gaps, public feedback, and project progress to assess the village’s readiness to become an Adarsh Gram under PM–AJAY.',
        question: 'What is the Adarsh Village Score?',
    },
    {
        answer: 'The portal collects villagers’ skills (mason, tailor, driver, etc.) and matches them to local government projects and employment opportunities to promote livelihood development.',
        question: 'What is the Skill & Employment Feature?',
    },
    {
        answer: 'Yes. The system supports multiple Indian languages, voice input, and offline form submissions. Data automatically syncs to the server once internet connectivity is available.',
        question: 'Does the portal support multilingual and offline usage?',
    },
];

const FAQSection: React.FC = () => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [isListOpen, setIsListOpen] = useState<boolean>(false);

    const toggleFAQ = (index: number) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    const toggleList = () => {
        setIsListOpen(!isListOpen);
    };

    return (
        <section className="faq-section">
            <div className="faq-container">
                <div className="faq-header" onClick={toggleList}>
                    <div className="header-content">
                        <h2>Frequently Asked Questions</h2>
                        <span className={`header-toggle-icon ${isListOpen ? 'open' : ''}`}>
                            <MdKeyboardArrowDown />
                        </span>
                    </div>
                    <div className="faq-underline"></div>
                </div>

                <div
                    className={`faq-grid-wrapper ${isListOpen ? 'open' : ''}`}
                    style={{
                        maxHeight: isListOpen ? '2000px' : '0',
                        opacity: isListOpen ? 1 : 0,
                        overflow: 'hidden',
                        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                >
                    <div className="faq-grid">
                        {faqData.map((item, index) => (
                            <div
                                key={index}
                                className={`faq-item ${activeIndex === index ? 'active' : ''}`}
                                onClick={() => toggleFAQ(index)}
                            >
                                <div className="faq-question">
                                    <h3>{item.question}</h3>
                                    <span className="faq-icon">
                                        {activeIndex === index ? <MdRemove /> : <MdAdd />}
                                    </span>
                                </div>
                                <div
                                    className="faq-answer"
                                    style={{
                                        maxHeight: activeIndex === index ? '200px' : '0',
                                        opacity: activeIndex === index ? 1 : 0,
                                    }}
                                >
                                    <p>{item.answer}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FAQSection;
