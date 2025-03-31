require("dotenv").config();
const { Telegraf } = require("telegraf");
const axios = require("axios");

// Khởi tạo Telegram bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Hàm gọi Gemini API
async function callGemini(promptText) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await axios.post(
      GEMINI_ENDPOINT,
      {
        contents: [
          {
            parts: [{ text: promptText }],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const result = response.data;
    const generatedText =
      result?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "🤖 Không có phản hồi.";
    return generatedText;
  } catch (error) {
    console.error("❌ Lỗi gọi Gemini:", error.response?.data || error.message);
    return "🚨 Lỗi khi gọi Gemini API.";
  }
}

// Xử lý khi user bắt đầu
bot.start((ctx) =>
  ctx.reply("👋 Xin chào! Tôi là bot Gemini. Hãy hỏi gì đó nhé 😎")
);

// Xử lý tin nhắn văn bản
bot.on("message", async (ctx) => {
  const message = ctx.message;

  // Bỏ qua tin nhắn từ chính bot để tránh loop
  if (message.from.is_bot) return;

  const userText = message.text || "";
  const chatId = ctx.chat.id;

  // Kiểm tra xem tin nhắn có bắt đầu bằng /gemini không
  if (!userText.toLowerCase().startsWith("@conmeoden")) {
    return;
  }

  // Lấy nội dung câu hỏi sau từ khóa /gemini
  const question = userText.slice(8).trim();

  if (!question) {
    ctx.reply(
      "Vui lòng nhập câu hỏi sau từ khóa /gemini\nVí dụ: /gemini Hôm nay thời tiết thế nào?"
    );
    return;
  }

  const response = await callGemini(question);
  const sender = ctx.message.from.first_name;

  ctx.telegram.sendMessage(
    chatId,
    `🐱 Con mèo trắng có bộ lông đen nói cho bạn ${sender} nghe:\n\n${response}`
  );
});

// Khởi chạy bot
bot.launch({
  dropPendingUpdates: true,
  allowedUpdates: ["message"],
});

// Xử lý graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

// Xử lý lỗi
bot.catch((err, ctx) => {
  console.error(`❌ Lỗi cho ${ctx.updateType}:`, err);
});

console.log("🤖 Telegram bot Gemini đang hoạt động!");
