import session from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import { env } from './env.js';

export function configureSession() {
  const store = MongoStore.create({
    clientPromise: new Promise((resolve) => {
      if (mongoose.connection.readyState === 1) {
        resolve(mongoose.connection.getClient());
      } else {
        mongoose.connection.once('open', () => {
          resolve(mongoose.connection.getClient());
        });
      }
    }),
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60 // 14 days
  });

  return session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      maxAge: 14 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    }
  });
}
