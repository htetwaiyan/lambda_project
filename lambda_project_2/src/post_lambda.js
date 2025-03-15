import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDB();
const dynamoDB = DynamoDBDocument.from(client);
const postsTable = "post_table";
const JWT_SECRET = "your_secret_key";

export const handler = async (event) => {
  try {

    
    const token = event.headers.authorization?.split(' ')[1];
    let user;
    
    try {
      if (!token) {
        return { 
          statusCode: 401,
          body: JSON.stringify({ message: 'Authentication required' })
        };
      }
      
      user = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Invalid or expired token' })
      };
    }

    const httpEvent = event.requestContext.http;

    const path = httpEvent.path;
    const method = httpEvent.method;
    
    if (path === '/blog' && method === 'POST') {
      return await createPost(event, user);
    } else if (path.startsWith('/blog') && method === 'DELETE') {
      const postId = event.queryStringParameters.postId;
      return await deletePost(postId, user);
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid request path or method' })
      };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};

async function createPost(event, user) {

  if(!event.body){
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Title and content are required' })
    };
  }
  const body = JSON.parse(event.body);
  const { title, content } = body;
  
  // Validate input
  if (!title || !content) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Title and content are required' })
    };
  }
  
  const timestamp = new Date().toISOString();
  const blogId = uuidv4();
  
  const post = {
    blogId,
    userId: user.userId,
    username: user.username,
    title,
    content,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  
  await dynamoDB.put({
    TableName: postsTable,
    Item: post
  });
  
  return {
    statusCode: 201,
    body: JSON.stringify({ 
      message: 'Post created successfully',
      post 
    })
  };
}

async function deletePost(blogId, user) {
  // First check if the post exists and belongs to the user
  const result = await dynamoDB.get({
    TableName: postsTable,
    Key: { blogId }
  });

  console.log(result);
  
  const post = result.Item;
  
  if (!post) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'Post not found' })
    };
  }
  
  // Check if the user is the owner of the post
  if (post.userId !== user.userId) {
    return {
      statusCode: 403,
      body: JSON.stringify({ message: 'You do not have permission to delete this post' })
    };
  }
  
  await dynamoDB.delete({
    TableName: postsTable,
    Key: { blogId }
  }); 
  
  return {
    statusCode: 200,
    body: JSON.stringify({ 
      message: 'Post deleted successfully',
      blogId 
    })
  };
}