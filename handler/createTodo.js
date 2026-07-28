const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v1: uuidv1 } = require('uuid');

const TODO_TABLE = process.env.TODO_TABLE;
const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

module.exports.createTodo = async (event) => {
  const timestamp = new Date().getTime();

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (parseError) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  if (typeof data.todo !== 'string') {
    console.error('Validation Failed');
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Validation failed: "todo" must be a string',
      }),
    };
  }

  const newTodo = {
    id: uuidv1(),
    todo: data.todo,
    checked: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const params = {
    TableName: TODO_TABLE,
    Item: newTodo,
  };

  try {
    await docClient.send(new PutCommand(params));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify(newTodo),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not create todo item' }),
    };
  }
};
