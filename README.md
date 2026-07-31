# AWS Lambda + DynamoDB Task Manager

A serverless Todo/Task Manager API built with the [Serverless Framework](https://www.serverless.com/), AWS Lambda, and Amazon DynamoDB. Each CRUD operation is implemented as its own Lambda function, exposed through API Gateway.

## Features

- Create, list, retrieve, update, and delete todo items
- Data persisted in a pay-per-request DynamoDB table
- CORS enabled on all endpoints
- Infrastructure as code via `serverless.yml`

## Tech Stack

- **Runtime:** Node.js 20.x
- **Framework:** [Serverless Framework](https://www.serverless.com/) v4
- **Cloud provider:** AWS (Lambda, API Gateway, DynamoDB)
- **SDK:** AWS SDK v3 (`@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`)
- **ID generation:** `uuid`

## Project Structure

```
.
├── handler/
│   ├── createTodo.js   # POST   /todos
│   ├── listTodos.js    # GET    /todos/list
│   ├── getTodo.js      # GET    /todos/{id}
│   ├── updateTodo.js   # PUT    /todos/update/{id}
│   └── deleteTodo.js   # DELETE /todos/delete/{id}
├── serverless.yml      # Service, function, and DynamoDB table definitions
├── package.json
└── .prettierrc
```

## Prerequisites

- Node.js 20.x
- An AWS account with configured credentials (`aws configure` or environment variables)
- [Serverless Framework CLI](https://www.serverless.com/framework/docs/getting-started) (`npm install -g serverless` or use `npx serverless`)

## Installation

```bash
npm install
```

## Deployment

Deploy the service to your default stage (`dev`) and region (`us-east-1`):

```bash
serverless deploy
```

Deploy to a specific stage:

```bash
serverless deploy --stage production
```

After deployment, the CLI prints the API base URL, e.g.:

```
endpoint: ANY - https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com
```

> **Note:** the DynamoDB table is created per stage (`todos-table-${stage}`) and is removed when you run `serverless remove`, since no `DeletionPolicy: Retain` is set.

## Running Locally

This project does not use `serverless-offline`, so there is no fully offline mode — `serverless dev` still provisions real AWS resources (Lambda, API Gateway, DynamoDB) but streams invocations to your machine, so you can edit code and test changes without redeploying after every change.

1. Make sure you completed [Prerequisites](#prerequisites) and [Installation](#installation) above (valid AWS credentials are required).
2. Start the dev session:

   ```bash
   serverless dev
   ```

3. Serverless will deploy the stack once (first run only) and then open a live connection. Any request sent to the deployed API URL is forwarded to your local machine, executed with your local code, and the response is sent back — so you can see logs and iterate quickly.
4. Call the API exactly as described in [API Reference](#api-reference) below, using the endpoint URL printed in the terminal.
5. Press `Ctrl+C` to stop the dev session. Your code keeps running in the cloud with the last deployed version until you run `serverless deploy` again or `serverless remove` to tear it down.

> **Known limitation:** `handler/getTodo.js`, `handler/updateTodo.js`, and `handler/deleteTodo.js` import the legacy `aws-sdk` (v2) package, which is **not listed in `package.json`**. It works when deployed because the AWS Lambda Node.js runtime bundles `aws-sdk` v2 by default, but it is not guaranteed to be present for any tooling that runs your code outside of Lambda (e.g. `serverless-offline` or plain `node`/Jest tests). `handler/createTodo.js` and `handler/listTodos.js` use the modern, explicitly-installed AWS SDK v3 packages instead. If you add offline testing later, either install `aws-sdk` as a dev dependency or migrate the remaining handlers to SDK v3 for consistency.

## API Reference

Base URL: `https://<api-id>.execute-api.<region>.amazonaws.com`

### Create a todo

```
POST /todos
Content-Type: application/json

{ "todo": "Buy groceries" }
```

Response `200`:

```json
{
  "id": "generated-uuid",
  "todo": "Buy groceries",
  "checked": false,
  "createdAt": 1690000000000,
  "updatedAt": 1690000000000
}
```

### List all todos

```
GET /todos/list
```

Response `200`: array of todo items.

### Get a single todo

```
GET /todos/{id}
```

Response `200`: the todo item, or `404` if not found.

### Update a todo

```
PUT /todos/update/{id}
Content-Type: application/json

{ "todo": "Buy groceries and cook dinner", "checked": true }
```

Response `200`: the updated todo item.

### Delete a todo

```
DELETE /todos/delete/{id}
```

Response `200`:

```json
{ "data": "Deletion Successful!" }
```

## Testing the API with curl

```bash
BASE_URL="https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com"

# Create
curl -X POST "$BASE_URL/todos" \
  -H "Content-Type: application/json" \
  -d '{"todo": "Buy groceries"}'

# List
curl "$BASE_URL/todos/list"

# Get by id
curl "$BASE_URL/todos/<id>"

# Update
curl -X PUT "$BASE_URL/todos/update/<id>" \
  -H "Content-Type: application/json" \
  -d '{"todo": "Buy groceries", "checked": true}'

# Delete
curl -X DELETE "$BASE_URL/todos/delete/<id>"
```

## Infrastructure

Defined in `serverless.yml`:

- **DynamoDB table** `todos-table-${stage}` — partition key `id` (String), `PAY_PER_REQUEST` billing mode.
- **IAM role** scoped to the table, granting `Query`, `Scan`, `GetItem`, `PutItem`, `UpdateItem`, and `DeleteItem`.
- **Environment variable** `TODO_TABLE` injected into every function with the table name.

## Removing the Service

```bash
serverless remove
```

This deletes the CloudFormation stack, including the DynamoDB table and all stored data.
