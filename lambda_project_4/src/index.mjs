

import { createTodo } from './create_todo.mjs';
import { deleteTodo } from './delete_todo.mjs';
import { getTodo } from './get_todo.mjs';

export const handler = async (event) => {

  try {
    
    const httpEvent = event.requestContext.http;

    const path = httpEvent.path;
    const method = httpEvent.method;

    console.log(event);
    
    if (path === '/todo' && method === 'POST') {
      return await createTodo(event);
    } else if (path === '/todo' && method === 'DELETE') {
      return await deleteTodo(event);
    } else if (path === '/todo' && method === 'GET') {
      return await getTodo(event);
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

