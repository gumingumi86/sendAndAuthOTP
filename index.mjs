import { Rcon } from 'rcon-client';

const otpStore = new Map(); // ユーザーIDとOTPを一時的に保持
const headers = {
  'Access-Control-Allow-Origin': 'https://www.usagi-server.com',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
  'Content-Type': 'application/json'
};

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({ message: "CORS preflight check passed" }),
    };
  }
  const { action, userId, otp: inputOtp } = JSON.parse(event.body);

  if (action === 'send') {
    // OTP生成
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6桁のランダムな数字
    otpStore.set(userId, otp); // OTPを保存

    // Rconを使ってMinecraft内のユーザーにOTPを送信
    const rcon = new Rcon({
      host: '13.231.11.150', // Rconサーバーのホスト
      port: 25575,       // Rconサーバーのポート
      password: 'rcon-password', // Rconのパスワード
    });

    try {
      await rcon.connect();
      await rcon.send(`/tell ${userId} Your OTP is: ${otp}`);
      await rcon.end();
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'OTP sent successfully.' }),
        headers: headers
      };
    } catch (error) {
      console.error('Error sending OTP:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Failed to send OTP' }),
        headers: headers,
      };
    }
  } else if (action === 'auth') {
    // OTP検証
    const storedOtp = otpStore.get(userId);
    if (storedOtp && storedOtp === inputOtp) {
      otpStore.delete(userId); // OTPを削除
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'OTP verified successfully.' }),
        headers: headers,
      };
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Invalid OTP.' }),
        headers: headers,
      };
    }
  } else {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Invalid action.' }),
      headers: headers,
    };
  }
};