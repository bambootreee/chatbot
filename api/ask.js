// api/ask.js
const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;  // Lấy OpenAI API Key từ biến môi trường
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Hàm xử lý yêu cầu POST từ người dùng
module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' }); // Chỉ cho phép phương thức POST
    }

    const { question } = req.body; // Lấy câu hỏi từ body của request

    if (!question) {
        return res.status(400).json({ error: 'Question is required.' }); // Nếu không có câu hỏi, trả về lỗi
    }

    try {
        // Gửi yêu cầu tới OpenAI API
        const response = await axios.post(
            OPENAI_API_URL,
            {
                model: 'gpt-4', // Dùng GPT-4
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: `Question: ${question}` },
                ],
                max_tokens: 200, // Điều chỉnh số lượng token (nếu cần)
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                },
            }
        );

        // Trả về câu trả lời từ OpenAI
        const answer = response.data.choices[0].message.content;
        return res.status(200).json({ answer });

    } catch (error) {
        console.error('Error fetching from OpenAI:', error);
        return res.status(500).json({ error: 'Error while processing your request.' });
    }
};
