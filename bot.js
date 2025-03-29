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

// Hàm escape MarkdownV2 để tránh lỗi format Telegram
function escapeMarkdownV2(text) {
  return text
    .replace(/_/g, "\\_")
    .replace(/\*/g, "\\*")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/~/g, "\\~")
    .replace(/`/g, "\\`")
    .replace(/>/g, "\\>")
    .replace(/#/g, "\\#")
    .replace(/\+/g, "\\+")
    .replace(/-/g, "\\-")
    .replace(/=/g, "\\=")
    .replace(/\|/g, "\\|")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/\./g, "\\.")
    .replace(/!/g, "\\!");
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

  const response = await callGemini(userText);
  ctx.telegram.sendMessage(chatId, `🤖 Gemini nói:\n\n${response}`);
});

// Khởi chạy bot
bot.launch();
console.log("🤖 Telegram bot Gemini đang hoạt động!");
