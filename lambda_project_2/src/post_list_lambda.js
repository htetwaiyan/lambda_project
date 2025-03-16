import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
 
const client = new DynamoDB();
const dynamoDB = DynamoDBDocument.from(client);
const postsTable = "post_table";

export const handler = async (event) => {
  try {
    
    const httpEvent = event.requestContext.http;
    const path = httpEvent.path;
    const method = httpEvent.method;
    
    if (path === '/blog' && method === 'GET') {
      const queryParams = event.queryStringParameters || {};
      return await listPosts(queryParams);
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

async function listPosts(queryParams) {
  const { userId, username, limit = 10, lastEvaluatedKey } = queryParams;
  
  if (userId) {
    const params = {
      TableName: postsTable,
      IndexName: 'userId-createdAt-index', 
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false, // to get the most recent posts first
      Limit: parseInt(limit)
    };
    
    // Add pagination if lastEvaluatedKey is provided
    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = JSON.parse(decodeURIComponent(lastEvaluatedKey));
    }
    
    const result = await dynamoDB.query(params);
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type" : "application/json"
      },
      body: JSON.stringify({
        posts: result.Items,
        lastEvaluatedKey: result.LastEvaluatedKey 
          ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) 
          : null
      })
    };
  }
  
  // If username is provided but not userId, we need to find posts by username
  if (username) {
    const params = {
      TableName: postsTable,
      FilterExpression: 'username = :username',
      ExpressionAttributeValues: {
        ':username': username
      },
      Limit: parseInt(limit)
    };
    
    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = JSON.parse(decodeURIComponent(lastEvaluatedKey));
    }
    
    const result = await dynamoDB.scan(params);
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type" : "application/json"
      },
      body: JSON.stringify({
        posts: result.Items,
        lastEvaluatedKey: result.LastEvaluatedKey 
          ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) 
          : null
      })
    };
  }
  
  // For all posts 
  let params = {
    TableName: postsTable,
    Limit: parseInt(limit)
  };
  
  // Add pagination if lastEvaluatedKey is provided
  if (lastEvaluatedKey) {
    params.ExclusiveStartKey = JSON.parse(decodeURIComponent(lastEvaluatedKey));
  }
  
  const result = await dynamoDB.scan(params);
  
  return {
    statusCode: 200,
    headers: {
      "Content-Type" : "application/json"
    },
    body: JSON.stringify({
      posts: result.Items,
      lastEvaluatedKey: result.LastEvaluatedKey 
        ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) 
        : null
    })
  };
}
