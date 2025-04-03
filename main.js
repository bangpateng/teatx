const ethers = require('ethers');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Configuration
const CONFIG = {
  rpcUrl: process.env.RPC_URL || 'https://tea-sepolia.g.alchemy.com/public',
  privateKey: process.env.PRIVATE_KEY,
  minAmount: process.env.MIN_AMOUNT || '0.001',
  maxAmount: process.env.MAX_AMOUNT || '0.01',
  intervalMinutes: parseInt(process.env.INTERVAL_MINUTES) || 1
};

// Check .env required values
if (!CONFIG.privateKey) {
  console.error('Error: PRIVATE_KEY is required in .env file');
  process.exit(1);
}

// Read recipient addresses from address.txt
const addressFilePath = path.join(__dirname, 'address.txt');
if (!fs.existsSync(addressFilePath)) {
  console.error('Error: address.txt not found!');
  process.exit(1);
}
const recipientAddresses = fs
  .readFileSync(addressFilePath, 'utf-8')
  .split('\n')
  .map(addr => addr.trim())
  .filter(Boolean);

// Create logs directory if not exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Logging
const logFile = path.join(logsDir, 'autosender.log');
const log = (message) => {
  const timestamp = new Date().toISOString();
  const entry = `${timestamp} - ${message}\n`;
  console.log(message);
  fs.appendFileSync(logFile, entry);
};

// Generate random amount
const getRandomAmount = () => {
  const min = parseFloat(CONFIG.minAmount);
  const max = parseFloat(CONFIG.maxAmount);
  const randomAmount = Math.random() * (max - min) + min;
  return randomAmount.toFixed(6);
};

// Initialize wallet
let provider;
let wallet;
const initializeWallet = async () => {
  try {
    provider = new ethers.providers.JsonRpcProvider(CONFIG.rpcUrl);
    wallet = new ethers.Wallet(CONFIG.privateKey, provider);
    const balance = await provider.getBalance(wallet.address);
    log(`Wallet initialized: ${wallet.address}`);
    log(`Wallet balance: ${ethers.utils.formatEther(balance)} TEA`);
    return true;
  } catch (error) {
    log(`Error initializing wallet: ${error.message}`);
    return false;
  }
};

// Send transaction to one recipient
const sendTransaction = async (recipient) => {
  try {
    const amountToSend = getRandomAmount();
    const amountToSendWei = ethers.utils.parseEther(amountToSend);

    const balance = await provider.getBalance(wallet.address);
    const gasPrice = await provider.getGasPrice();
    const gasLimit = 21000;
    const gasCost = gasPrice.mul(gasLimit);
    const totalCost = amountToSendWei.add(gasCost);

    if (balance.lt(totalCost)) {
      log(`Insufficient balance for ${recipient}. Required (w/ gas): ${ethers.utils.formatEther(totalCost)} TEA`);
      return;
    }

    const tx = {
      to: recipient,
      value: amountToSendWei,
      gasPrice,
      gasLimit
    };

    log(`Sending ${amountToSend} TEA to ${recipient}...`);
    const transaction = await wallet.sendTransaction(tx);
    log(`Tx sent! Hash: ${transaction.hash}`);
    log(`Explorer: https://sepolia.tea.xyz/tx/${transaction.hash}`);
    const receipt = await transaction.wait(1);

    if (receipt.status === 1) {
      log(`✅ Confirmed: Sent ${amountToSend} TEA to ${recipient}`);
    } else {
      log(`❌ Failed: ${recipient}`);
    }
  } catch (error) {
    log(`Error sending to ${recipient}: ${error.message}`);
  }
};

// Main loop
const startAutoSender = async () => {
  log('===== TEA Multi-Address Auto Sender Started =====');
  log(`Total recipients: ${recipientAddresses.length}`);
  log(`Amount range: ${CONFIG.minAmount} - ${CONFIG.maxAmount} TEA`);
  log(`Interval: ${CONFIG.intervalMinutes} minutes\n`);

  await initializeWallet();

  const sendToAll = async () => {
    for (const recipient of recipientAddresses) {
      await sendTransaction(recipient);
    }
  };

  await sendToAll(); // Initial
  setInterval(sendToAll, CONFIG.intervalMinutes * 60 * 1000);
};

// Error handling
process.on('uncaughtException', (err) => log(`Uncaught Exception: ${err.message}`));
process.on('unhandledRejection', (reason) => log(`Unhandled Rejection: ${reason}`));
process.on('SIGINT', () => {
  log('⛔ Stopped by user.');
  process.exit(0);
});

startAutoSender();
