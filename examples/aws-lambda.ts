/**
 * AWS Lambda Serverless example with Froot.
 * Supports API Gateway v2 HTTP APIs and Lambda Function URLs.
 */

import { Froot } from '../src/index.js';
import { handle, type LambdaEventV2 } from '../src/adapters/aws-lambda.js';

const app = new Froot();

app.get('/lambda-hello', (c) => {
  return c.json({
    message: 'Hello from AWS Lambda Function URL / API Gateway v2!',
    timestamp: new Date().toISOString()
  });
});

app.post('/items', async (c) => {
  const body = await c.req.json<{ name: string; price: number }>();
  return c.json({ created: true, item: body }, 201);
});

// Export Lambda handler
export const handler = handle(app);

// Self-test demonstration if executed directly via Node.js
async function runSelfTest() {
  const mockEvent: LambdaEventV2 = {
    rawPath: '/lambda-hello',
    rawQueryString: 'verbose=true',
    headers: {
      host: 'xyz.lambda-url.us-east-1.on.aws',
      'x-forwarded-proto': 'https'
    },
    requestContext: {
      http: {
        method: 'GET',
        path: '/lambda-hello'
      }
    }
  };

  const result = await handler(mockEvent);
  console.log('Lambda Result status:', result.statusCode);
  console.log('Lambda Result body:', result.body);
}

if (process.env['NODE_ENV'] !== 'production' && !process.env['AWS_LAMBDA_FUNCTION_NAME']) {
  void runSelfTest();
}
