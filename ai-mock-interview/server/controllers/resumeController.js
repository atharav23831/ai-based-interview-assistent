import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import pool from '../config/db.js';

// Extract text from all pages of a PDF buffer
async function extractTextFromPDF(buffer) {
    const uint8 = new Uint8Array(buffer);
    const doc = await getDocument({ data: uint8, useSystemFonts: true }).promise;
    const pages = [];
    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        pages.push(content.items.map(item => item.str).join(' '));
    }
    return pages.join('\n').trim();
}

export const uploadResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Resume PDF is required' });
        }

        const extractedText = await extractTextFromPDF(req.file.buffer);

        if (!extractedText) {
            return res.status(400).json({ error: 'Could not extract text from the resume' });
        }

        const result = await pool.query(
            'INSERT INTO resumes (user_id, file_name, extracted_text) VALUES ($1, $2, $3) RETURNING id, file_name, created_at',
            [req.user.id, req.file.originalname, extractedText]
        );

        const resume = result.rows[0];

        res.status(201).json({
            message: 'Resume uploaded successfully',
            resume: {
                id: resume.id,
                file_name: resume.file_name,
                created_at: resume.created_at
            },
            extractedText
        });
    } catch (error) {
        console.error('Error uploading resume:', error.message);
        res.status(500).json({ error: 'Server error processing resume' });
    }
};
