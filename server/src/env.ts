// This file MUST be imported first to load environment variables
import dotenv from 'dotenv';
const result = dotenv.config();
console.log('ENV LOADED:', result.error ? 'ERROR' : 'SUCCESS');
console.log('VAPID_PUBLIC_KEY after load:', process.env.VAPID_PUBLIC_KEY ? 'SET' : 'NOT SET');

export {};
