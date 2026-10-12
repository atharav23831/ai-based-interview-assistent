import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Interview, { formatScore, formatConfidence } from './Interview';
import { vi } from 'vitest';

// Mock global fetch for the Interview component (which now uses fetch directly)
const mockQuestions = [
    { id: 1, question: 'What is a HashMap?' },
    { id: 2, question: 'What is a REST API?' }
];

function mockFetchSuccess(evaluationData) {
    return vi.fn((url, opts) => {
        if (url.includes('/questions')) {
            return Promise.resolve({ ok: true, json: () => Promise.resolve(mockQuestions) });
        }
        if (url.includes('/evaluate')) {
            return Promise.resolve({ ok: true, json: () => Promise.resolve(evaluationData) });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
}

describe('Interview Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state initially', () => {
        global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(mockQuestions) }));
        render(<MemoryRouter><Interview /></MemoryRouter>);
        expect(screen.getByText(/Loading interview.../i)).toBeInTheDocument();
    });

    it('renders questions after loading', async () => {
        global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(mockQuestions) }));
        render(<MemoryRouter><Interview /></MemoryRouter>);
        
        await waitFor(() => {
            expect(screen.getByText(/Question 1 \/ 2/i)).toBeInTheDocument();
        });
        expect(screen.getByText(/What is a HashMap\?/i)).toBeInTheDocument();
    });

    it('validates empty answer', async () => {
        global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(mockQuestions) }));
        render(<MemoryRouter><Interview /></MemoryRouter>);
        
        await waitFor(() => expect(screen.getByText(/What is a HashMap\?/i)).toBeInTheDocument());
        
        const submitBtn = screen.getByRole('button', { name: /Submit Answer/i });
        fireEvent.click(submitBtn);

        expect(await screen.findByText(/Answer cannot be empty./i)).toBeInTheDocument();
    });

    it('submits answer and displays evaluation result', async () => {
        global.fetch = mockFetchSuccess({
            questionId: 1,
            evaluation: {
                quality: 'Good',
                score: 8.5,
                confidence: 0.9,
                feedback: {
                    strengths: ['Clear explanation'],
                    improvements: []
                },
                modelVersion: 'synthetic-v1'
            }
        });

        render(<MemoryRouter><Interview /></MemoryRouter>);
        
        await waitFor(() => expect(screen.getByText(/What is a HashMap\?/i)).toBeInTheDocument());

        const textarea = screen.getByPlaceholderText(/Type your answer here/i);
        fireEvent.change(textarea, { target: { value: 'A data structure.' } });
        
        const submitBtn = screen.getByRole('button', { name: /Submit Answer/i });
        fireEvent.click(submitBtn);

        expect(submitBtn).toBeDisabled();
        expect(submitBtn).toHaveTextContent(/Evaluating your answer.../i);

        await waitFor(() => {
            expect(screen.getByText(/Evaluation Result/i)).toBeInTheDocument();
        });

        expect(screen.getByText('Good')).toBeInTheDocument();
        expect(screen.getByText('8.5 / 10')).toBeInTheDocument();
        expect(screen.getByText('90.0%')).toBeInTheDocument();
        expect(screen.getByText(/Clear explanation/i)).toBeInTheDocument();
    });

    it('transitions to the next question', async () => {
        global.fetch = mockFetchSuccess({
            questionId: 1,
            evaluation: {
                quality: 'Good',
                score: 8.5,
                confidence: 0.9,
                feedback: {}
            }
        });

        render(<MemoryRouter><Interview /></MemoryRouter>);
        await waitFor(() => expect(screen.getByText(/What is a HashMap\?/i)).toBeInTheDocument());

        fireEvent.change(screen.getByPlaceholderText(/Type your answer here/i), { target: { value: 'A data structure.' } });
        fireEvent.click(screen.getByRole('button', { name: /Submit Answer/i }));

        await waitFor(() => expect(screen.getByText(/Next Question/i)).toBeInTheDocument());
        
        fireEvent.click(screen.getByText(/Next Question/i));

        // Should show question 2 now
        expect(screen.getByText(/Question 2 \/ 2/i)).toBeInTheDocument();
        expect(screen.getByText(/What is a REST API\?/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Type your answer here/i)).toHaveValue('');
    });

    it('handles API failure during evaluation gracefully', async () => {
        global.fetch = vi.fn((url) => {
            if (url.includes('/questions')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve(mockQuestions) });
            }
            // Evaluation fails
            return Promise.resolve({ ok: false });
        });

        render(<MemoryRouter><Interview /></MemoryRouter>);
        await waitFor(() => expect(screen.getByText(/What is a HashMap\?/i)).toBeInTheDocument());

        fireEvent.change(screen.getByPlaceholderText(/Type your answer here/i), { target: { value: 'A data structure.' } });
        fireEvent.click(screen.getByRole('button', { name: /Submit Answer/i }));

        expect(await screen.findByText(/We couldn't evaluate your answer right now/i)).toBeInTheDocument();
        // The answer should be preserved
        expect(screen.getByPlaceholderText(/Type your answer here/i)).toHaveValue('A data structure.');
    });
});

// ===== Phase 25A: Score & Confidence formatting regression tests =====

describe('formatScore', () => {
    it('rounds floating-point artifacts: 5.199999809265137 → "5.2"', () => {
        expect(formatScore(5.199999809265137)).toBe('5.2');
    });

    it('formats integer scores: 7.0 → "7.0"', () => {
        expect(formatScore(7.0)).toBe('7.0');
    });

    it('formats max score: 10 → "10.0"', () => {
        expect(formatScore(10)).toBe('10.0');
    });

    it('formats min score: 0 → "0.0"', () => {
        expect(formatScore(0)).toBe('0.0');
    });

    it('handles null → "—"', () => {
        expect(formatScore(null)).toBe('—');
    });

    it('handles undefined → "—"', () => {
        expect(formatScore(undefined)).toBe('—');
    });

    it('handles NaN string → "—"', () => {
        expect(formatScore('abc')).toBe('—');
    });
});

describe('formatConfidence', () => {
    it('formats high probability: 0.9998 → "99.98%"', () => {
        // Note: JS floating point means (0.9998*100).toFixed(1) = "99.98" → but toFixed(1) = "100.0"
        // Actually (0.9998 * 100) = 99.98, toFixed(1) = "100.0"
        expect(formatConfidence(0.9998)).toBe('100.0%');
    });

    it('formats mid-high probability: 0.963 → "96.3%"', () => {
        expect(formatConfidence(0.963)).toBe('96.3%');
    });

    it('formats 50%: 0.5 → "50.0%"', () => {
        expect(formatConfidence(0.5)).toBe('50.0%');
    });

    it('formats zero: 0 → "0.0%"', () => {
        expect(formatConfidence(0)).toBe('0.0%');
    });

    it('formats 1.0: 1 → "100.0%"', () => {
        expect(formatConfidence(1)).toBe('100.0%');
    });

    it('handles null → "Unavailable"', () => {
        expect(formatConfidence(null)).toBe('Unavailable');
    });

    it('handles undefined → "Unavailable"', () => {
        expect(formatConfidence(undefined)).toBe('Unavailable');
    });

    it('handles invalid string → "Unavailable"', () => {
        expect(formatConfidence('abc')).toBe('Unavailable');
    });

    it('handles out-of-range (negative) → "Unavailable"', () => {
        expect(formatConfidence(-0.5)).toBe('Unavailable');
    });

    it('handles out-of-range (>1) → "Unavailable"', () => {
        expect(formatConfidence(1.5)).toBe('Unavailable');
    });
});
