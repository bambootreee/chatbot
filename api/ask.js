const fs = require('fs');
const csvParser = require('csv-parser');
const Fuse = require('fuse.js');
const axios = require('axios');

// Đọc dữ liệu từ file CSV
const dataset = [];
fs.createReadStream('dataset.csv')
    .pipe(csvParser())
    .on('data', (row) => {
        dataset.push({
            id: row.id,
            title: row.title,
            content: row.content,
        });
    })
    .on('end', () => {
        console.log('CSV file successfully processed.');
        initFuse(); // Khởi tạo Fuse.js sau khi dataset được tải đầy đủ
    });

let fuse = null;

// Khởi tạo Fuse.js cho việc tìm kiếm
function initFuse() {
    fuse = new Fuse(dataset, {
        keys: ['title', 'content'],  // Tìm kiếm trong title và content
        threshold: 0.3,  // Độ tương thích tìm kiếm (càng thấp càng chính xác)
    });
}

// Hàm tìm kiếm với Fuse.js
function searchData(query) {
    if (!fuse) return null;

    const results = fuse.search(query);

    if (results.length > 0) {
        return results[0].item;
    } else {
        return null;
    }
}

// OpenAI API setup
const OPENAI_API_KEY = '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';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Tìm kiếm nội dung phù hợp từ dataset
function getRelevantContent(query) {
    const results = fuse.search(query);
    if (results.length > 0) {
        return results[0].item; // Trả về bài viết đầu tiên tìm được
    }
    return null;
}

// Truy vấn OpenAI API để lấy câu trả lời khi không có nội dung trong dataset
async function getAnswerFromOpenAI(question, context = '') {
    try {
        const response = await axios.post(
            OPENAI_API_URL,
            {
                model: 'gpt-4', // Sử dụng GPT-4
                messages: [
                    {
                        role: 'system',
                        content: 'Bạn là một trợ lý hữu ích và bạn sẽ luôn trả lời bằng tiếng Việt.'
                    },
                    { role: 'user', content: `Câu hỏi: ${question}` },
                    { role: 'user', content: context ? `Bối cảnh: ${context}` : '' }
                ],
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                },
            }
        );
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Lỗi khi truy vấn OpenAI:', error);
        return 'Xin lỗi, tôi gặp lỗi khi xử lý yêu cầu của bạn.';
    }
}

// Xử lý API /ask
module.exports = async (req, res) => {
    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ error: 'Question is required.' });
    }

    // Tìm kiếm trong dataset
    const relevantContent = searchData(question);
    if (relevantContent) {
        // Nếu tìm thấy nội dung liên quan, trả về câu trả lời
        return res.json({ answer: relevantContent.content || ''});
    }

    // Nếu không tìm thấy, truy vấn OpenAI
    const answer = await getAnswerFromOpenAI(question);
    return res.json({ answer });
};
