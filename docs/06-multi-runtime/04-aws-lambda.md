# Lesson 6.4: AWS Lambda & Serverless

AWS Lambda executes code in response to events triggered by **API Gateway HTTP APIs (v2)** or **Lambda Function URLs**.

Froot includes a high-performance adapter in `froot/adapters/aws-lambda` that serializes incoming Lambda event payloads into Web Requests and formats Web Responses back into API Gateway v2 payloads with zero external dependencies.

---

## 1. Setting up the Lambda Handler

Create your handler file:

```typescript
import { Froot } from 'froot';
import { handle } from 'froot/adapters/aws-lambda';

const app = new Froot();

// Define API routes as usual
app.get('/lambda-api/users/:id', (c) => {
  return c.json({
    id: c.param('id'),
    source: 'AWS Lambda Function URL',
    region: process.env.AWS_REGION
  });
});

app.post('/lambda-api/orders', async (c) => {
  const order = await c.req.json<{ item: string; price: number }>();
  return c.json({ created: true, order }, 201);
});

// Export the AWS Lambda entrypoint
export const handler = handle(app);
```

---

## 2. Supported Lambda Features

The Froot Lambda adapter automatically manages:
- **API Gateway v2 & Function URLs:** Extracts method, path, headers, and query strings.
- **Cookies:** Parses incoming `event.cookies` and formats outgoing `Set-Cookie` headers into Lambda's `cookies` string array.
- **Base64 Decoded Bodies:** Automatically decodes binary or base64-encoded request bodies (`event.isBase64Encoded`).
- **Response Headers:** Preserves multi-value and standard response headers.

---

## 3. Serverless Framework / AWS SAM / CDK Configuration

### AWS SAM Example:
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  FrootFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: dist/
      Handler: index.handler
      Runtime: nodejs22.x
      FunctionUrlConfig:
        AuthType: NONE
```

---

## Next Steps
In the next chapter, we will explore Froot's Zero-Codegen Type-Safe RPC Client, enabling end-to-end type sharing between backend and frontend.
- Proceed to [Lesson 7.1: Type-Safe Client RPC](../07-rpc-client/01-zero-codegen-rpc.md)
