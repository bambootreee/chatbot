const chatBody = document.getElementById('chat-body');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Hiển thị tin nhắn của người dùng
function displayUserMessage(message) {
    const userMessage = document.createElement('div');
    userMessage.className = 'user-message';
    userMessage.innerText = message;
    chatBody.appendChild(userMessage);
    chatBody.scrollTop = chatBody.scrollHeight;
}

// Hiển thị tin nhắn của bot (bao gồm cả "Đang trả lời..." khi đang chờ phản hồi)
function displayBotMessage(message, isLoading = false) {
    const botMessage = document.createElement('div');
    botMessage.className = 'bot-message';

    if (isLoading) {
        botMessage.classList.add('loading'); // Thêm lớp loading để áp dụng hiệu ứng
        botMessage.innerText = 'Đang trả lời'; // Hiển thị "Đang trả lời"
    } else {
        botMessage.innerText = message;
    }

    chatBody.appendChild(botMessage);
    chatBody.scrollTop = chatBody.scrollHeight;

    return botMessage; // Trả về đối tượng tin nhắn để có thể thay đổi sau
}

// Gửi câu hỏi đến backend và nhận câu trả lời
async function sendMessage(message) {
    try {
        // Hiển thị thông báo "Đang trả lời..."
        const loadingMessage = displayBotMessage('', true); // Hiển thị "Đang trả lời..."

        // Gửi yêu cầu đến backend
        const response = await fetch('http://localhost:3000/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ question: message }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        // Lấy câu trả lời từ backend
        const data = await response.json();
        const chatbotResponse = data.answer;

        // Thay thế "Đang trả lời..." bằng câu trả lời thực tế
        loadingMessage.innerText = chatbotResponse; // Thay đổi nội dung của thông báo "Đang trả lời..."
        loadingMessage.classList.remove('loading'); // Loại bỏ lớp "loading" để ngừng hiệu ứng động
    } catch (error) {
        console.error('Error:', error);
        displayBotMessage('Có lỗi xảy ra, vui lòng thử lại sau.');
    }
}

// Thêm sự kiện khi nhấn nút gửi
sendButton.addEventListener('click', () => {
    const message = userInput.value.trim();
    if (message !== '') {
        displayUserMessage(message);
        sendMessage(message);
        userInput.value = '';
    }
});

// Thêm sự kiện khi nhấn Enter
userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendButton.click();
    }
});


// Lời chào ban đầu
displayBotMessage('Xin chào! Tôi có thể giúp gì cho bạn?');
