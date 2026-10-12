import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5000/api';

const Annotate = () => {
    const [task, setTask] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [formData, setFormData] = useState({
        technicalCorrectness: 5,
        conceptCoverage: 5,
        relevance: 5,
        explanationQuality: 5,
        score: 5,
        notes: ''
    });

    const getToken = () => localStorage.getItem('token');

    const fetchTask = async () => {
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/annotations/pending`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            if (res.status === 403) {
                setError('You do not have annotator privileges. Contact an administrator.');
                setIsLoading(false);
                return;
            }
            if (res.status === 404) {
                setError('No pending answers to annotate right now.');
                setIsLoading(false);
                return;
            }
            if (!res.ok) throw new Error('Error fetching task');
            const data = await res.json();
            setTask(data);
            setFormData({
                technicalCorrectness: 5,
                conceptCoverage: 5,
                relevance: 5,
                explanationQuality: 5,
                score: 5,
                notes: ''
            });
        } catch (err) {
            setError('Error fetching annotation task.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTask();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === 'notes' ? value : parseInt(value, 10)
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/annotations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ answerId: task.answer_id, ...formData })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to submit');
            }
            alert('Annotation submitted successfully!');
            fetchTask();
        } catch (err) {
            alert(err.message || 'Failed to submit annotation.');
        }
    };

    if (isLoading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading next task...</div>;
    if (error && !task) return <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>{error}</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1.5rem', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#333' }}>Human Annotation Task</h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', color: '#555', marginBottom: '0.5rem' }}>Question:</h3>
                <div style={{ backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '4px', fontSize: '1.1rem', color: '#333', fontWeight: '500' }}>
                    {task.question}
                </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', color: '#555', marginBottom: '0.5rem' }}>Candidate Answer:</h3>
                <div style={{ backgroundColor: '#e3f2fd', padding: '1rem', borderRadius: '4px', fontSize: '1.1rem', color: '#333', whiteSpace: 'pre-wrap' }}>
                    {task.candidate_answer || '<No Answer Provided>'}
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {['technicalCorrectness', 'conceptCoverage', 'relevance', 'explanationQuality', 'score'].map(field => (
                    <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                            {field.replace(/([A-Z])/g, ' $1').trim()} (0-10): {formData[field]}
                        </label>
                        <input 
                            type="range" 
                            name={field} 
                            min="0" max="10" 
                            value={formData[field]} 
                            onChange={handleChange} 
                        />
                    </div>
                ))}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 'bold' }}>Notes (Optional)</label>
                    <textarea 
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '4px', minHeight: '100px', boxSizing: 'border-box' }}
                        placeholder="Any reasoning for this score..."
                    />
                </div>

                <button 
                    type="submit" 
                    style={{ padding: '1rem', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem' }}
                >
                    Submit Annotation
                </button>
            </form>
        </div>
    );
};

export default Annotate;
