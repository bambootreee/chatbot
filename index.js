const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const dotenv = require('dotenv');
const Fuse = require('fuse.js');
const cors = require('cors');
const fs = require('fs');
const csvParser = require('csv-parser');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Cung cấp file HTML và các tài nguyên tĩnh
app.use(express.static(path.join(__dirname, 'public')));


// Enable CORS for all routes
app.use(cors());
app.use(bodyParser.json());

// Đọc dữ liệu từ file CSV (ví dụ: dataset.csv)
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
       // searchData('D3 quá liều');
    });

// // Khởi tạo Fuse.js cho việc tìm kiếm
// const fuse = new Fuse(dataset, {
//     keys: ['title', 'content'],
//     threshold: 0.6, // Tolerance for search
// });
// const dataset = [
//     { title: "D3 quá liều", content: "Thông tin về vitamin D3 quá liều" },
//     { title: "Vitamin C", content: "Thông tin về vitamin C" }
// ];
// Hàm tìm kiếm với Fuse.js
function searchData(query) {
    const fuse = new Fuse(dataset, {
        keys: ['title', 'content'],  // Tìm kiếm trong title và content
        threshold: 0.3  // Độ tương thích tìm kiếm (càng thấp càng chính xác)
    });

    // Tìm kiếm trong dataset với query
    const results = fuse.search(query);

    // Log kết quả
    if (results.length > 0) {
        return results[0].item;
    } else {
        return null;
    }
}
// OpenAI API setup
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Tìm kiếm nội dung phù hợp từ dataset
function getRelevantContent(query) {
    const results = fuse.search(query);
    console.log('query',query)
    console.log('results',results)
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
                // max_tokens: 200, // Điều chỉnh số lượng token nếu cần
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


// API route để xử lý câu hỏi
app.post('/ask', async (req, res) => {
    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ error: 'Question is required.' });
    }

    // Tìm kiếm trong dataset
    const relevantContent = searchData(question);
    console.log('Relevant Content:', relevantContent); // Kiểm tra kết quả tìm kiếm

    if (relevantContent) {
        // Nếu tìm thấy nội dung liên quan, trả về câu trả lời
        return res.json({ answer: relevantContent.content || ''});
    }

    // Nếu không tìm thấy, truy vấn OpenAI
    const answer = await getAnswerFromOpenAI(question);
    res.json({ answer });
});

// Khởi động server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
