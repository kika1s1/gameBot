import TelegramBot from "node-telegram-bot-api";

import dotenv from "dotenv";
dotenv.config();
import User from "./model/User.js";
import connectDB from "./config/db.js";
const TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });
connectDB();

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `Dear ${msg.chat.first_name} Welcome to kika1s1bot`
  );
});

bot.onText(/\/register/, async (msg) => {
  const chatId = msg.chat.id;
  const user = await User.findOne({ id: chatId });
  if (user) {
    return bot.sendMessage(msg.chat.id, "you are already registered");
  }

  await bot.sendMessage(chatId, "Please provide your phone number:", {
    reply_markup: {
      keyboard: [[{ text: "Share Phone Number", request_contact: true }]],
      one_time_keyboard: true,
    },
  });
});

bot.on("contact", async (msg) => {
  const userId = msg.chat.id;
  const user = await User.findOne({ id: userId });
  if (user) {
    return bot.sendMessage(msg.chat.id, "you are already registered");
  }

  try {
    const user = User({
      id: msg.chat.id,
      first_name: msg.chat.first_name,
      username: msg.chat.username,
      phone_number: msg.contact.phone_number,
    });
    await user.save();
    await bot.sendMessage(
      msg.chat.id,
      "Dear " +
        msg.contact.first_name.toUpperCase() +
        "," +
        "you  successfully Registered"
    );
  } catch (error) {
    console.log(error);
  }
});

let isPlaying = false;

bot.onText(/\/play/, (msg) => {
  const chatId = msg.chat.id;
  isPlaying = true;
  bot.sendMessage(chatId, "Guess a number between 1 and 9:", {
    reply_markup: {
      keyboard: [
        ["1", "2", "3"],
        ["4", "5", "6"],
        ["7", "8", "9"],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  if (isPlaying) {
    const computer_choice = Math.floor(Math.random() * 9) + 1;
    const userChoice = Number(msg.text);

    if (isNaN(userChoice) || userChoice < 1 || userChoice > 9) {
      await bot.sendMessage(
        chatId,
        "Invalid choice. Please enter a number between 1 and 9."
      );
      return;
    }

    if (userChoice === computer_choice) {
      await bot.sendMessage(chatId, "You won 10 Birr!");
      const user = await User.findOne({ id: chatId });
      user.balance += 10;
      await user.save();
      await bot.sendMessage(
        chatId,
        `Dear ${user.first_name}, your current balance is: ${user.balance} Birr`
      );
    } else {
      await bot.sendMessage(
        chatId,
        `You lose. The computer chose ${computer_choice}.`
      );
      const user = await User.findOne({ id: chatId });
      user.balance -= 3;
      await user.save();
      await bot.sendMessage(
        chatId,
        `Dear ${user.first_name}, your current balance is: ${user.balance} Birr`
      );
    }

    isPlaying = false;
  }
});

bot.onText(/\/balance/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const user = await User.findOne({ id: chatId });
    await bot.sendMessage(
      chatId,
      "Dear " + user.first_name + "\nYour current is: " + user.balance + "Birr"
    );
  } catch (error) {
    console.log(error);
  }
});

let withdrawContext = false;

bot.onText(/\/withdraw/, (msg) => {
  const chatId = msg.chat.id;
  withdrawContext = true;
  bot.sendMessage(chatId, "Please enter the withdrawal amount:");
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const withdrawAmount = +msg.text;

  if (withdrawContext) {
    if (isNaN(withdrawAmount)) {
      return bot.sendMessage(
        chatId,
        "Invalid withdrawal amount. Please provide a valid number."
      );
    }
    if (withdrawAmount < 0) {
      withdrawContext = false;
      return bot.sendMessage(
        chatId,
        "Invalid withdrawal amount. Please provide a positive number."
      );
    }

    const user = await User.findOne({ id: chatId });
    if (!user) {
      withdrawContext = false;
      return bot.sendMessage(
        chatId,
        "User not found. Please start a conversation with the bot first."
      );
    }

    try {
      if (user.balance < withdrawAmount) {
        withdrawContext = false;
        return bot.sendMessage(chatId, "Sorry, you have insufficient balance.");
      } else {
        user.balance -= withdrawAmount;
        await user.save();
        await bot.sendMessage(
          chatId,
          `Dear ${user.first_name}, you have successfully withdrawn ${withdrawAmount} Birr.\nYour current balance is: ${user.balance} Birr.`
        );
        withdrawContext = false;
      }
    } catch (error) {
      console.log(error);
      return bot.sendMessage(
        chatId,
        "An error occurred while processing your withdrawal. Please try again later."
      );
    }
  }
});

let deposit = false;

bot.onText(/\/deposit/, (msg) => {
  const chatId = msg.chat.id;
  deposit = true;
  bot.sendMessage(chatId, "Please enter the deposit amount:");
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const depositAmount = +msg.text;

  if (deposit) {
    if (isNaN(depositAmount)) {
      return bot.sendMessage(
        chatId,
        "Invalid deposit amount. Please provide a valid number."
      );
    }
    if (depositAmount < 0) {
      deposit = false;
      return bot.sendMessage(
        chatId,
        "Invalid deposit amount. Please provide a positive number."
      );
    }

    const user = await User.findOne({ id: chatId });
    if (!user) {
      deposit = false;
      return bot.sendMessage(
        chatId,
        "User not found. Please start a conversation with the bot first."
      );
    }

    try {
      user.balance += depositAmount;
      await user.save();
      await bot.sendMessage(
        chatId,
        `Dear ${user.first_name}, You are successfully successfully ${depositAmount} Birr.\nYour current balance is: ${user.balance} Birr.`
      );
      deposit = false;
    } catch (error) {
      return bot.sendMessage(
        chatId,
        "An error occurred while processing your withdrawal. Please try again later."
      );
    }
  }
});
