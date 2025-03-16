import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDB();
const dynamoDB = DynamoDBDocument.from(client);
const usersTable = "user_table";
const JWT_SECRET = "your_secret_key"; 

export const handler = async (event) => {
  try {
    
    const httpEvent = event.requestContext.http;

    const path = httpEvent.path;
    const method = httpEvent.method;
    
    if (path === '/register' && method === 'POST') {
      return await register(event);
    } else if (path === '/login' && method === 'POST') {
      return await login(event);
    } else {
      return {
        statusCode: 400,
        headers: {
          "Content-Type" : "application/json"
        },
        body: JSON.stringify({ message: 'Invalid request path or method' })
      };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type" : "application/json"
      },
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};

async function register(event) {
  const body = JSON.parse(event.body);
  const { username, password, email, fullName } = body;
  
  // Validate input
  if (!username || !password || !email) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type" : "application/json"
      },
      body: JSON.stringify({ message: 'Username, password, and email are required' })
    };
  }
  
  // Check if username already exists using the GSI
  const existingUserByUsername = await dynamoDB.query({
    TableName: usersTable,
    IndexName: 'username-index',
    KeyConditionExpression: 'username = :username',
    ExpressionAttributeValues: {
      ':username': username
    }
  });
  
  if (existingUserByUsername.Items && existingUserByUsername.Items.length > 0) {
    return {
      statusCode: 409,
      headers: {
        "Content-Type" : "application/json"
      },
      body: JSON.stringify({ message: 'Username already exists' })
    };
  }
  
  // Generate a unique userId
  const userId = uuidv4();
  
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  // Create user record
  const user = {
    userId,
    username,
    password: hashedPassword,
    email,
    fullName: fullName || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  await dynamoDB.put({
    TableName: usersTable,
    Item: user
  });
  
  // Create JWT token
  const token = jwt.sign(
    { userId: user.userId, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  return {
    statusCode: 201,
    headers: {
      "Content-Type" : "application/json"
    },
    body: JSON.stringify({ 
      message: 'User registered successfully',
      token,
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        fullName: user.fullName
      }
    })
  };
}

async function login(event) {
  const body = JSON.parse(event.body);
  const { username, password } = body;
  
  // Validate input
  if (!username || !password) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type" : "application/json"
      },
      body: JSON.stringify({ message: 'Username and password are required' })
    };
  }
  
  // Get user from database using the username GSI
  const result = await dynamoDB.query({
    TableName: usersTable,
    IndexName: 'username-index',
    KeyConditionExpression: 'username = :username',
    ExpressionAttributeValues: {
      ':username': username
    }
  });
  
  if (!result.Items || result.Items.length === 0) {
    return {
      statusCode: 401,
      headers: {
        "Content-Type" : "application/json"
      },
      body: JSON.stringify({ message: 'Invalid credentials' })
    };
  }
  
  const user = result.Items[0];
  
  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    return {
      statusCode: 401,
      headers: {
        "Content-Type" : "application/json"
      },
      body: JSON.stringify({ message: 'Invalid credentials' })
    };
  }
  
  // Create JWT token
  const token = jwt.sign(
    { userId: user.userId, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  return {
    statusCode: 200,
    headers: {
      "Content-Type" : "application/json"
    },
    body: JSON.stringify({ 
      message: 'Login successful',
      token,
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        fullName: user.fullName
      }
    })
  };
}